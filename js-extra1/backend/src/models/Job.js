import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    salaryMax: { type: Number, default: 0, min: 0 },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time"
    },
    remote: { type: Boolean, default: false },
    level: {
      type: String,
      enum: ["Entry", "Mid", "Senior"],
      default: "Mid"
    },
    tags: [{ type: String, trim: true }],
    experienceRequired: {
      type: String,
      enum: ["fresher", "experienced", "both"],
      default: "both"
    },
    minExperience: { type: Number, default: 0, min: 0 },
    maxExperience: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "closed", "flagged", "removed"], default: "active" },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", tags: "text" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
