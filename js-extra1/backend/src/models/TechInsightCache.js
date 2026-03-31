import mongoose from "mongoose";

const techInsightCacheSchema = new mongoose.Schema(
  {
    // "user:<userId>" for personalized, "general" for fallback
    cacheKey: { type: String, required: true, unique: true, index: true },
    // The user's skills snapshot that generated these insights
    skillsSnapshot: [{ type: String }],
    // MD5 hash of skills + headline + bio — used to detect profile changes
    profileFingerprint: { type: String, default: "" },
    // Array of insight objects
    insights: [
      {
        emoji: { type: String, default: "📡" },
        title: { type: String, required: true },
        body: { type: String, required: true }
      }
    ],
    // How many times the user has clicked "Refresh" today
    dailyRefreshCount: { type: Number, default: 0 },
    // The date (YYYY-MM-DD UTC) for which the refresh count applies
    refreshDate: { type: String, default: "" },
    // When this cache entry was generated
    generatedAt: { type: Date, default: Date.now },
    // TTL — MongoDB automatically deletes expired docs at this time
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

const TechInsightCache = mongoose.model("TechInsightCache", techInsightCacheSchema);

export default TechInsightCache;
