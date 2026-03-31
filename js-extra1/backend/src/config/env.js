import dotenv from "dotenv";

dotenv.config();

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const config = {
  env: process.env.NODE_ENV || "development",
  port: parsePositiveNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/careerconnect",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  puterAuthToken: process.env.PUTER_AUTH_TOKEN || process.env.PUTER_TOKEN || "",
  puterModel: process.env.PUTER_MODEL || "gpt-5-nano",
  puterTimeoutMs: parsePositiveNumber(process.env.PUTER_TIMEOUT_MS, 60000),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  geminiApiKey: process.env.GEMINI_API_KEY || ""
};

export default config;
