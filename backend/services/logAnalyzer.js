import { scanLineWithRegex } from "./regexScanner.js";
import { processInChunks } from "../utils/chunkProcessor.js";

const MAX_LINES = Number(process.env.MAX_ANALYZE_LINES || 50000);
const CHUNK_SIZE = Number(process.env.ANALYZE_CHUNK_SIZE || 500);

function buildFinding(type, risk, line, message, match, category) {
  return {
    type,
    risk,
    line,
    message,
    match,
    category,
  };
}

function detectExceptionPatterns(line, lineNumber) {
  const findings = [];

  if (/\b(exception|traceback|fatal|uncaught|segmentation fault)\b/i.test(line)) {
    findings.push(
      buildFinding(
        "exception",
        "high",
        lineNumber,
        "Exception detail exposed in logs",
        line.trim().slice(0, 140),
        "error_leak"
      )
    );
  }

  if (/\b(error:\s|stack\s*trace)\b/i.test(line)) {
    findings.push(
      buildFinding(
        "error_leak",
        "medium",
        lineNumber,
        "Error context leaked to logs",
        line.trim().slice(0, 140),
        "error_leak"
      )
    );
  }

  if (/^\s*at\s+.+\(.+\)$/.test(line) || /^\s*at\s+.+$/.test(line)) {
    findings.push(
      buildFinding(
        "stack_trace",
        "high",
        lineNumber,
        "Stack trace frame detected",
        line.trim().slice(0, 140),
        "error_leak"
      )
    );
  }

  return findings;
}

function detectSuspiciousPatterns(line, lineNumber) {
  const findings = [];

  if (/\b(select\s+.+\s+from|union\s+select|drop\s+table|or\s+1=1)\b/i.test(line)) {
    findings.push(
      buildFinding(
        "suspicious_pattern",
        "medium",
        lineNumber,
        "Suspicious query-like input observed in logs",
        line.trim().slice(0, 140),
        "suspicious_activity"
      )
    );
  }

  if (/(\.\.\\|\.\.\/|\/etc\/passwd|<script>|cmd\.exe|powershell\s+-enc)/i.test(line)) {
    findings.push(
      buildFinding(
        "suspicious_pattern",
        "high",
        lineNumber,
        "Path traversal or command injection indicator found",
        line.trim().slice(0, 140),
        "suspicious_activity"
      )
    );
  }

  return findings;
}

function detectFailedLogin(line, lineNumber) {
  if (/\b(failed login|login failed|invalid password|authentication failed|unauthorized)\b/i.test(line)) {
    return buildFinding(
      "failed_login",
      "low",
      lineNumber,
      "Failed authentication attempt logged",
      line.trim().slice(0, 140),
      "suspicious_activity"
    );
  }

  return null;
}

function deduplicateFindings(findings) {
  const seen = new Set();
  const unique = [];

  for (const finding of findings) {
    const key = `${finding.type}:${finding.line}:${finding.match}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(finding);
    }
  }

  return unique;
}

export async function analyzeLogContent(rawInput = "") {
  const safeInput = typeof rawInput === "string" ? rawInput : String(rawInput || "");
  const allLines = safeInput.split(/\r?\n/);

  const truncated = allLines.length > MAX_LINES;
  const lines = truncated ? allLines.slice(0, MAX_LINES) : allLines;

  const findings = [];
  let failedLogins = 0;

  await processInChunks(
    lines,
    async (chunk, chunkStart) => {
      for (let offset = 0; offset < chunk.length; offset += 1) {
        const line = chunk[offset] ?? "";
        const lineNumber = chunkStart + offset + 1;

        const regexFindings = scanLineWithRegex(line, lineNumber);
        findings.push(...regexFindings);

        const exceptionFindings = detectExceptionPatterns(line, lineNumber);
        findings.push(...exceptionFindings);

        const suspiciousFindings = detectSuspiciousPatterns(line, lineNumber);
        findings.push(...suspiciousFindings);

        const failedLoginFinding = detectFailedLogin(line, lineNumber);
        if (failedLoginFinding) {
          failedLogins += 1;
          findings.push(failedLoginFinding);
        }
      }
    },
    CHUNK_SIZE
  );

  const uniqueFindings = deduplicateFindings(findings);

  return {
    findings: uniqueFindings,
    metadata: {
      total_lines: allLines.length,
      analyzed_lines: lines.length,
      truncated,
      failedLogins,
    },
  };
}
