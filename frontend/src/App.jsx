import { useState } from "react";
import InputPanel from "./components/InputPanel.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import LogViewer from "./components/LogViewer.jsx";
import { analyzeFile, analyzeTextOrLog } from "./services/api.js";
import "./App.css";

const initialSample = `2026-03-24 09:00:12 INFO user_email=jane.doe@company.com login=failed
2026-03-24 09:00:15 WARN token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
2026-03-24 09:00:18 ERROR password=superSecret123
2026-03-24 09:00:20 ERROR api_key=sk-1234567890abcdefghijklmnop
2026-03-24 09:00:25 ERROR Exception: User lookup crashed
    at AuthService.login (auth.js:55:14)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Unable to read file content"));
    reader.readAsText(file);
  });
}

export default function App() {
  const [mode, setMode] = useState("text");
  const [content, setContent] = useState(initialSample);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sourceText, setSourceText] = useState(initialSample);

  async function handleAnalyze() {
    setError("");
    setLoading(true);

    try {
      if (mode === "file") {
        if (!selectedFile) {
          throw new Error("Please select a .log or .txt file before analyzing.");
        }

        const extension = selectedFile.name.toLowerCase();
        if (!extension.endsWith(".log") && !extension.endsWith(".txt")) {
          throw new Error("Unsupported file type. Please upload .log or .txt files.");
        }

        const [apiResult, rawText] = await Promise.all([
          analyzeFile(selectedFile),
          readTextFile(selectedFile),
        ]);

        setResult(apiResult);
        setSourceText(rawText);
      } else {
        if (!content.trim()) {
          throw new Error("Please enter log content before analyzing.");
        }

        const inputType = mode === "text" ? "text" : "log";
        const apiResult = await analyzeTextOrLog(inputType, content);
        setResult(apiResult);
        setSourceText(content);
      }
    } catch (analyzeError) {
      setError(analyzeError.message || "Analysis failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero-header">
        <p className="kicker">AI Gateway + Data Scanner + Log Analyzer + Risk Engine</p>
        <h1>AI Secure Data Intelligence Platform</h1>
        <p>
          Scan .log/.txt data for sensitive exposures, hardcoded credentials, and error leaks with
          deterministic risk scoring.
        </p>
      </header>

      <InputPanel
        mode={mode}
        textValue={content}
        selectedFile={selectedFile}
        loading={loading}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setError("");
        }}
        onTextChange={setContent}
        onFileChange={setSelectedFile}
        onAnalyze={handleAnalyze}
      />

      {error ? <p className="error-banner">{error}</p> : null}

      <ResultsPanel result={result} />
      <LogViewer sourceText={sourceText} findings={result?.findings || []} />
    </main>
  );
}
