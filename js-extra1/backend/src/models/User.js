import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    period: { type: String, trim: true },
    description: { type: String, trim: true }
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true },
    institute: { type: String, trim: true },
    period: { type: String, trim: true }
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true, default: "" },
    github: { type: String, trim: true, default: "" },
    instagram: { type: String, trim: true, default: "" },
    portfolio: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const avatarSchema = new mongoose.Schema(
  {
    dataUrl: { type: String, default: "" },
    mimeType: { type: String, enum: ["", "image/url", ...IMAGE_MIME_TYPES], default: "" },
    size: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const resumeDocumentSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true, default: "" },
    dataUrl: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0, min: 0 },
    source: { type: String, enum: ["profile", "builder", "external"], default: "profile" },
    uploadedAt: { type: Date, default: null }
  },
  { _id: false }
);

const resumeProjectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const resumeBuilderSchema = new mongoose.Schema(
  {
    template: { type: String, default: "modern" },
    spacing: { type: String, enum: ["compact", "medium", "large"], default: "medium" },
    fontFamily: { type: String, enum: ["Inter", "Satoshi", "Poppins", "Roboto"], default: "Inter" },
    fontSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    themeColor: { type: String, enum: ["blue", "teal", "green", "purple", "brown"], default: "blue" },
    includePhoto: { type: Boolean, default: true },
    fullName: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    skills: [{ type: String, trim: true }],
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [resumeProjectSchema],
    lastUpdatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const roadmapSelectionSchema = new mongoose.Schema(
  {
    hasSelected: { type: Boolean, default: false },
    techStackSlug: { type: String, trim: true, default: "" },
    techStackTitle: { type: String, trim: true, default: "" },
    selectedAt: { type: Date, default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: "" },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["student", "jobseeker", "recruiter", "admin"], default: "jobseeker" },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    experienceLevel: { type: String, enum: ["", "fresher", "experienced"], default: "" },
    companyName: { type: String, trim: true, default: "" },
    isDemoUser: { type: Boolean, default: false },
    credits: { type: Number, default: 0, min: 0 },
    freePostsUsed: { type: Number, default: 0, min: 0 },
    location: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    skills: [{ type: String, trim: true }],
    experience: [experienceSchema],
    education: [educationSchema],
    resumeUrl: { type: String, trim: true, default: "" },
    avatar: { type: avatarSchema, default: () => ({}) },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    resumeDocument: { type: resumeDocumentSchema, default: () => ({}) },
    resumeBuilder: { type: resumeBuilderSchema, default: () => ({}) },
    roadmapSelection: { type: roadmapSelectionSchema, default: () => ({}) },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }]
  },
  { timestamps: true }
);

userSchema.pre("save", async function saveHash(next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
