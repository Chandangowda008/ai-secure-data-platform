import { useState, useRef, useEffect } from "react";
import { analyzeTextOrLog } from "../services/api.js";

function getRiskClass(level) {
  if (level === "critical" || level === "high") return "chat-risk-high";
  if (level === "medium") return "chat-risk-medium";
  return "chat-risk-low";
}

export default function ChatPanel({ options }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: "user", text, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await analyzeTextOrLog("chat", text, options);
      const systemMsg = {
        role: "system",
        text: result.summary || "Analysis complete.",
        result,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `Error: ${err.message}`, error: true, timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">
            Start a conversation — type or paste any text to scan for security risks.
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={`msg-${i}`} className={`chat-bubble chat-${msg.role}`}>
            <div className="chat-bubble-header">
              <span className="chat-sender">{msg.role === "user" ? "You" : "Security AI"}</span>
              <span className="chat-time">{msg.timestamp}</span>
            </div>

            <p className={msg.error ? "chat-error-text" : ""}>{msg.text}</p>

            {msg.result && (
              <div className="chat-result">
                <div className={`chat-risk-badge ${getRiskClass(msg.result.risk_level)}`}>
                  {msg.result.risk_level?.toUpperCase()} — Score {msg.result.risk_score}
                </div>

                {msg.result.action && (
                  <span className={`chat-action-pill chat-action-${msg.result.action}`}>
                    {msg.result.action.toUpperCase()}
                  </span>
                )}

                {msg.result.findings?.length > 0 && (
                  <div className="chat-findings">
                    <strong>Findings ({msg.result.findings.length}):</strong>
                    <ul>
                      {msg.result.findings.slice(0, 5).map((f, j) => (
                        <li key={`f-${j}`}>
                          <span className={`severity-pill severity-${f.risk}`}>
                            {f.risk?.toUpperCase()}
                          </span>{" "}
                          {f.message}
                          {f.match ? <code>{f.match}</code> : null}
                        </li>
                      ))}
                      {msg.result.findings.length > 5 && (
                        <li className="chat-more">...and {msg.result.findings.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {msg.result.insights?.length > 0 && (
                  <div className="chat-insights">
                    <strong>Insights:</strong>
                    <ul>
                      {msg.result.insights.map((ins, k) => (
                        <li key={`ins-${k}`}>{ins}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="chat-bubble chat-system chat-typing">
            <span className="typing-dots">●●●</span> Analyzing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message to scan for security risks..."
          rows={2}
          disabled={sending}
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={sending || !input.trim()}
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
