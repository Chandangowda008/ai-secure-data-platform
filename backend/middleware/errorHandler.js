export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
  });
}

export function errorHandler(error, req, res, next) {
  if (error?.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Uploaded file exceeds configured size limits." });
    return;
  }

  if (error?.message?.includes("Only .log and .txt files are allowed")) {
    res.status(400).json({ error: error.message });
    return;
  }

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: error.message || "Internal server error",
  });
}
