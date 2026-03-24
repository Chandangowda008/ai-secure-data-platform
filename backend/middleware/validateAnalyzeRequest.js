export function validateAnalyzeRequest(req, res, next) {
  const { input_type: inputType, content } = req.body || {};
  const allowedInputTypes = new Set(["text", "log", "file"]);

  if (!allowedInputTypes.has(inputType)) {
    res.status(400).json({
      error: "Invalid input_type. Use text, log, or file.",
    });
    return;
  }

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
        error: "content must be a non-empty string for text/log input.",
      });
      return;
    }

    if (content.length > Number(process.env.MAX_CONTENT_CHARS || 1_000_000)) {
      res.status(413).json({
        error: "content exceeds size limits.",
      });
      return;
    }
  }

  next();
}
