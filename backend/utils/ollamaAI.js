import Groq from "groq-sdk";

import { generateRuleBasedInsights } from "../services/aiInsights.js";
import { generateRecommendedActions } from "../services/recommendedActions.js";

function dedupeList(items = []) {
  const unique = new Set();
  for (const item of items) {
    if (typeof item === "string" && item.trim()) {
      unique.add(item.trim());
    }
  }
  return [...unique];
}

function buildFallbackExplanation(findings, riskLevel) {
  const count = Array.isArray(findings) ? findings.length : 0;
  if (count === 0) {
    return `The risk level is ${riskLevel} because no high-confidence security exposures were detected.`;
  }

  const highImpact = findings.filter((item) => item.risk === "critical" || item.risk === "high").length;
  if (highImpact > 0) {
    return `The risk level is ${riskLevel} due to ${highImpact} high-impact exposure signal${highImpact > 1 ? "s" : ""} and their potential real-world security impact.`;
  }

  return `The risk level is ${riskLevel} based on the volume and type of detected log exposure patterns.`;
}

function extractFirstJsonBlock(text = "") {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return "";
  }
  return text.slice(start, end + 1);
}

function parseSections(rawText = "") {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const insights = [];
  const recommendedActions = [];
  let explanation = "";

  let section = "";
  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (normalized.includes("insight")) {
      section = "insights";
      continue;
    }
    if (normalized.includes("recommended") || normalized.includes("action")) {
      section = "actions";
      continue;
    }
    if (normalized.includes("explanation") || normalized.includes("why the risk level")) {
      section = "explanation";
      continue;
    }

    const cleaned = line.replace(/^[-*\d.)\s]+/, "").trim();
    if (!cleaned) {
      continue;
    }

    if (section === "insights") {
      insights.push(cleaned);
      continue;
    }

    if (section === "actions") {
      recommendedActions.push(cleaned);
      continue;
    }

    if (section === "explanation") {
      explanation = explanation ? `${explanation} ${cleaned}` : cleaned;
    }
  }

  return {
    insights: dedupeList(insights),
    recommended_actions: dedupeList(recommendedActions),
    explanation: explanation.trim(),
  };
}

function parseAIResponse(rawText = "") {
  const jsonCandidate = extractFirstJsonBlock(rawText);
  if (jsonCandidate) {
    try {
      const parsed = JSON.parse(jsonCandidate);
      return {
        insights: dedupeList(parsed?.insights || []),
        recommended_actions: dedupeList(parsed?.recommended_actions || []),
        explanation: typeof parsed?.explanation === "string" ? parsed.explanation.trim() : "",
      };
    } catch {
      return parseSections(rawText);
    }
  }

  return parseSections(rawText);
}

function buildPrompt(logContent, findings, riskLevel) {
  const clippedLog = typeof logContent === "string" ? logContent.slice(0, 6000) : "";

  return [
    "You are a cybersecurity expert.",
    "",
    "Log Content:",
    clippedLog,
    "",
    "Detected Findings:",
    JSON.stringify(findings),
    "",
    `Calculated Risk Level: ${riskLevel}`,
    "",
    "Generate:",
    "1. Key security insights (bullet points)",
    "2. Recommended remediation actions (specific and actionable)",
    `3. Explanation of why the risk level is ${riskLevel}`,
    "",
    "Rules:",
    "* Do NOT change the risk level",
    "* Do NOT repeat raw findings",
    "* Provide context-aware insights",
    "* Avoid generic statements",
    "* Focus on real-world security impact",
    "",
    "Return only valid JSON with this schema:",
    '{"insights": ["..."], "recommended_actions": ["..."], "explanation": "..."}',
  ].join("\n");
}

export async function generateAIEnhancements(logContent, findings, riskLevel) {
  const fallbackInsights = generateRuleBasedInsights(findings || []);
  const fallbackActions = generateRecommendedActions(findings || []);
  const fallbackExplanation = buildFallbackExplanation(findings || [], riskLevel);

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not configured");
    }

    const groq = new Groq({ apiKey });
    const prompt = buildPrompt(logContent, findings, riskLevel);

    const response = await groq.chat.completions.create({
      model: process.env.AI_MODEL || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = response?.choices?.[0]?.message?.content || "";
    const parsed = parseAIResponse(content);

    return {
      insights: parsed.insights.length ? parsed.insights : fallbackInsights,
      recommended_actions: parsed.recommended_actions.length
        ? parsed.recommended_actions
        : fallbackActions,
      explanation: parsed.explanation || fallbackExplanation,
    };
  } catch {
    return {
      insights: fallbackInsights,
      recommended_actions: fallbackActions,
      explanation: fallbackExplanation,
    };
  }
}
