/**
 * Policy Engine
 *
 * Decides the response action (block / mask / allow) based on risk level and
 * user-supplied options.
 *
 * Flow:  Detection → Risk Engine → Policy Engine → Response
 */

/**
 * Evaluate the policy for the current analysis result.
 *
 * @param {string} riskLevel  – "low" | "medium" | "high"
 * @param {Array}  findings   – Findings from analysis.
 * @param {Object} options    – User request options.
 * @param {boolean} [options.block_high_risk=false]
 * @param {boolean} [options.mask=false]
 * @returns {{ action: "blocked"|"masked"|"allowed", reason?: string }}
 */
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
