import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config/app.config.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import apiRouter from "./routes/index.js";

const PORT = config.port || 8000;

const app = express();
//! ─── Middleware ────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        config.corsOrigins.includes(origin) ||
        config.nodeEnv === "development" ||
        process.env.VERCEL === "1"
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

//! ─── Backend Running ────────────────────────────────────────────
app.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      status: "Backend is running",
    });
  }),
);
//! ─── Health Check ────────────────────────────────────────────
app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    res.json({
      status: "Backend is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    });
  }),
);

//! ─── API Routes ────────────────────────────────────────────
app.use("/api", apiRouter);

//! ─── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

//! ─── App Listen ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
