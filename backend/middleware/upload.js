import multer from "multer";

const allowedExtensions = [".log", ".txt"];

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
    if (hasAllowedExtension(file.originalname)) {
      callback(null, true);
      return;
    }

    callback(new Error("Only .log and .txt files are allowed"));
  },
});
