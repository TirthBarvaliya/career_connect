import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import techStackRoutes from "./routes/techStackRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import careerAIRoutes from "./routes/careerAIRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import aiWriteRoutes from "./routes/aiWriteRoutes.js";
import landingRoutes from "./routes/landingRoutes.js";
import creditRoutes from "./routes/creditRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

app.use(helmet());
const allowedOrigins = [config.clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      try {
        const parsed = new URL(origin);
        const isLocalhost =
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
          (parsed.protocol === "http:" || parsed.protocol === "https:");
        if (isLocalhost) {
          return callback(null, true);
        }
      } catch {
        // Ignore parse errors and reject origin below.
      }
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (config.env !== "production") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Career connect API is running",
    docs: "/api/health"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "career-connect-backend",
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/tech-stacks", techStackRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/career-ai", careerAIRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiWriteRoutes);
app.use("/api/landing", landingRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recruiter", recruiterRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
