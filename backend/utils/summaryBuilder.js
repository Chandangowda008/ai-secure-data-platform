function countRisk(findings) {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.risk] = (acc[finding.risk] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}

function countType(findings, type) {
  return findings.filter((finding) => finding.type === type).length;
}

export function buildSummary(findings, risk) {
  if (!findings.length) {
    return "No sensitive data exposure or suspicious log patterns were detected.";
  }

  const riskCount = countRisk(findings);
  const apiKeyCount = countType(findings, "api_key");
  const passwordCount = countType(findings, "password") + countType(findings, "credential_pair");
  const tokenCount = countType(findings, "token");
  const piiCount = countType(findings, "email") + countType(findings, "phone_number");
  const exceptionCount = countType(findings, "exception") + countType(findings, "stack_trace");

  if (passwordCount > 0) {
    return `Critical security risk detected: plain text credential exposure (${passwordCount} event${passwordCount > 1 ? "s" : ""}) with additional ${risk.risk_level} severity indicators.`;
  }

  if (apiKeyCount > 0 && (tokenCount > 0 || piiCount > 0 || exceptionCount > 0)) {
    return "Critical security risk detected: API key exposure with additional sensitive data leaks.";
  }

  if (apiKeyCount > 0 || tokenCount > 0) {
    const secretLeakCount = apiKeyCount + tokenCount;
    return `High-impact secret exposure detected: ${secretLeakCount} API key/token event${secretLeakCount > 1 ? "s" : ""} identified with overall ${risk.risk_level} risk.`;
  }

  if (exceptionCount >= 2) {
    return `Operational data leak risk detected: ${exceptionCount} stack trace or exception entries were exposed in logs.`;
  }

  if (riskCount.high + riskCount.critical >= 3) {
    return `Elevated security exposure detected: ${riskCount.high + riskCount.critical} high-severity signals indicate probable sensitive data leakage.`;
  }

  return `Security review complete: ${findings.length} risk signal${findings.length > 1 ? "s" : ""} detected with an overall ${risk.risk_level} risk profile.`;
}
