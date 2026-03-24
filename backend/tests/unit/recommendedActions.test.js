import { describe, expect, it } from "vitest";

import { generateRecommendedActions } from "../../services/recommendedActions.js";

describe("recommendedActions", () => {
  it("returns unique actions mapped from finding types", () => {
    const findings = [
      { type: "password", risk: "critical", line: 2 },
      { type: "api_key", risk: "high", line: 3 },
      { type: "email", risk: "low", line: 1 },
      { type: "phone_number", risk: "low", line: 4 },
    ];

    const actions = generateRecommendedActions(findings);

    expect(actions).toContain("Avoid storing plain text passwords in logs");
    expect(actions).toContain("Use hashing and secure authentication mechanisms");
    expect(actions).toContain("Store API keys in environment variables or secret managers");
    expect(actions).toContain("Rotate exposed API keys immediately");
    expect(actions).toContain("Mask personally identifiable information (PII) in logs");
    expect(actions.filter((item) => item.includes("personally identifiable")).length).toBe(1);
  });

  it("returns an empty array when there are no findings", () => {
    expect(generateRecommendedActions([])).toEqual([]);
  });
});
