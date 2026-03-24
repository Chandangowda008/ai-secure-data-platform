import { analyzeLogContent } from "../services/logAnalyzer.js";
import { calculateRisk } from "../services/riskEngine.js";
import { generateAIEnhancements } from "../utils/ollamaAI.js";
import { buildSummary } from "../utils/summaryBuilder.js";

function buildRawContent(req) {
  const { input_type: inputType, content } = req.body;

  if (inputType === "file") {
    return req.file.buffer.toString("utf-8");
  }

  return content;
}

function normalizeFindings(findings) {
  return findings.map((item) => ({
    type: item.type,
    risk: item.risk,
    line: item.line,
    message: item.message,
    match: item.match,
  }));
}

export async function analyzeController(req, res) {
  const rawContent = buildRawContent(req);

  const analysis = await analyzeLogContent(rawContent);
  const findings = normalizeFindings(analysis.findings);
  const risk = calculateRisk(analysis.findings);
  const summary = buildSummary(analysis.findings, risk);
  const ai = await generateAIEnhancements(rawContent, findings, risk.risk_level);

  res.status(200).json({
    summary,
    findings,
    risk_score: risk.risk_score,
    risk_level: risk.risk_level,
    insights: ai.insights,
    recommended_actions: ai.recommended_actions,
    explanation: ai.explanation,
    metadata: analysis.metadata,
  });
}
