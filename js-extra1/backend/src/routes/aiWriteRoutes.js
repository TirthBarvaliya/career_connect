import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../config/env.js";

const router = Router();

// ── Section-specific system prompts ─────────────────────────────────

const PROMPTS = {
  summary: `You are a professional resume writer and ATS optimization expert.
Rewrite the following PROFILE SUMMARY so it becomes:
- ATS-friendly with relevant keywords
- Written in first person (without using "I")
- Professional, confident tone
- Concise (3-5 sentences max, under 80 words)
- Highlights key strengths, years of experience, and core competencies
- Free of grammatical errors

IMPORTANT:
- Preserve the original meaning and facts
- Do NOT invent any experiences, companies, or skills not mentioned
- Do NOT use bullet points for summaries — write in paragraph form
- Return ONLY the rewritten text, nothing else`,

  experience: `You are a professional resume writer and ATS optimization expert.
Rewrite the following WORK EXPERIENCE DESCRIPTION so it becomes:
- ATS-friendly with strong action verbs and measurable results
- Written in past tense with bullet points
- Professional and impactful
- Concise (3-6 bullet points, each 1-2 lines)
- Quantified achievements where possible (use numbers, percentages)

IMPORTANT:
- Preserve the original meaning and facts
- Do NOT invent metrics, companies, or achievements not implied by the text
- Start each bullet with a strong action verb (Developed, Led, Implemented, etc.)
- Return ONLY the rewritten bullet points, nothing else`,

  project: `You are a professional resume writer and ATS optimization expert.
Rewrite the following PROJECT DESCRIPTION so it becomes:
- ATS-friendly with relevant technical keywords
- Concise and impactful (2-4 bullet points or a short paragraph)
- Highlights the tech stack, your role, and key outcomes
- Professional tone

IMPORTANT:
- Preserve the original meaning and facts
- Do NOT invent technologies or features not mentioned
- Return ONLY the rewritten text, nothing else`
};

// ── POST /api/ai/write ──────────────────────────────────────────────

router.post(
  "/write",
  protect,
  asyncHandler(async (req, res) => {
    const { section, text } = req.body;

    // Validate section
    if (!section || !PROMPTS[section]) {
      res.status(400);
      throw new Error("Invalid section. Must be one of: summary, experience, project");
    }

    // Validate text
    const userText = String(text || "").trim();
    if (!userText) {
      res.status(400);
      throw new Error("Text is required. Please write something in the field first.");
    }

    if (userText.length > 5000) {
      res.status(400);
      throw new Error("Text is too long. Keep it under 5000 characters.");
    }

    // Check API key
    if (!config.geminiApiKey) {
      return res.status(503).json({
        message: "AI writing is not configured. Add GEMINI_API_KEY to backend .env file."
      });
    }

    // Call Gemini using the new @google/genai SDK
    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const prompt = `${PROMPTS[section]}\n\nOriginal text:\n"${userText}"`;

      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let generatedText = null;
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt
          });
          generatedText = (response.text || "").trim();
          
          if (generatedText) {
            break; // Success! Break out of the loop
          }
        } catch (error) {
          lastError = error;
          const errMsg = error.message || "";
          
          // If it's a rate limit error (429), log it and let the loop continue to the next model
          if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Too Many Requests")) {
            console.log(`Model ${model} rate limited, trying next...`);
            continue;
          }
          
          // For other errors (like invalid API key), throw immediately
          throw error;
        }
      }

      // If we went through all models and still don't have text
      if (!generatedText) {
        if (lastError) throw lastError; // Throw the last error we got
        res.status(500);
        throw new Error("AI returned an empty response. Please try again.");
      }

      return res.status(200).json({ generatedText });
    } catch (error) {
      const errMsg = error.message || "";

      if (errMsg.includes("API key") || errMsg.includes("API_KEY_INVALID")) {
        return res.status(503).json({
          message: "Invalid Gemini API key. Please check your GEMINI_API_KEY in backend .env."
        });
      }

      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Too Many Requests")) {
        return res.status(429).json({
          message: "Gemini API rate limit reached across all free models. Please wait or try again tomorrow."
        });
      }

      if (config.env !== "production") {
        console.error("Gemini AI write error:", errMsg || error);
      }

      res.status(500);
      throw new Error("AI writing failed. Please try again in a moment.");
    }
  })
);

export default router;
