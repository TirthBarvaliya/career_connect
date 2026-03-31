import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import TechInsightCache from "../models/TechInsightCache.js";

const MAX_DAILY_REFRESHES = 3;

// ── Fallback insights when AI is unavailable or profile is empty ──────
const GENERAL_FALLBACK_INSIGHTS = [
  {
    emoji: "🔥",
    title: "AI/ML Demand Surge",
    body: "Artificial Intelligence and Machine Learning roles have grown 2.3× in the last year across major tech companies."
  },
  {
    emoji: "📈",
    title: "Full-Stack Still Dominates",
    body: "Full-stack development remains the most in-demand skillset, with MERN and Next.js leading frontend-backend combos."
  },
  {
    emoji: "☁️",
    title: "Cloud Skills Pay Premium",
    body: "Cloud certifications (AWS, GCP, Azure) boost average salaries by 18-25% compared to non-certified peers."
  },
  {
    emoji: "🎯",
    title: "Complete Your Profile",
    body: "Add your skills and bio to get personalized tech industry insights tailored to your career path."
  }
];

const buildProfileFingerprint = (skills, headline, bio) => {
  const raw = [...skills].sort().join("|") + "||" + headline + "||" + bio;
  return crypto.createHash("md5").update(raw).digest("hex");
};

const getTodayUTC = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
};

const getStartOfDayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Calls OpenRouter API (Gemma 3 12B → 4B fallback).
 */
const generateInsightsFromAI = async ({ skills, headline, bio }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("Tech Pulse: OPENROUTER_API_KEY not set.");
    return null;
  }

  const userContext = headline || bio
    ? `The user's headline is: "${headline}"\nTheir bio is: "${bio}"`
    : "The user has not provided a headline or bio.";

  const prompt = `You are a tech industry analyst providing insights for a professional's dashboard.
${userContext}
Their skills are: ${skills.length ? skills.join(", ") : "not specified"}

Provide exactly 4 short, actionable tech industry insights based on these skills and profile.
Topics should include demand trends, salary trends, emerging tools, or career tips for 2026.
Format the output STRICTLY as a JSON array of objects, with NO surrounding markdown blocks.

CRITICAL JSON RULES:
1. Every key and every string value MUST be enclosed in double quotes.
2. The emoji value MUST be a string in double quotes (e.g., "emoji": "🔥"). Do NOT leave the emoji unquoted.

Each object must have these exact keys:
- "emoji": A single relevant emoji (like 🔥, 📈, ☁️, 🎯, 📡, 💰, 🧠, ⚡)
- "title": A short 3-5 word title
- "body": A concise 1-2 sentence insight

Example format:
[
  { "emoji": "🔥", "title": "React Server Components", "body": "Adoption is surging. Add them to your skill stack." }
]`;

  const modelsToTry = [
    "google/gemma-3-12b-it:free",
    "google/gemma-3-4b-it:free"
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      console.log(`[${new Date().toISOString()}] Tech Pulse: Attempting model ${i + 1}/${modelsToTry.length}: ${model}`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Career Connect Dashboard"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "user", content: "You are a helpful API that returns strictly valid JSON arrays. " + prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.warn(`Tech Pulse: Model ${model} failed with status ${response.status}: ${errorData}`);
        continue;
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const match = content.match(/\[[\s\S]*\]/);
      if (match) content = match[0];

      content = content.replace(/"emoji":\s*([^\s",}]+)/g, (fullMatch, emojiGroup) => {
        if (!emojiGroup.startsWith('"')) return `"emoji": "${emojiGroup.trim()}"`;
        return fullMatch;
      });

      const insights = JSON.parse(content);
      if (Array.isArray(insights) && insights.length > 0 && insights[0].title && insights[0].body) {
        return insights;
      }
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] Tech Pulse: Model ${model} failed:`, error.message);
    }

    if (i < modelsToTry.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.error("Tech Pulse: All OpenRouter models failed.");
  return null;
};

/**
 * Helper: save insights to cache and return the response object.
 */
const saveAndRespond = async (res, { cacheKey, skills, fingerprint, insights, refreshCount, todayStr, cached, limitReached }) => {
  const now = new Date();
  const startOfToday = getStartOfDayUTC();
  // Expire at midnight tomorrow so MongoDB TTL auto-deletes old docs
  const expiresAt = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  await TechInsightCache.findOneAndUpdate(
    { cacheKey },
    {
      cacheKey,
      skillsSnapshot: skills,
      profileFingerprint: fingerprint,
      insights,
      dailyRefreshCount: refreshCount,
      refreshDate: todayStr,
      generatedAt: now,
      expiresAt
    },
    { upsert: true, new: true }
  );

  return res.json({
    insights,
    generatedAt: now,
    cached: Boolean(cached),
    limitReached: Boolean(limitReached)
  });
};

/**
 * GET /api/dashboard/tech-insights
 *
 * Flow:
 *   - Page load (no forceRefresh): return cached insights if same day & same profile.
 *   - Refresh button (forceRefresh=true):
 *       • If dailyRefreshCount < 3 for today → call AI, save, increment count.
 *       • If dailyRefreshCount >= 3 → return the user's STORED insights + limitReached.
 *   - On new day: refreshDate won't match today → count resets to 0.
 *   - TTL index auto-deletes docs that expire (set to midnight next day).
 */
export const getTechInsights = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("skills headline bio summary").lean();
  const skills = (user?.skills || []).map((s) => String(s).trim()).filter(Boolean);
  const headline = String(user?.headline || "").trim();
  const bio = String(user?.bio || user?.summary || "").trim();
  const forceRefresh = req.query.forceRefresh === "true";

  const cacheKey = skills.length ? `user:${req.user._id}` : "general";
  const fingerprint = buildProfileFingerprint(skills, headline, bio);
  const todayStr = getTodayUTC();
  const startOfToday = getStartOfDayUTC();

  // Fetch existing cache
  const cached = await TechInsightCache.findOne({ cacheKey });

  // Determine today's refresh count
  let refreshCount = 0;
  if (cached && cached.refreshDate === todayStr) {
    refreshCount = cached.dailyRefreshCount || 0;
  }
  // If refreshDate doesn't match today → count is 0 (new day reset)

  // ── CASE 1: Normal page load (no forceRefresh) ─────────────────────
  if (!forceRefresh) {
    if (cached && cached.insights?.length) {
      const generatedDate = new Date(cached.generatedAt);
      const isSameDay = generatedDate >= startOfToday;
      const isSameProfile = cached.profileFingerprint === fingerprint;

      if (isSameDay && isSameProfile) {
        // Return stored insights, no AI call
        return res.json({
          insights: cached.insights,
          generatedAt: cached.generatedAt,
          cached: true,
          limitReached: false
        });
      }
    }

    // Cache miss, stale, or profile changed on page load → generate fresh
    let insights = null;
    try {
      if (skills.length || headline || bio) {
        insights = await generateInsightsFromAI({ skills, headline, bio });
      }
    } catch (error) {
      console.error("Tech Pulse AI error:", error.message);
    }

    if (!insights || !Array.isArray(insights) || !insights.length) {
      insights = GENERAL_FALLBACK_INSIGHTS;
    }

    return saveAndRespond(res, {
      cacheKey, skills, fingerprint, insights,
      refreshCount, // Don't increment count on automatic page-load generation
      todayStr, cached: false, limitReached: false
    });
  }

  // ── CASE 2: Force refresh (button click) ────────────────────────────

  // 2a. Check if daily limit is reached
  if (refreshCount >= MAX_DAILY_REFRESHES) {
    // Return the user's STORED insights (not general fallback)
    const storedInsights = cached?.insights?.length ? cached.insights : GENERAL_FALLBACK_INSIGHTS;
    return res.json({
      insights: storedInsights,
      generatedAt: cached?.generatedAt || new Date(),
      cached: true,
      limitReached: true
    });
  }

  // 2b. Under limit → call AI
  let insights = null;
  try {
    if (skills.length || headline || bio) {
      insights = await generateInsightsFromAI({ skills, headline, bio });
    }
  } catch (error) {
    console.error("Tech Pulse AI error:", error.message);
  }

  if (!insights || !Array.isArray(insights) || !insights.length) {
    // AI failed → return stored insights if available, otherwise fallback
    const fallback = cached?.insights?.length ? cached.insights : GENERAL_FALLBACK_INSIGHTS;
    return res.json({
      insights: fallback,
      generatedAt: cached?.generatedAt || new Date(),
      cached: true,
      limitReached: false
    });
  }

  // 2c. AI succeeded → save new insights, increment count
  const newCount = refreshCount + 1;
  return saveAndRespond(res, {
    cacheKey, skills, fingerprint, insights,
    refreshCount: newCount,
    todayStr, cached: false, limitReached: false
  });
});
