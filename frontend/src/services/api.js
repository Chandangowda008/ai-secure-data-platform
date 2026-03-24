const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/$/, "");

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || "Failed to analyze input";
    throw new Error(message);
  }
  return payload;
}

export async function analyzeTextOrLog(inputType, content) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_type: inputType,
      content,
    }),
  });

  return parseResponse(response);
}

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append("input_type", "file");
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}
