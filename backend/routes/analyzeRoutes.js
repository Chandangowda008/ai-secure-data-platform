import express from "express";
import { analyzeController } from "../controllers/analyzeController.js";
import { upload } from "../middleware/upload.js";
import { validateAnalyzeRequest } from "../middleware/validateAnalyzeRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/analyze",
  upload.single("file"),
  validateAnalyzeRequest,
  asyncHandler(analyzeController)
);

export default router;
