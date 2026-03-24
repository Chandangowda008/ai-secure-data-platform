export function evaluatePolicy(riskLevel, findings = [], options = {}) {
  const hasCritical = findings.some((f) => f.risk === "critical");

  if (options.block_high_risk && (riskLevel === "high" || hasCritical)) {
    return {
      action: "blocked",
      reason:
        "Input blocked by policy: risk level is high or critical findings detected.",
    };
  }

  if (options.mask) {
    return {
      action: "masked",
      reason: "Sensitive data has been masked per policy configuration.",
    };
  }

  return {
    action: "allowed",
  };
}
