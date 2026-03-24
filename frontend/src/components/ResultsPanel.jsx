import { useState } from "react";

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
  ip_address: { icon: "NET", label: "IP Address", severity: "low", severityLabel: "LOW" },
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

function getActionBadgeClass(action) {
  if (action === "blocked") return "action-badge action-blocked";
  if (action === "masked") return "action-badge action-masked";
  return "action-badge action-allowed";
}

export default function ResultsPanel({ result }) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showFindings, setShowFindings] = useState(true);

  if (!result) {
    return (
      <section className="panel results-panel">
        <h2>Results</h2>
        <p className="muted">Run an analysis to see findings, risk score, and insights.</p>
      </section>
    );
  }

  // Handle blocked response
  if (result.action === "blocked") {
    return (
      <section className="panel results-panel">
        <div className="results-top">
          <div>
            <h2>Request Blocked</h2>
            <p className="blocked-reason">{result.reason}</p>
          </div>
          <div className={getActionBadgeClass(result.action)}>
            BLOCKED
          </div>
        </div>
        <div className="blocked-details">
          <p>Risk Level: <strong>{result.risk_level?.toUpperCase()}</strong> ({result.risk_score})</p>
          <p>Findings detected: <strong>{result.findings_count}</strong></p>
        </div>
      </section>
    );
  }

  const filteredFindings =
    severityFilter === "all"
      ? result.findings
      : result.findings.filter((f) => {
          const view = getFindingViewModel(f);
          return view.severity === severityFilter;
        });

  return (
    <section className="panel results-panel">
      <div className="results-top">
        <div>
          <h2>Risk Overview</h2>
          <p>{result.summary}</p>
          {result.explanation ? <p className="risk-explanation">{result.explanation}</p> : null}
        </div>
        <div className="results-badges">
          <div className={getRiskBadgeClass(result.risk_level)}>
            {result.risk_level.toUpperCase()} ({result.risk_score})
          </div>
          {result.action && (
            <div className={getActionBadgeClass(result.action)}>
              {result.action.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Correlations */}
      {result.correlations?.length > 0 && (
        <div className="correlations-section">
          <h3>Cross-Log Correlations</h3>
          <div className="correlations-list">
            {result.correlations.map((c, i) => (
              <div key={`corr-${i}`} className={`correlation severity-${c.severity}`}>
                <strong>{c.type.replaceAll("_", " ").toUpperCase()}</strong>
                <p>{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-grid">
        <div>
          <div className="findings-header">
            <h3>Findings ({filteredFindings.length})</h3>
            <div className="findings-controls">
              <select
                className="severity-filter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                type="button"
                className="toggle-findings-btn"
                onClick={() => setShowFindings(!showFindings)}
              >
                {showFindings ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {showFindings && (
            <div className="findings-list">
              {filteredFindings.length === 0 ? (
                <p className="muted">No findings match the selected filter.</p>
              ) : (
                filteredFindings.map((finding, index) => {
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
          )}
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
