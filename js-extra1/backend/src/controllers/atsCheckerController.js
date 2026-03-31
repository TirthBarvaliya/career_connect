import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/* ───────────────────────────────────────────────────────
   STEP 1 — Resume Validation Pre-Check
   Determines if the uploaded document is actually a resume
   before running ATS scoring. Returns structured JSON.
   ─────────────────────────────────────────────────────── */
const VALIDATION_PROMPT = `You are an advanced ATS (Applicant Tracking System) validation engine.

Your task is to analyze the uploaded document text and determine whether it is a valid resume BEFORE running ATS scoring.

ANALYSIS TASKS:
1. Determine if the document is a RESUME or NOT
2. Identify presence of key resume sections:
   - Contact Information (email / phone)
   - Skills
   - Work Experience
   - Education
   - Projects (optional but valuable)
3. Detect structural patterns:
   - Bullet points
   - Dates (years like 2020, 2023)
   - Professional tone
4. Check for non-resume patterns:
   - Story writing
   - Random paragraphs
   - Articles / essays
   - Empty or very short text

DECISION RULES:
- Classify as VALID RESUME if at least 2-3 core sections exist and content is professional/job-related.
- Classify as INVALID if missing most resume sections, content is generic/random/unrelated, or no professional info.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "isResume": true/false,
  "confidenceScore": number (0-100),
  "detectedSections": {
    "contact": true/false,
    "skills": true/false,
    "experience": true/false,
    "education": true/false,
    "projects": true/false
  },
  "missingSections": ["list of missing important sections"],
  "reason": "Short explanation of why it is or is not a resume",
  "recommendation": "Helpful suggestion for user"
}

IMPORTANT RULES:
- Do NOT generate ATS score here
- Do NOT reject creative resumes if they still contain core info
- Be tolerant but accurate
- If unsure, lean towards LOW confidence, not hard rejection`;

/**
 * Call Gemini API helper
 */
const callGemini = async (apiKey, prompt, userText) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          role: "user",
          parts: [{ text: `${prompt}\n\n${userText}` }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    },
    {
      headers: { "Content-Type": "application/json" }
    }
  );

  let rawResponse = response.data.candidates[0].content.parts[0].text.trim();

  // Safety cleanup in case model wraps in markdown
  if (rawResponse.startsWith("```json")) {
    rawResponse = rawResponse.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (rawResponse.startsWith("```")) {
    rawResponse = rawResponse.replace(/^```/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(rawResponse);
};

/* ───────────────────────────────────────────────────────
   STEP 2 — ATS Scoring Prompt
   ─────────────────────────────────────────────────────── */
const ATS_SCORING_PROMPT = `You are an expert ATS (Applicant Tracking System) Analyzer and Executive Resume Writer.
Your task is to carefully analyze the provided resume text, calculate an accurate ATS score, provide exactly 5 specific areas for improvement, and generate an enhanced version.

SCORING METHODOLOGY — evaluate EACH category and sum the points:
• Contact Information (0-10 pts): Full name, email, phone, LinkedIn, location present?
• Professional Summary (0-15 pts): Clear, keyword-rich, role-specific? Or vague/missing?
• Work Experience (0-25 pts): Uses action verbs? Quantified achievements? Relevant to target role? Proper date formatting?
• Skills Section (0-15 pts): Industry-relevant keywords? Technical + soft skills? Organized logically?
• Education (0-10 pts): Degree, institution, dates present? GPA if relevant?
• Formatting & Structure (0-10 pts): Clean sections, consistent formatting, no tables/graphics that confuse ATS?
• Projects & Extras (0-10 pts): Relevant projects, certifications, or publications?
• Keyword Optimization (0-5 pts): Does resume use job-posting keywords naturally?

Add the points from ALL 8 categories to calculate the final score (0-100).
A resume with all sections filled perfectly = 90-100. Missing sections or vague content = lower score.
Be PRECISE — read the actual content carefully and score based on what IS present, not generic assumptions.

You MUST respond strictly with a valid JSON object matching the exact structure below. Do not include any markdown formatting, just the raw JSON object.

REQUIRED OUTPUT JSON FORMAT:
{
  "score": <number between 0 and 100 — calculated from the 8 categories above>,
  "improvements": [
    { "category": "Content", "issue": "<Short description of issue>", "fix": "<Actionable fix suggestion>" },
    { "category": "Format", "issue": "<Short description of issue>", "fix": "<Actionable fix suggestion>" },
    { "category": "Skills", "issue": "<Short description of issue>", "fix": "<Actionable fix suggestion>" },
    { "category": "Style", "issue": "<Short description of issue>", "fix": "<Actionable fix suggestion>" },
    { "category": "Sections", "issue": "<Short description of issue>", "fix": "<Actionable fix suggestion>" }
  ],
  "enhancedResume": {
    "fullName": "<string>",
    "headline": "<string>",
    "email": "<string>",
    "phone": "<string>",
    "location": "<string>",
    "summary": "<string (Write a strong 2-3 line professional summary)>",
    "skills": ["<string>", "<string>"],
    "experience": [
      { 
        "title": "<string>", 
        "company": "<string>", 
        "period": "<string>", 
        "description": "<string (Enhance bullets with action verbs, impact metrics, and ATS keywords)>" 
      }
    ],
    "education": [
      { "degree": "<string>", "institute": "<string>", "period": "<string>" }
    ],
    "projects": [
      { "name": "<string>", "link": "<string>", "description": "<string>" }
    ]
  }
}

Important Rules:
1. "score" MUST be calculated from the 8 scoring categories above. Do NOT default to a generic score.
2. "improvements" must cover the 5 categories: Content, Format, Skills, Style, Sections.
3. In "enhancedResume", rewrite bullets with strong action verbs and include quantifiable metrics.
4. If essential data is missing from the raw text, leave it as an empty string. Do not invent personal contact info.
5. If the user provided a TARGET JOB DESCRIPTION, tailor the "skills", "summary", and "experience" to match.`;

/* ───────────────────────────────────────────────────────
   Main Controller
   ─────────────────────────────────────────────────────── */
export const atsCheck = async (req, res) => {
  try {
    const { pdfBase64, jobDescription } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ message: "No PDF data provided." });
    }

    // Decode base64
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(base64Data, "base64");

    // Extract text using pdf-parse v2
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    const resumeText = result.text;
    await parser.destroy();

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: "Could not extract sufficient text from the PDF. Ensure it is a text-based PDF." });
    }

    // Prepare Gemini API
    const GEMINI_ATS_API_KEY = process.env.GEMINI_ATS_API_KEY;
    if (!GEMINI_ATS_API_KEY) {
      return res.status(500).json({ message: "AI Assistant is not configured. Missing API Key." });
    }

    /* ── STEP 1: Validate if the document is a resume ── */
    const validationResult = await callGemini(
      GEMINI_ATS_API_KEY,
      VALIDATION_PROMPT,
      `DOCUMENT TEXT:\n${resumeText}`
    );

    if (!validationResult.isResume || validationResult.confidenceScore < 30) {
      return res.status(400).json({
        message: validationResult.reason || "The uploaded document does not appear to be a resume.",
        validation: validationResult
      });
    }

    /* ── STEP 2: Run full ATS scoring ── */
    const jobDescriptionContext = jobDescription
      ? `\n\nTARGET JOB DESCRIPTION:\n${jobDescription}\nTailor the analysis and the enhanced resume specifically to match this job description.`
      : '';

    const userMessage = `RAW RESUME TEXT:\n${resumeText}${jobDescriptionContext}`;

    const atsData = await callGemini(
      GEMINI_ATS_API_KEY,
      ATS_SCORING_PROMPT,
      userMessage
    );

    // Attach validation metadata to the response
    atsData.validation = validationResult;

    res.json(atsData);

  } catch (error) {
    console.error("ATS Check Error:", error.response?.data || error.message || error);
    const detailedMessage = error.response?.data?.error?.message
      || error.message
      || "An error occurred during ATS analysis. Please try again.";
    res.status(500).json({ message: detailedMessage });
  }
};
