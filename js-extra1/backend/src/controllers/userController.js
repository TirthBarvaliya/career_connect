import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import calculateProfileCompletion from "../utils/profileCompletion.js";
import { mapJobForClient } from "../utils/jobFormatter.js";
import { isJobSeekerRole, normalizeRole } from "../utils/roles.js";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const PDF_MIME_TYPES = new Set(["application/pdf"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const RESUME_TEMPLATES = new Set(["modern", "classic", "minimal"]);

const emptyAvatar = () => ({
  dataUrl: "",
  mimeType: "",
  size: 0,
  updatedAt: null
});

const emptyResumeDocument = () => ({
  fileName: "",
  dataUrl: "",
  mimeType: "",
  size: 0,
  source: "profile",
  uploadedAt: null
});

const normalizeText = (value, maxLength = 5000) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const normalizeExperienceLevel = (value) =>
  value === "experienced" || value === "fresher" ? value : "";
const canWithdrawStatuses = new Set(["Applied", "Review", "Shortlisted", "Interviewing"]);

const normalizeTextArray = (value, maxItems = 40, maxLength = 120) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeText(String(item), maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
};

const normalizeExperience = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      title: normalizeText(item?.title, 120),
      company: normalizeText(item?.company, 120),
      period: normalizeText(item?.period, 80),
      description: normalizeText(item?.description, 800)
    }))
    .filter((item) => item.title || item.company || item.period || item.description)
    .slice(0, 20);
};

const normalizeEducation = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      degree: normalizeText(item?.degree, 140),
      institute: normalizeText(item?.institute, 140),
      fieldOfStudy: normalizeText(item?.fieldOfStudy, 140),
      startYear: normalizeText(item?.startYear, 10),
      endYear: normalizeText(item?.endYear, 10),
      cgpa: normalizeText(item?.cgpa, 20),
      description: normalizeText(item?.description, 500),
      period: normalizeText(item?.period, 80)
    }))
    .filter((item) => item.degree || item.institute)
    .slice(0, 20);
};

const normalizeProjects = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      name: normalizeText(item?.name, 140),
      link: normalizeOptionalUrl(item?.link),
      description: normalizeText(item?.description, 600)
    }))
    .filter((item) => item.name || item.link || item.description)
    .slice(0, 20);
};

// Soft URL validator — returns empty string instead of throwing for invalid URLs
const normalizeOptionalUrl = (value) => {
  const cleaned = normalizeText(value, 1000);
  if (!cleaned) return "";
  try {
    const parsed = new URL(cleaned);
    if (["http:", "https:"].includes(parsed.protocol)) return parsed.toString();
  } catch {
    // Not a valid URL — just store the raw text
  }
  return cleaned;
};

const normalizeUrl = (value, label) => {
  const cleaned = normalizeText(value, 1000);
  if (!cleaned) return "";
  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${label} must start with http:// or https://`);
  }
  return parsed.toString();
};

const parseDataUrl = (dataUrl) => {
  if (typeof dataUrl !== "string" || !dataUrl.trim()) return null;
  const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const size = Buffer.byteLength(base64Payload, "base64");
  return { mimeType, size, dataUrl: dataUrl.trim() };
};

const normalizeAvatar = (value) => {
  if (value === null) return emptyAvatar();
  if (value === undefined) return undefined;
  if (typeof value !== "object") {
    throw new Error("Avatar payload must be a valid object.");
  }

  const parsed = parseDataUrl(value.dataUrl || "");
  if (!parsed) return emptyAvatar();
  if (!IMAGE_MIME_TYPES.has(parsed.mimeType)) {
    throw new Error("Profile photo must be JPG, JPEG, or PNG.");
  }
  if (parsed.size > MAX_UPLOAD_BYTES) {
    throw new Error("Profile photo must be 5MB or smaller.");
  }

  return {
    dataUrl: parsed.dataUrl,
    mimeType: parsed.mimeType,
    size: parsed.size,
    updatedAt: new Date()
  };
};

const normalizeResumeDocument = (value, defaultSource = "profile") => {
  if (value === null) return emptyResumeDocument();
  if (value === undefined) return undefined;
  if (typeof value !== "object") {
    throw new Error("Resume payload must be a valid object.");
  }

  const parsed = parseDataUrl(value.dataUrl || "");
  if (!parsed) return emptyResumeDocument();
  if (!PDF_MIME_TYPES.has(parsed.mimeType)) {
    throw new Error("Resume document must be a PDF.");
  }
  if (parsed.size > MAX_UPLOAD_BYTES) {
    throw new Error("Resume document must be 5MB or smaller.");
  }

  const source = ["profile", "builder", "external"].includes(value.source)
    ? value.source
    : defaultSource;

  return {
    fileName: normalizeText(value.fileName || "resume.pdf", 160),
    dataUrl: parsed.dataUrl,
    mimeType: parsed.mimeType,
    size: parsed.size,
    source,
    uploadedAt: new Date()
  };
};

const normalizeSocialLinks = (value) => {
  if (!value || typeof value !== "object") {
    return {
      linkedin: "",
      github: "",
      instagram: "",
      portfolio: ""
    };
  }

  return {
    linkedin: normalizeUrl(value.linkedin, "LinkedIn URL"),
    github: normalizeUrl(value.github, "GitHub URL"),
    instagram: normalizeUrl(value.instagram, "Instagram URL"),
    portfolio: normalizeUrl(value.portfolio, "Portfolio URL")
  };
};

const normalizeResumeBuilder = (value, user) => {
  const payload = value && typeof value === "object" ? value : {};
  const VALID_SPACING = new Set(["compact", "medium", "large"]);
  const VALID_FONT = new Set(["Inter", "Satoshi", "Poppins", "Roboto"]);
  const VALID_FONT_SIZE = new Set(["small", "medium", "large"]);
  const VALID_COLOR = new Set(["blue", "teal", "green", "purple", "brown"]);

  return {
    template: typeof payload.template === "string" && payload.template.trim() ? payload.template.trim() : "modern",
    spacing: VALID_SPACING.has(payload.spacing) ? payload.spacing : "medium",
    fontFamily: VALID_FONT.has(payload.fontFamily) ? payload.fontFamily : "Inter",
    fontSize: VALID_FONT_SIZE.has(payload.fontSize) ? payload.fontSize : "medium",
    themeColor: VALID_COLOR.has(payload.themeColor) ? payload.themeColor : "blue",
    includePhoto: typeof payload.includePhoto === "boolean" ? payload.includePhoto : true,
    fullName: normalizeText(payload.fullName || user?.name, 120),
    headline: normalizeText(payload.headline || user?.headline, 140),
    email: normalizeText(payload.email || user?.email, 140),
    phone: normalizeText(payload.phone, 50),
    location: normalizeText(payload.location || user?.location, 120),
    summary: normalizeText(payload.summary || user?.bio, 1400),
    skills: normalizeTextArray(payload.skills || user?.skills, 40, 80),
    experience: normalizeExperience(payload.experience || user?.experience),
    education: normalizeEducation(payload.education || user?.education),
    projects: normalizeProjects(payload.projects),
    lastUpdatedAt: new Date()
  };
};

const profileResponse = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  experienceLevel: user.experienceLevel || "",
  companyName: user.companyName,
  location: user.location,
  headline: user.headline,
  bio: user.bio,
  skills: user.skills,
  experience: user.experience,
  education: user.education,
  resumeUrl: user.resumeUrl,
  avatar: user.avatar || emptyAvatar(),
  socialLinks: user.socialLinks || normalizeSocialLinks({}),
  resumeDocument: user.resumeDocument || emptyResumeDocument(),
  resumeBuilder: user.resumeBuilder || {
    template: "modern",
    includePhoto: true,
    fullName: user.name || "",
    headline: user.headline || "",
    email: user.email || "",
    phone: "",
    location: user.location || "",
    summary: user.bio || "",
    skills: user.skills || [],
    experience: user.experience || [],
    education: user.education || [],
    projects: [],
    lastUpdatedAt: null
  },
  roadmapSelection: user.roadmapSelection || {
    hasSelected: false,
    techStackSlug: "",
    techStackTitle: "",
    selectedAt: null
  },
  profileCompletion: calculateProfileCompletion(user),
  savedJobs: user.savedJobs
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedJobs");
  return res.status(200).json({ profile: profileResponse(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedJobs");
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    user.name = normalizeText(req.body.name, 120);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "location")) {
    user.location = normalizeText(req.body.location, 120);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "headline")) {
    user.headline = normalizeText(req.body.headline, 160);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "bio")) {
    user.bio = normalizeText(req.body.bio, 2400);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "companyName")) {
    user.companyName = normalizeText(req.body.companyName, 160);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "experienceLevel")) {
    user.experienceLevel = normalizeExperienceLevel(req.body.experienceLevel);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "skills")) {
    user.skills = normalizeTextArray(req.body.skills, 40, 80);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "experience")) {
    user.experience = normalizeExperience(req.body.experience);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "education")) {
    user.education = normalizeEducation(req.body.education);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "socialLinks")) {
    user.socialLinks = normalizeSocialLinks(req.body.socialLinks);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "avatar")) {
    user.avatar = normalizeAvatar(req.body.avatar);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "resumeDocument")) {
    const nextResumeDoc = normalizeResumeDocument(req.body.resumeDocument, "profile");
    user.resumeDocument = nextResumeDoc;
    user.resumeUrl = nextResumeDoc?.dataUrl || "";
  } else if (Object.prototype.hasOwnProperty.call(req.body, "resumeUrl")) {
    user.resumeUrl = normalizeUrl(req.body.resumeUrl, "Resume URL");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "resumeBuilder")) {
    user.resumeBuilder = normalizeResumeBuilder(req.body.resumeBuilder, user);
  }

  await user.save();
  await user.populate("savedJobs");

  return res.status(200).json({ message: "Profile updated", profile: profileResponse(user) });
});

export const updateResumeBuilder = asyncHandler(async (req, res) => {
  if (!isJobSeekerRole(req.user.role)) {
    res.status(403);
    throw new Error("Only job seeker accounts can update resume builder.");
  }

  const user = await User.findById(req.user._id).populate("savedJobs");
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  user.resumeBuilder = normalizeResumeBuilder(req.body.resumeBuilder, user);

  if (Object.prototype.hasOwnProperty.call(req.body, "resumeDocument")) {
    const nextResumeDoc = normalizeResumeDocument(req.body.resumeDocument, "builder");
    user.resumeDocument = nextResumeDoc;
    user.resumeUrl = nextResumeDoc?.dataUrl || "";
  }

  await user.save();
  await user.populate("savedJobs");

  return res.status(200).json({
    message: "Resume builder updated",
    profile: profileResponse(user)
  });
});

export const saveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }

  await User.updateOne(
    { _id: req.user._id },
    {
      $addToSet: {
        savedJobs: job._id
      }
    }
  );

  return res.status(200).json({ message: "Job saved successfully." });
});

export const unsaveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  await User.updateOne(
    { _id: req.user._id },
    {
      $pull: {
        savedJobs: jobId
      }
    }
  );
  return res.status(200).json({ message: "Saved job removed." });
});

export const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedJobs");
  return res.status(200).json({ jobs: user.savedJobs.map(mapJobForClient) });
});

export const getAppliedJobs = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate("job")
    .sort({ createdAt: -1 })
    .lean(); // Use lean to get custom fields not in schema

  const payload = applications.map((application) => ({
    id: String(application._id),
    status: application.extendedStatus || application.status,
    canWithdraw: canWithdrawStatuses.has(application.status),
    matchScore: application.matchScore,
    message: application.message,
    appliedAt: application.createdAt,
    interview: application.interview,
    job: application.job ? mapJobForClient(application.job) : null
  }));

  return res.status(200).json({ applications: payload });
});

// ─── AI-Powered Profile Suggestions (Groq) ───────────────────────
export const getAISuggestions = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({
      suggestions: [
        "AI suggestions require GROQ_API_KEY in backend .env.",
        "Add your Groq API key to enable this feature.",
        "Visit console.groq.com to get a free API key."
      ]
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const profileSnapshot = {
    name: user.name || "",
    headline: user.headline || "",
    bio: user.bio || "",
    skills: (user.skills || []).join(", ") || "none",
    experienceCount: (user.experience || []).length,
    experienceDetails: (user.experience || []).map(e => `${e.title} at ${e.company} (${e.period})`).join("; ") || "none",
    educationCount: (user.education || []).length,
    educationDetails: (user.education || []).map(e => `${e.degree} from ${e.institute}`).join("; ") || "none",
    hasPhoto: Boolean(user.avatar?.dataUrl),
    hasResume: Boolean(user.resumeDocument?.dataUrl),
    hasLinkedin: Boolean(user.socialLinks?.linkedin),
    hasGithub: Boolean(user.socialLinks?.github),
    hasPortfolio: Boolean(user.socialLinks?.portfolio),
    location: user.location || "not set"
  };

  const systemPrompt = `You are an expert career advisor reviewing a job seeker's profile. 
Analyze the profile data below and generate exactly 4 short, actionable improvement suggestions.
Each suggestion should be specific to what is missing or weak in their profile.
Focus on: completeness, impact, discoverability, and professional presentation.

Profile data:
${JSON.stringify(profileSnapshot)}

You MUST respond in pure JSON format exactly like this, with no markdown or extra text:
{"suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]}`;

  try {
    const { default: axios } = await import("axios");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze my profile and suggest improvements." }
        ],
        temperature: 0.6,
        max_tokens: 400,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const parsed = JSON.parse(response.data.choices[0].message.content);
    return res.status(200).json({ suggestions: parsed.suggestions || [] });
  } catch (error) {
    console.error("Groq profile suggestions error:", error.response?.data || error.message);
    return res.status(200).json({
      suggestions: [
        "Could not reach AI service. Please try again later.",
        "Ensure your profile is complete with skills and experience.",
        "A good profile photo increases visibility by 40%."
      ]
    });
  }
});
