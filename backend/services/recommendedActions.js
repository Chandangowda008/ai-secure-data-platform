const actionMap = {
  password: [
    "Avoid storing plain text passwords in logs",
    "Use hashing and secure authentication mechanisms",
  ],
  api_key: [
    "Store API keys in environment variables or secret managers",
    "Rotate exposed API keys immediately",
  ],
  token: [
    "Do not log authentication tokens",
    "Implement token expiration and secure storage",
  ],
  email: ["Mask personally identifiable information (PII) in logs"],
  phone_number: ["Mask personally identifiable information (PII) in logs"],
  stack_trace: [
    "Disable stack trace exposure in production",
    "Use centralized error handling",
  ],
  debug_mode: ["Disable debug mode in production environments"],
};

export function generateRecommendedActions(findings = []) {
  const actions = new Set();

  for (const finding of findings) {
    const mappedActions = actionMap[finding?.type] || [];
    for (const action of mappedActions) {
      actions.add(action);
    }
  }

  return [...actions];
}
