import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Applied", "Review", "Shortlisted", "Interviewing", "Rejected", "Accepted", "Withdrawn"],
      default: "Applied"
    },
    message: { type: String, trim: true, default: "" },
    resumeUrl: { type: String, trim: true, default: "" },
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    decisionMessage: { type: String, trim: true, default: "" },
    emailSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, student: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
