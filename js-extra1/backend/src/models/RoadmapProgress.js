import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    complete: { type: Boolean, default: false },
    resources: [{ type: String, trim: true }]
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    progress: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const roadmapProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pathKey: { type: String, required: true, trim: true },
    pathTitle: { type: String, required: true, trim: true },
    completion: { type: Number, min: 0, max: 100, default: 0 },
    milestones: [milestoneSchema],
    certifications: [certificationSchema]
  },
  { timestamps: true }
);

roadmapProgressSchema.index({ user: 1, pathKey: 1 }, { unique: true });

const RoadmapProgress = mongoose.model("RoadmapProgress", roadmapProgressSchema);

export default RoadmapProgress;
