const riskPoints = {
  critical: 5,
  high: 3,
  medium: 2,
  low: 1,
};

export function calculateRisk(findings = []) {
  const riskScore = findings.reduce((score, finding) => {
    const points = riskPoints[finding.risk] ?? 0;
    return score + points;
  }, 0);

  let riskLevel = "low";
  if (riskScore >= 12) {
    riskLevel = "high";
  } else if (riskScore >= 5) {
    riskLevel = "medium";
  }

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
  };
}
