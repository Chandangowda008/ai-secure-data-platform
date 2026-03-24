import { describe, expect, it } from "vitest";

import { calculateRisk } from "../../services/riskEngine.js";

describe("riskEngine", () => {
  it("calculates risk score with required severity weights", () => {
    const input = [
      { type: "api_key", risk: "critical" },
      { type: "token", risk: "high" },
      { type: "email", risk: "medium" },
      { type: "failed_login", risk: "low" },
    ];

    const result = calculateRisk(input);

    expect(result.risk_score).toBe(11);
    expect(result.risk_level).toBe("medium");
  });

  it("returns high risk level for score >= 12", () => {
    const input = [
      { type: "api_key", risk: "critical" },
      { type: "password", risk: "critical" },
      { type: "token", risk: "high" },
    ];

    const result = calculateRisk(input);

    expect(result.risk_score).toBe(13);
    expect(result.risk_level).toBe("high");
  });

  it("returns low risk level for empty findings", () => {
    const result = calculateRisk([]);

    expect(result.risk_score).toBe(0);
    expect(result.risk_level).toBe("low");
  });
});
