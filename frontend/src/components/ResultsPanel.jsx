function getRiskBadgeClass(riskLevel) {
  if (riskLevel === "high") {
    return "risk-badge risk-high";
  }
  if (riskLevel === "medium") {
    return "risk-badge risk-medium";
  }
  return "risk-badge risk-low";
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
              result.findings.map((finding, index) => (
                <article key={`${finding.type}-${finding.line}-${index}`} className={`finding risk-${finding.risk}`}>
                  <div className="finding-top">
                    <strong>{finding.type}</strong>
                    <span>Line {finding.line}</span>
                  </div>
                  <p>{finding.message}</p>
                  {finding.match ? <code>{finding.match}</code> : null}
                </article>
              ))
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
        </div>
      </div>
    </section>
  );
}
