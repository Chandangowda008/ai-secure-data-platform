import { analyzeLogContent } from "../services/logAnalyzer.js";
import { calculateRisk } from "../services/riskEngine.js";
import { evaluatePolicy } from "../services/policyEngine.js";
import { correlateFindings } from "../services/correlationEngine.js";
import { generateAIEnhancements } from "../utils/ollamaAI.js";
import { buildSummary } from "../utils/summaryBuilder.js";
import { maskSensitiveData, maskFindings } from "../utils/masking.js";
import { parseFileContent } from "../utils/fileParser.js";

const contentTypeMap = {
  text: "text",
  log: "logs",
  file: "file",
  sql: "sql",
  chat: "chat",
};

async function buildRawContent(req) {
  const { input_type: inputType, content } = req.body;

  if (inputType === "file") {
    return parseFileContent(req.file.buffer, req.file.originalname);
  }

  return content;
}

function normalizeFindings(findings) {
  return findings.map((item) => ({
    type: item.type,
    risk: item.risk,
    line: item.line,
    message: item.message,
    match: item.match,
  }));
}

export async function analyzeController(req, res) {
  const { input_type: inputType, options } = req.body;
  const rawContent = await buildRawContent(req);
  const contentType = contentTypeMap[inputType] || "text";

  const analysis = await analyzeLogContent(rawContent);
  const findings = normalizeFindings(analysis.findings);
  const risk = calculateRisk(analysis.findings);
  const policy = evaluatePolicy(risk.risk_level, findings, options);
  if (policy.action === "blocked") {
    res.status(403).json({
      content_type: contentType,
      action: policy.action,
      reason: policy.reason,
      risk_score: risk.risk_score,
      risk_level: risk.risk_level,
      findings_count: findings.length,
    });
    return;
  }
  const outputFindings =
    policy.action === "masked" ? maskFindings(findings) : findings;

  const maskedContent =
    policy.action === "masked" ? maskSensitiveData(rawContent, findings) : null;
  const correlations = correlateFindings(findings);
  const findingTypeCounts = {};
  for (const f of findings) {
    findingTypeCounts[f.type] = (findingTypeCounts[f.type] || 0) + 1;
  }

  const summary = buildSummary(analysis.findings, risk);
  const ai = await generateAIEnhancements(rawContent, findings, risk.risk_level);
  const durationMs = req.startTime ? Date.now() - req.startTime : null;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      JSON.stringify({
        requestId: req.requestId,
        findings_count: findings.length,
        risk_level: risk.risk_level,
        action: policy.action,
        duration_ms: durationMs,
      })
    );
  }

  res.status(200).json({
    content_type: contentType,
    action: policy.action,
    summary,
    findings: outputFindings,
    risk_score: risk.risk_score,
    risk_level: risk.risk_level,
    correlations,
    insights: ai.insights,
    recommended_actions: ai.recommended_actions,
    explanation: ai.explanation,
    metadata: {
      ...analysis.metadata,
      finding_type_counts: findingTypeCounts,
    },
    ...(maskedContent !== null && { masked_content: maskedContent }),
  });
}
