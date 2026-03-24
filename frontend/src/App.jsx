import { useState } from "react";
import InputPanel from "./components/InputPanel.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
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

const allowedTextExtensions = [".log", ".txt"];

export default function App() {
  const [mode, setMode] = useState("text");
  const [content, setContent] = useState(initialSample);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sourceText, setSourceText] = useState(initialSample);
  const [options, setOptions] = useState({
    mask: false,
    block_high_risk: false,
  });

  function isTextReadable(file) {
    const name = file.name.toLowerCase();
    return allowedTextExtensions.some((ext) => name.endsWith(ext));
  }

  async function handleAnalyze() {
    setError("");
    setLoading(true);

    try {
      if (mode === "file") {
        if (!selectedFile) {
          throw new Error("Please select a file before analyzing.");
        }

        const acceptedExtensions = [".log", ".txt", ".pdf", ".docx", ".doc"];
        const extension = selectedFile.name.toLowerCase();
        if (!acceptedExtensions.some((ext) => extension.endsWith(ext))) {
          throw new Error("Unsupported file type. Please upload .log, .txt, .pdf, or .docx files.");
        }

        const apiResultPromise = analyzeFile(selectedFile, options);

        // Only read raw text for text-based files
        let rawText = "";
        if (isTextReadable(selectedFile)) {
          rawText = await readTextFile(selectedFile);
        } else {
          rawText = `[Binary file: ${selectedFile.name}]`;
        }

        const apiResult = await apiResultPromise;
        setResult(apiResult);
        setSourceText(rawText);
      } else {
        if (!content.trim()) {
          throw new Error("Please enter log content before analyzing.");
        }

        const inputType = mode === "text" ? "text" : "log";
        const apiResult = await analyzeTextOrLog(inputType, content, options);
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
        <p className="hero-subtitle">Powered by AI-driven security analysis engine</p>
        <p>
          Scan text, logs, files, SQL, or chat messages for sensitive exposures, hardcoded credentials,
          and error leaks with deterministic risk scoring.
        </p>
      </header>

      {mode === "chat" ? (
        <>
          {/* Show only the mode switch header for chat mode */}
          <InputPanel
            mode={mode}
            textValue={content}
            selectedFile={selectedFile}
            loading={loading}
            options={options}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              setError("");
            }}
            onTextChange={setContent}
            onFileChange={setSelectedFile}
            onOptionsChange={setOptions}
            onAnalyze={handleAnalyze}
          />
          <ChatPanel options={options} />
        </>
      ) : (
        <>
          <InputPanel
            mode={mode}
            textValue={content}
            selectedFile={selectedFile}
            loading={loading}
            options={options}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              setError("");
            }}
            onTextChange={setContent}
            onFileChange={setSelectedFile}
            onOptionsChange={setOptions}
            onAnalyze={handleAnalyze}
          />

          {error ? <p className="error-banner">{error}</p> : null}

          <ResultsPanel result={result} />
          <LogViewer sourceText={sourceText} findings={result?.findings || []} />
        </>
      )}
    </main>
  );
}
