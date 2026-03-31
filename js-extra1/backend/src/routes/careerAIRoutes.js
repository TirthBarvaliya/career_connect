import { Router } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { PDFParse } from "pdf-parse";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../config/env.js";
import User from "../models/User.js";

const router = Router();

const SYSTEM_PROMPT = `You are CareerAI, an intelligent assistant inside a Career Guidance platform.

You ONLY answer questions related to:
1. Resume analysis
2. Career roadmap suggestions
3. Job recommendations
4. Interview preparation
5. Course recommendations

If a user asks anything outside these topics, respond strictly with:
'I am designed to assist only with resume analysis, roadmap suggestions, job recommendations, interview preparation, and course guidance.'

Response style requirements:
- Keep responses medium-length and concise
- Use clear section headings (plain text, NO markdown # symbols)
- Use "-" for bullet points (NEVER use *, +, or • as bullet markers)
- Use numbered lists like "1. " where appropriate
- Use short paragraphs (max 2-3 lines each)
- Give practical, actionable guidance
- Avoid long blocks of text
- Avoid casual conversation
- NEVER use markdown formatting. No **, no *, no #, no backticks. Write in plain text only.`;

const OUT_OF_SCOPE_RESPONSE =
  "I am designed to assist only with resume analysis, roadmap suggestions, job recommendations, interview preparation, and course guidance.";

const INTENT_PROMPTS = {
  resume: `Mode: Resume Analyzer.
Use the user's resume text and respond with these sections:
1) Strengths
2) Weaknesses
3) Missing Skills
4) Improvement Suggestions
5) ATS Score out of 100 with a short reason.
If the user does not provide resume content, ask for resume text first.`,
  roadmap: `Mode: Career Roadmap Suggestion.
If needed, first ask for: current skills, target role, and experience level.
Then provide:
1) 6-month roadmap
2) Skills to learn
3) Projects to build
4) Certifications
5) Interview plan.`,
  job: `Mode: Job Recommendation Assistant.
If needed, first ask for: skills, preferred location, and experience level.
Then provide:
1) 5 suitable job roles
2) Required skills for each role
3) Estimated salary ranges
4) Preparation tips.`,
  interview: `Mode: Interview Preparation Bot.
If needed, first ask for: role and experience level.
Then provide:
1) 10 technical questions
2) 5 HR questions
3) 3 scenario-based questions
4) Tips to answer effectively.`,
  course: `Mode: Course Recommendation AI.
If needed, first ask for: career path and current level (Beginner/Intermediate/Advanced).
Then provide:
1) Free resources
2) Paid certifications
3) Recommended learning order.`
};

const MAX_MESSAGE_LENGTH = 6000;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const detectIntent = (message) => {
  const text = String(message || "").toLowerCase();
  if (text.includes("resume")) return "resume";
  if (text.includes("roadmap")) return "roadmap";
  if (text.includes("job")) return "job";
  if (text.includes("interview")) return "interview";
  if (text.includes("course")) return "course";
  return "general";
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const role = item.role === "assistant" ? "assistant" : "user";
      const content = String(item.content || "").trim().slice(0, 2000);
      return { role, content };
    })
    .filter((item) => item.content)
    .slice(-8);
};

const createPromptForIntent = (intent, message) => {
  const intentBlock = INTENT_PROMPTS[intent];
  if (!intentBlock) {
    return `User question:\n${message}`;
  }
  return `${intentBlock}\n\nUser message:\n${message}`;
};

const parsePdfDataUrl = (dataUrl) => {
  const raw = String(dataUrl || "").trim();
  if (!raw) return null;
  const match = raw.match(/^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Resume PDF payload is invalid.");
  }
  const mimeType = match[1].toLowerCase();
  if (mimeType !== "application/pdf") {
    throw new Error("Only PDF resumes are supported.");
  }
  const base64Payload = match[2];
  const size = Buffer.byteLength(base64Payload, "base64");
  if (size > MAX_RESUME_BYTES) {
    throw new Error("Resume PDF must be 5MB or smaller.");
  }
  return {
    dataUrl: raw,
    mimeType,
    size,
    buffer: Buffer.from(base64Payload, "base64")
  };
};

const extractResumeTextFromPdfDataUrl = async (dataUrl) => {
  const parsed = parsePdfDataUrl(dataUrl);
  if (!parsed) return "";

  const parser = new PDFParse({ data: parsed.buffer });
  try {
    const parsedPdf = await parser.getText();
    const normalized = String(parsedPdf?.text || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return normalized.slice(0, 12000);
  } finally {
    await parser.destroy();
  }
};

const getRequestUserIfAny = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded?.id) return null;
    return await User.findById(decoded.id).select("resumeDocument");
  } catch {
    return null;
  }
};

const readErrorMessage = (error) => {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  if (typeof error?.error?.message === "string") return error.error.message;
  if (typeof error?.response?.data?.message === "string") return error.response.data.message;
  if (typeof error?.data?.message === "string") return error.data.message;
  if (typeof error?.error === "string") return error.error;
  return "";
};

// ─── Groq API call (replaces Puter.js) ────────────────────────────
const requestGroqAI = async (messages) => {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 2000
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
};

const formatAssistantReply = (rawText) => {
  let text = String(rawText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) return OUT_OF_SCOPE_RESPONSE;

  // Strip markdown formatting that the model adds
  text = text
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")   // ***bold italic*** → plain
    .replace(/\*\*(.*?)\*\*/g, "$1")        // **bold** → plain
    .replace(/\*(.*?)\*/g, "$1")            // *italic* → plain
    .replace(/^#{1,6}\s+/gm, "")           // ### Heading → Heading
    .replace(/`([^`]+)`/g, "$1");           // `code` → code

  const hasLineBreaks = text.includes("\n");
  if (!hasLineBreaks && text.length > 320) {
    const chunks = text
      .split(". ")
      .map((part) => part.trim())
      .filter(Boolean);
    text = chunks
      .map((part) => (/^[\-\d]/.test(part) ? part : `${part}${/[.!?]$/.test(part) ? "" : "."}`))
      .join("\n");
  }

  text = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^\d+\)\s+/.test(trimmed)) return trimmed.replace(/^(\d+)\)\s+/, "$1. ");
      if (/^[•*+]\s+/.test(trimmed)) return trimmed.replace(/^[•*+]\s+/, "- ");
      if (/^[•*+](?=[A-Za-z])/.test(trimmed)) return trimmed.replace(/^[•*+]/, "- ");
      return trimmed;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length > 2200) {
    text = `${text.slice(0, 2197).trim()}...`;
  }

  return text || OUT_OF_SCOPE_RESPONSE;
};

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const message = String(req.body?.message || "").trim();
    const history = sanitizeHistory(req.body?.history);
    const directResumeDataUrl = String(req.body?.resumeDataUrl || "").trim();
    const useProfileResume = Boolean(req.body?.useProfileResume);

    if (!message) {
      res.status(400);
      throw new Error("Message is required.");
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400);
      throw new Error(`Message is too long. Keep it under ${MAX_MESSAGE_LENGTH} characters.`);
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        message: "CareerAI is not configured.",
        reply: "CareerAI is not configured on the server. Add GROQ_API_KEY in backend .env."
      });
    }

    let intent = detectIntent(message);
    let resumeDataUrl = directResumeDataUrl;
    let resumeSource = "none";
    let resumeText = "";

    if (!resumeDataUrl && (useProfileResume || intent === "resume")) {
      const user = await getRequestUserIfAny(req);
      const profileResumeDataUrl = String(user?.resumeDocument?.dataUrl || "").trim();
      if (profileResumeDataUrl) {
        resumeDataUrl = profileResumeDataUrl;
        resumeSource = "profile";
      }
    }

    if (resumeDataUrl && resumeSource === "none") {
      resumeSource = "upload";
    }

    if (resumeDataUrl) {
      try {
        resumeText = await extractResumeTextFromPdfDataUrl(resumeDataUrl);
      } catch (error) {
        res.status(400);
        throw new Error(readErrorMessage(error) || "Unable to read resume PDF.");
      }
      if (resumeText) {
        intent = "resume";
      }
    }

    let prompt = createPromptForIntent(intent, message);
    if (intent === "resume" && resumeText) {
      prompt = `${INTENT_PROMPTS.resume}

Resume text:
${resumeText}

User message:
${message}`;
    }

    const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: prompt }];

    let reply = OUT_OF_SCOPE_RESPONSE;
    try {
      const rawReply = await requestGroqAI(messages);
      reply = formatAssistantReply(rawReply);
    } catch (error) {
      const errorMessage = readErrorMessage(error);
      if (config.env !== "production") {
        // eslint-disable-next-line no-console
        console.error("CareerAI Groq request failed:", errorMessage || error);
      }
      const isTimeout =
        String(error?.code || "").toUpperCase().includes("TIMEOUT") ||
        String(errorMessage || "").toLowerCase().includes("timeout");
      reply = isTimeout
        ? "CareerAI upstream timeout. Please retry once."
        : "CareerAI is temporarily unavailable due to upstream AI service issue. Please try again in a few moments.";
    }

    return res.status(200).json({
      reply,
      intent,
      resumeUsed: Boolean(resumeText),
      resumeSource
    });
  })
);

export default router;
