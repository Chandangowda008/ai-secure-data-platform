import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import analyzeRoutes from "./routes/analyzeRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: process.env.JSON_LIMIT || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_LIMIT || "10mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", analyzeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
