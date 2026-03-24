function getRiskBadgeClass(riskLevel) {
  if (riskLevel === "critical") {
    return "risk-badge risk-critical";
  }
  if (riskLevel === "high") {
    return "risk-badge risk-high";
  }
  if (riskLevel === "medium") {
    return "risk-badge risk-medium";
  }
  return "risk-badge risk-low";
}

const findingMetadata = {
  password: { icon: "SEC", label: "Password", severity: "critical", severityLabel: "CRITICAL" },
  credential_pair: {
    icon: "SEC",
    label: "Credential Pair",
    severity: "critical",
    severityLabel: "CRITICAL",
  },
  api_key: { icon: "KEY", label: "API Key", severity: "high", severityLabel: "HIGH" },
  token: { icon: "KEY", label: "Token", severity: "high", severityLabel: "HIGH" },
  stack_trace: { icon: "WARN", label: "Stack Trace", severity: "medium", severityLabel: "MEDIUM" },
  exception: { icon: "WARN", label: "Exception", severity: "medium", severityLabel: "MEDIUM" },
  error_leak: { icon: "WARN", label: "Error Leak", severity: "medium", severityLabel: "MEDIUM" },
  suspicious_pattern: {
    icon: "WARN",
    label: "Suspicious Pattern",
    severity: "medium",
    severityLabel: "MEDIUM",
  },
  email: { icon: "MAIL", label: "Email", severity: "low", severityLabel: "LOW" },
  phone_number: { icon: "INFO", label: "Phone Number", severity: "low", severityLabel: "LOW" },
  failed_login: { icon: "WARN", label: "Failed Login", severity: "low", severityLabel: "LOW" },
  private_key_material: {
    icon: "KEY",
    label: "Private Key Material",
    severity: "critical",
    severityLabel: "CRITICAL",
  },
};

function getFindingViewModel(finding) {
  const fallback = {
    icon: "WARN",
    label: finding.type.replaceAll("_", " "),
    severity: finding.risk,
    severityLabel: finding.risk.toUpperCase(),
  };

  return findingMetadata[finding.type] || fallback;
}

export default function ResultsPanel({ result }) {
  if (!result) {
    return (
      <section className="panel results-panel">
        <h2>Results</h2>
        <p className="muted">Run an analysis to see findings, risk score, and insights.</p>
      </section>
    );
  }

  return (
    <section className="panel results-panel">
      <div className="results-top">
        <div>
          <h2>Risk Overview</h2>
          <p>{result.summary}</p>
          {result.explanation ? <p className="risk-explanation">{result.explanation}</p> : null}
        </div>
        <div className={getRiskBadgeClass(result.risk_level)}>
          {result.risk_level.toUpperCase()} ({result.risk_score})
        </div>
      </div>

      <div className="results-grid">
        <div>
          <h3>Findings ({result.findings.length})</h3>
          <div className="findings-list">
            {result.findings.length === 0 ? (
              <p className="muted">No risky patterns found.</p>
            ) : (
              result.findings.map((finding, index) => {
                const view = getFindingViewModel(finding);

                return (
                  <article
                    key={`${finding.type}-${finding.line}-${index}`}
                    className={`finding risk-${view.severity}`}
                  >
                    <div className="finding-top">
                      <strong>
                        {view.icon} {view.severityLabel} - {view.label} (Line {finding.line})
                      </strong>
                      <span className={`severity-pill severity-${view.severity}`}>{view.severityLabel}</span>
                    </div>
                    <p>{finding.message}</p>
                    {finding.match ? <code>{finding.match}</code> : null}
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h3>Insights</h3>
          <ul className="insights-list">
            {result.insights.map((insight, index) => (
              <li key={`insight-${index}`}>{insight}</li>
            ))}
          </ul>

          <div className="recommended-actions">
            <h3>Recommended Actions</h3>
            {result.recommended_actions?.length ? (
              <ul className="actions-list">
                {result.recommended_actions.map((action, index) => (
                  <li key={`action-${index}`}>{action}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No additional remediation actions required for current findings.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
