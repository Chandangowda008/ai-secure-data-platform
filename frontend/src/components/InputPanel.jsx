export default function InputPanel({
  mode,
  textValue,
  selectedFile,
  loading,
  onModeChange,
  onTextChange,
  onFileChange,
  onAnalyze,
}) {
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
        </div>
      </div>

      {mode === "text" ? (
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
        <div className="field-group">
          <label htmlFor="log-file">Upload File (.log, .txt)</label>
          <input
            id="log-file"
            type="file"
            accept=".log,.txt,text/plain"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
          <p className="file-note">
            {selectedFile
              ? `Selected: ${selectedFile.name}`
              : "No file selected"}
          </p>
        </div>
      )}

      <button type="button" className="analyze-btn" onClick={onAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </section>
  );
}
