import OpenAI from "openai";

function countByType(findings) {
  return findings.reduce((accumulator, finding) => {
    accumulator[finding.type] = (accumulator[finding.type] || 0) + 1;
    return accumulator;
  }, {});
}

function extractFrequentLines(findings) {
  const map = new Map();
  for (const finding of findings) {
    const count = map.get(finding.line) || 0;
    map.set(finding.line, count + 1);
  }

  return [...map.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([line, count]) => `Line ${line} contains ${count} risky signals`);
}

export function generateRuleBasedInsights(findings, analysisMeta = {}) {
  const insights = [];
  const counts = countByType(findings);

  if (counts.api_key) {
    insights.push(`API key exposed in logs (${counts.api_key} occurrence${counts.api_key > 1 ? "s" : ""}).`);
  }

  if (counts.password || counts.credential_pair) {
    insights.push("Potential hardcoded credentials detected in plain text log entries.");
  }

  if ((analysisMeta.failedLogins || 0) >= 3) {
    insights.push(`Multiple failed login attempts detected (${analysisMeta.failedLogins} events).`);
  }

  if (counts.exception || counts.stack_trace) {
    insights.push("Error leak risk: stack traces or exception details are visible in logs.");
  }

  const piiCount = (counts.email || 0) + (counts.phone_number || 0);
  if (piiCount > 0) {
    insights.push(`Sensitive user data logged in plain text (${piiCount} PII markers found).`);
  }

  const lineInsights = extractFrequentLines(findings);
  insights.push(...lineInsights);

  if (insights.length === 0) {
    insights.push("No high-confidence exposure patterns were detected in the provided input.");
  }

  return insights;
}

function isOpenAIEnabled() {
  return (
    process.env.ENABLE_OPENAI_INSIGHTS === "true" &&
    typeof process.env.OPENAI_API_KEY === "string" &&
    process.env.OPENAI_API_KEY.length > 20
  );
}

async function generateOpenAIInsights(findings, summaryText) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const topFindings = findings.slice(0, 20).map((item) => ({
    type: item.type,
    risk: item.risk,
    line: item.line,
    message: item.message,
  }));

  const prompt = [
    "You are a security log triage assistant.",
    "Produce up to 3 concise, actionable insights.",
    "Avoid generic phrasing.",
    `Summary context: ${summaryText}`,
    `Findings: ${JSON.stringify(topFindings)}`,
  ].join("\n");

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
  });

  const rawText = response.output_text || "";
  return rawText
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function generateInsights(findings, summaryText, analysisMeta = {}) {
  const ruleBasedInsights = generateRuleBasedInsights(findings, analysisMeta);

  if (!isOpenAIEnabled()) {
    return ruleBasedInsights;
  }

  try {
    const modelInsights = await generateOpenAIInsights(findings, summaryText);
    if (modelInsights.length === 0) {
      return ruleBasedInsights;
    }

    return [...ruleBasedInsights, ...modelInsights];
  } catch (error) {
    return ruleBasedInsights;
  }
}
