import mongoose from "mongoose";

const careerTrendCacheSchema = new mongoose.Schema(
  {
    // Single shared cache key for all visitors
    cacheKey: { type: String, required: true, unique: true, default: "daily-career-trends" },
    // Array of trending domains with real job counts
    trends: [
      {
        title: { type: String, required: true },
        jobCount: { type: Number, required: true },
        source: { type: String, default: "adzuna" }
      }
    ],
    // When this was generated 
    generatedAt: { type: Date, default: Date.now },
    // TTL — auto-delete after this time
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

const CareerTrendCache = mongoose.model("CareerTrendCache", careerTrendCacheSchema);

export default CareerTrendCache;
