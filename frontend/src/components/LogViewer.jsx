function riskWeight(risk) {
  if (risk === "critical") return 4;
  if (risk === "high") return 3;
  if (risk === "medium") return 2;
  return 1;
}

function toLineMap(findings) {
  const map = new Map();
  for (const finding of findings) {
    const existing = map.get(finding.line);
    if (!existing || riskWeight(finding.risk) > riskWeight(existing)) {
      map.set(finding.line, finding.risk);
    }
  }
  return map;
}

function getLineClass(risk) {
  if (risk === "critical") return "log-line line-critical";
  if (risk === "high") return "log-line line-high";
  if (risk === "medium") return "log-line line-medium";
  if (risk === "low") return "log-line line-low";
  return "log-line line-neutral";
}

export default function LogViewer({ sourceText, findings }) {
  if (!sourceText) {
    return null;
  }

  const lineRiskMap = toLineMap(findings || []);
  const lines = sourceText.split(/\r?\n/);

  return (
    <section className="panel log-viewer">
      <h2>Risky Line Highlight</h2>
      <div className="log-lines">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const risk = lineRiskMap.get(lineNumber);

          return (
            <div key={`line-${lineNumber}`} className={getLineClass(risk)}>
              <span className="line-number">{lineNumber}</span>
              <pre>{line || " "}</pre>
            </div>
          );
        })}
      </div>
    </section>
  );
}
