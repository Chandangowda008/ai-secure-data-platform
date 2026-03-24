import { useState, useRef } from "react";

export default function InputPanel({
  mode,
  textValue,
  selectedFile,
  loading,
  options,
  onModeChange,
  onTextChange,
  onFileChange,
  onOptionsChange,
  onAnalyze,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef(null);

  const allowedExtensions = [".log", ".txt", ".pdf", ".docx", ".doc"];

  function isAllowedFile(file) {
    const name = file.name.toLowerCase();
    return allowedExtensions.some((ext) => name.endsWith(ext));
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && isAllowedFile(file)) {
      onFileChange(file);
      if (mode !== "file") onModeChange("file");
    }
  }

  return (
    <section className="panel input-panel">
      <div className="panel-header">
        <h2>Input Source</h2>
        <div className="mode-switch">
          <button
            className={mode === "text" ? "mode-btn active" : "mode-btn"}
            type="button"
            onClick={() => onModeChange("text")}
          >
            Text/Log
          </button>
          <button
            className={mode === "file" ? "mode-btn active" : "mode-btn"}
            type="button"
            onClick={() => onModeChange("file")}
          >
            File Upload
          </button>
          <button
            className={mode === "chat" ? "mode-btn active" : "mode-btn"}
            type="button"
            onClick={() => onModeChange("chat")}
          >
            Live Chat
          </button>
        </div>
      </div>

      {mode === "chat" ? null : mode === "text" ? (
        <div className="field-group">
          <label htmlFor="log-content">Log Content</label>
          <textarea
            id="log-content"
            value={textValue}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Paste .log or .txt content here..."
            rows={12}
          />
        </div>
      ) : (
        <div
          ref={dropRef}
          className={`field-group drop-zone ${isDragging ? "drop-zone-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label htmlFor="log-file">Upload File (.log, .txt, .pdf, .docx)</label>
          <div className="drop-area">
            <p className="drop-prompt">
              {isDragging
                ? "Drop file here..."
                : "Drag & drop a file here, or click to browse"}
            </p>
            <input
              id="log-file"
              type="file"
              accept=".log,.txt,.pdf,.docx,.doc,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
          </div>
          <p className="file-note">
            {selectedFile
              ? `Selected: ${selectedFile.name}`
              : "No file selected"}
          </p>
        </div>
      )}

      <div className="options-bar">
        <label className="option-toggle">
          <input
            type="checkbox"
            checked={options.mask}
            onChange={(e) => onOptionsChange({ ...options, mask: e.target.checked })}
          />
          <span>Mask Sensitive Data</span>
        </label>
        <label className="option-toggle">
          <input
            type="checkbox"
            checked={options.block_high_risk}
            onChange={(e) =>
              onOptionsChange({ ...options, block_high_risk: e.target.checked })
            }
          />
          <span>Block High Risk</span>
        </label>
      </div>

      {mode !== "chat" && (
        <>
          <button type="button" className="analyze-btn" onClick={onAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {loading && (
            <div className="progress-bar-container">
              <div className="progress-bar-fill" />
            </div>
          )}
        </>
      )}
    </section>
  );
}
