import multer from "multer";

const allowedExtensions = [".log", ".txt", ".pdf", ".docx", ".doc"];

const allowedMimeTypes = new Set([
  "text/plain",
  "application/octet-stream",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

function hasAllowedExtension(filename = "") {
  const lower = filename.toLowerCase();
  return allowedExtensions.some((extension) => lower.endsWith(extension));
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
  },
  fileFilter: (req, file, callback) => {
    if (!hasAllowedExtension(file.originalname)) {
      callback(new Error("Only .log, .txt, .pdf, and .docx files are allowed"));
      return;
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }

    callback(null, true);
  },
});
