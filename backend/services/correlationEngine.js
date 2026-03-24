/**
 * Correlation Engine
 *
 * Analyzes relationships across multiple log findings to detect
 * coordinated or suspicious activity patterns.
 */

/**
 * Correlate findings to identify suspicious patterns across entries.
 *
 * @param {Array} findings – Array of finding objects from analysis.
 * @returns {Array} Array of correlation insight objects.
 */
export function correlateFindings(findings = []) {
  const correlations = [];

  // 1. Group IP addresses and flag repeated ones
  const ipFindings = findings.filter((f) => f.type === "ip_address");
  const ipCounts = new Map();

  for (const f of ipFindings) {
    const ip = f.match;
    ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
  }

  for (const [ip, count] of ipCounts) {
    if (count >= 3) {
      correlations.push({
        type: "suspicious_ip",
        severity: "high",
        message: `IP ${ip} appears ${count} times across log entries — possible suspicious activity.`,
        value: ip,
        occurrences: count,
      });
    }
  }

  // 2. Group failed logins and flag brute-force suspects
  const failedLogins = findings.filter((f) => f.type === "failed_login");
  if (failedLogins.length >= 3) {
    correlations.push({
      type: "brute_force_suspect",
      severity: "high",
      message: `${failedLogins.length} failed login attempts detected — possible brute-force attack.`,
      occurrences: failedLogins.length,
    });
  }

  // 3. Credential exposure correlation
  const credentialTypes = new Set(["password", "api_key", "token", "credential_pair", "private_key_material"]);
  const credentialFindings = findings.filter((f) => credentialTypes.has(f.type));
  if (credentialFindings.length >= 2) {
    const types = [...new Set(credentialFindings.map((f) => f.type))];
    correlations.push({
      type: "multiple_credential_exposure",
      severity: "critical",
      message: `Multiple credential types exposed: ${types.join(", ")}. Indicates widespread secret leakage.`,
      credential_types: types,
      occurrences: credentialFindings.length,
    });
  }

  return correlations;
}
