import { describe, expect, it } from "vitest";

import { analyzeLogContent } from "../../services/logAnalyzer.js";

describe("logAnalyzer", () => {
  it("detects sensitive values and stack traces with line numbers", async () => {
    const content = [
      "user_email=test@example.com",
      "api_key=sk-1234567890abcdefghijklmnop",
      "password=abc12345",
      "ERROR Exception: crash",
      "    at service.run (service.js:10:5)",
    ].join("\n");

    const result = await analyzeLogContent(content);

    const types = result.findings.map((item) => item.type);

    expect(types).toContain("email");
    expect(types).toContain("api_key");
    expect(types).toContain("password");
    expect(types).toContain("exception");
    expect(types).toContain("stack_trace");

    expect(result.findings.some((item) => item.type === "api_key" && item.line === 2)).toBe(true);
    expect(result.findings.some((item) => item.type === "stack_trace" && item.line === 5)).toBe(true);
  });

  it("counts failed login attempts in metadata", async () => {
    const content = [
      "WARN failed login user=a@x.com",
      "WARN login failed user=b@x.com",
      "ERROR authentication failed user=c@x.com",
    ].join("\n");

    const result = await analyzeLogContent(content);

    expect(result.metadata.failedLogins).toBe(3);
    expect(result.findings.filter((item) => item.type === "failed_login")).toHaveLength(3);
  });
});
