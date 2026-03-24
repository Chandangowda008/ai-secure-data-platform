const patternCatalog = [
  {
    type: "email",
    risk: "medium",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    message: "Email address exposed in logs",
  },
  {
    type: "phone_number",
    risk: "medium",
    regex: /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g,
    message: "Phone number exposed in logs",
  },
  {
    type: "api_key",
    risk: "critical",
    regex: /\b(?:sk-[A-Za-z0-9]{16,}|(?:api[_-]?key|access[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9\-_]{16,})\b/gi,
    message: "API key exposed in logs",
  },
  {
    type: "password",
    risk: "critical",
    regex: /\b(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{4,}/gi,
    message: "Password-like value detected",
  },
  {
    type: "token",
    risk: "high",
    regex: /\b(?:token|jwt|auth[_-]?token|bearer)\s*[:=]\s*["']?[A-Za-z0-9\-_.=]{8,}/gi,
    message: "Authentication token detected",
  },
  {
    type: "private_key_material",
    risk: "critical",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    message: "Private key material exposed",
  },
  {
    type: "credential_pair",
    risk: "high",
    regex: /\b(?:username|user|login)\s*[:=]\s*[^\s]+\s+.*\b(?:password|passwd|pwd)\s*[:=]\s*[^\s]+/gi,
    message: "Username and password pair found in one line",
  },
];

function normalizeMatch(matchValue, maxLength = 120) {
  if (typeof matchValue !== "string") {
    return "";
  }

  return matchValue.length > maxLength
    ? `${matchValue.slice(0, maxLength)}...`
    : matchValue;
}

function collectMatches(line, lineNumber, pattern) {
  const findings = [];

  const iterator = line.matchAll(pattern.regex);
  for (const match of iterator) {
    findings.push({
      type: pattern.type,
      risk: pattern.risk,
      line: lineNumber,
      match: normalizeMatch(match[0]),
      message: pattern.message,
    });
  }

  return findings;
}

export function scanLineWithRegex(line, lineNumber) {
  if (!line || typeof line !== "string") {
    return [];
  }

  const allFindings = [];
  for (const pattern of patternCatalog) {
    const lineFindings = collectMatches(line, lineNumber, pattern);
    allFindings.push(...lineFindings);
  }

  return allFindings;
}
