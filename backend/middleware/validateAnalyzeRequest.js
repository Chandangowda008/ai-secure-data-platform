/**
 * Sanitize raw input by stripping dangerous content.
 */
function sanitizeContent(raw) {
  if (typeof raw !== "string") return raw;
  return raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "[SCRIPT_REMOVED]")
    .replace(/\0/g, "");
}

export function validateAnalyzeRequest(req, res, next) {
  const { input_type: inputType, content, options } = req.body || {};
  const allowedInputTypes = new Set(["text", "log", "file", "sql", "chat"]);

  if (!allowedInputTypes.has(inputType)) {
    res.status(400).json({
      error: "Invalid input_type. Use text, log, file, or sql.",
    });
    return;
  }

  // Validate & normalize options
  if (options !== undefined && (typeof options !== "object" || Array.isArray(options))) {
    res.status(400).json({
      error: "options must be a plain object.",
    });
    return;
  }

  req.body.options = {
    mask: false,
    block_high_risk: false,
    log_analysis: true,
    ...(options || {}),
  };

  if (inputType === "file") {
    if (!req.file) {
      res.status(400).json({
        error: "File upload is required when input_type is file.",
      });
      return;
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      res.status(400).json({
        error: "Uploaded file is empty.",
      });
      return;
    }
  }

  if (inputType !== "file") {
    if (typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({
        error: "content must be a non-empty string for text/log/sql input.",
      });
      return;
    }

    if (content.length > Number(process.env.MAX_CONTENT_CHARS || 1_000_000)) {
      res.status(413).json({
        error: "content exceeds size limits.",
      });
      return;
    }

    // Sanitize text content
    req.body.content = sanitizeContent(content);
  }

  next();
}
