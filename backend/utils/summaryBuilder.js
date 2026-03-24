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
  const exceptionCount = countType(findings, "exception") + countType(findings, "stack_trace");

  if (apiKeyCount > 0) {
    return `Critical issue: ${apiKeyCount} API key exposure event(s) detected with overall ${risk.risk_level} risk.`;
  }

  if (exceptionCount >= 2) {
    return `Error leak pattern detected: ${exceptionCount} stack trace/exception entries found, overall risk ${risk.risk_level}.`;
  }

  if (riskCount.high + riskCount.critical >= 3) {
    return `High-severity findings detected (${riskCount.high + riskCount.critical} events), indicating probable sensitive data leakage.`;
  }

  return `Detected ${findings.length} risk signal(s) across log content with an overall ${risk.risk_level} risk profile.`;
}
