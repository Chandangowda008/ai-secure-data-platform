import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../app.js";

describe("POST /api/analyze", () => {
  it("returns findings, risk score, and insights for text input", async () => {
    const response = await request(app).post("/api/analyze").send({
      input_type: "text",
      content: [
        "user_email=test@example.com",
        "api_key=sk-1234567890abcdefghijklmnop",
        "password=abc12345",
        "ERROR Exception: crash",
        "    at service.run (service.js:10:5)",
      ].join("\n"),
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.summary).toBe("string");
    expect(Array.isArray(response.body.findings)).toBe(true);
    expect(typeof response.body.risk_score).toBe("number");
    expect(["low", "medium", "high"]).toContain(response.body.risk_level);
    expect(Array.isArray(response.body.insights)).toBe(true);
    expect(Array.isArray(response.body.recommended_actions)).toBe(true);

    const apiKeyFinding = response.body.findings.find((item) => item.type === "api_key");
    expect(apiKeyFinding).toBeTruthy();
    expect(apiKeyFinding.risk).toBe("high");
    expect(apiKeyFinding.line).toBe(2);

    const emailFinding = response.body.findings.find((item) => item.type === "email");
    expect(emailFinding).toBeTruthy();
    expect(emailFinding.risk).toBe("low");
    expect(emailFinding.line).toBe(1);

    expect(response.body.recommended_actions).toContain("Avoid storing plain text passwords in logs");
    expect(response.body.recommended_actions).toContain(
      "Store API keys in environment variables or secret managers"
    );
    expect(response.body.recommended_actions).toContain(
      "Mask personally identifiable information (PII) in logs"
    );
  });

  it("returns validation error for invalid input type", async () => {
    const response = await request(app).post("/api/analyze").send({
      input_type: "unknown",
      content: "test",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid input_type");
  });

  it("accepts file input and analyzes uploaded log", async () => {
    const response = await request(app)
      .post("/api/analyze")
      .field("input_type", "file")
      .attach("file", Buffer.from("token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\nERROR Exception: boom"), {
        filename: "sample.log",
        contentType: "text/plain",
      });

    expect(response.status).toBe(200);
    expect(response.body.findings.length).toBeGreaterThan(0);
    expect(response.body.findings.some((item) => item.type === "token")).toBe(true);
  });
});
