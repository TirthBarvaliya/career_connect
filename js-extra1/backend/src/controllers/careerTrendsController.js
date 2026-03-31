import CareerTrendCache from "../models/CareerTrendCache.js";

// ── Fallback domains if AI or Adzuna fail ─────────────────────────────
const FALLBACK_TRENDS = [
  { id: "1", title: "AI / ML Engineering", completion: 88 },
  { id: "2", title: "Full-Stack Development", completion: 75 },
  { id: "3", title: "Cloud & DevOps", completion: 62 },
  { id: "4", title: "Cybersecurity", completion: 51 }
];

// ── Helpers ────────────────────────────────────────────────────────────
const getStartOfDayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Step 1: Ask AI for today's 4 trending tech job domains.
 * Returns an array of simple domain title strings.
 */
const pickTrendingDomainsFromAI = async () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a tech labor market analyst. Based on current 2026 hiring trends, return EXACTLY 4 of the hottest, most in-demand tech job domains right now.

RULES:
- Each domain must be SHORT: exactly 2-3 words max, e.g. "AI Engineering", "Platform Engineering", "MLOps", "Edge Computing"
- Do NOT use long titles like "Generative AI Prompt Engineering" — shorten to "AI Prompting" or "GenAI Engineering"
- Focus on genuinely emerging or high-demand areas, not generic ones
- Vary your picks — avoid repeating the same 4 every time
- Output STRICTLY as a JSON array of strings, nothing else

Example: ["AI Engineering", "Platform Engineering", "MLOps", "Edge Computing"]`;

  const models = ["google/gemma-3-12b-it:free", "google/gemma-3-4b-it:free"];

  for (const model of models) {
    try {
      console.log(`[${new Date().toISOString()}] Career Trends: Trying AI model ${model}`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Career Connect Trends"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "user", content: "Return only valid JSON. " + prompt }
          ],
          temperature: 0.9
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const match = content.match(/\[[\s\S]*\]/);
      if (match) content = match[0];

      const domains = JSON.parse(content);
      if (Array.isArray(domains) && domains.length >= 4 && typeof domains[0] === "string") {
        return domains.slice(0, 4);
      }
    } catch (error) {
      console.warn(`Career Trends AI failed (${model}):`, error.message);
    }

    await new Promise((r) => setTimeout(r, 800));
  }

  return null;
};

/**
 * Step 2: For each domain title, query Adzuna to get real job count.
 * Uses the India endpoint by default.
 */
const getAdzunaJobCount = async (searchTerm) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return 0;

  try {
    const encoded = encodeURIComponent(searchTerm);
    // Use India (in) — change to "us", "gb", etc. if needed
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=1&what=${encoded}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Adzuna: ${response.status} for "${searchTerm}"`);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.warn(`Adzuna error for "${searchTerm}":`, error.message);
    return 0;
  }
};

/**
 * Normalize job counts to 0-100 scale for the radial rings.
 */
const normalizeToPercent = (trends) => {
  const maxCount = Math.max(...trends.map((t) => t.jobCount), 1);
  return trends.map((t, index) => ({
    id: String(index + 1),
    title: t.title,
    completion: Math.max(8, Math.round((t.jobCount / maxCount) * 100)),
    jobCount: t.jobCount,
    source: "adzuna"
  }));
};

/**
 * GET /api/landing/career-trends
 *
 * Public endpoint (no auth). Returns 4 trending career domains with real job counts.
 * Cached for 24 hours. Pipeline: AI → Adzuna → MongoDB cache.
 */
export const getCareerTrends = async (req, res) => {
  try {
    const startOfToday = getStartOfDayUTC();
    const cacheKey = "daily-career-trends";

    // ── Check cache ───────────────────────────────────────────────────
    const cached = await CareerTrendCache.findOne({ cacheKey }).lean();
    if (cached && new Date(cached.generatedAt) >= startOfToday) {
      const normalized = normalizeToPercent(cached.trends);
      return res.json({ trends: normalized, generatedAt: cached.generatedAt, cached: true });
    }

    // ── Step 1: Get trending domains from AI ──────────────────────────
    let domainNames = await pickTrendingDomainsFromAI();
    if (!domainNames) {
      domainNames = FALLBACK_TRENDS.map((t) => t.title);
      console.log("Career Trends: Using fallback domain names (AI unavailable)");
    }
    console.log(`Career Trends: AI picked domains → ${domainNames.join(", ")}`);

    // ── Step 2: Get real job counts from Adzuna ───────────────────────
    const trends = [];
    for (const name of domainNames) {
      const jobCount = await getAdzunaJobCount(name);
      trends.push({ title: name, jobCount, source: "adzuna" });
      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    // If all counts are 0 (Adzuna might be down), fallback
    const allZero = trends.every((t) => t.jobCount === 0);
    if (allZero) {
      console.warn("Career Trends: All Adzuna counts are 0, using fallback data");
      return res.json({ trends: FALLBACK_TRENDS, generatedAt: new Date(), cached: false });
    }

    // ── Step 3: Cache results ─────────────────────────────────────────
    const now = new Date();
    const expiresAt = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    await CareerTrendCache.findOneAndUpdate(
      { cacheKey },
      { cacheKey, trends, generatedAt: now, expiresAt },
      { upsert: true, new: true }
    );

    const normalized = normalizeToPercent(trends);
    return res.json({ trends: normalized, generatedAt: now, cached: false });
  } catch (error) {
    console.error("Career Trends error:", error.message);
    return res.json({ trends: FALLBACK_TRENDS, generatedAt: new Date(), cached: false });
  }
};
