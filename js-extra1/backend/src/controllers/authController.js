import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import generateToken from "../utils/token.js";
import calculateProfileCompletion from "../utils/profileCompletion.js";
import { normalizeRole, ROLE_JOBSEEKER, ROLE_RECRUITER } from "../utils/roles.js";
import config from "../config/env.js";
import { OAuth2Client } from "google-auth-library";
import sendWelcomeEmail from "../utils/welcomeEmail.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FULL_NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,79}$/;
const COMPANY_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9&().,'\-\/\s]{1,99}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;
const EXPERIENCE_LEVELS = new Set(["fresher", "experienced"]);

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const triggerWelcomeEmail = (user) => {
  if (!user?.email) return;
  void (async () => {
    try {
      await sendWelcomeEmail({ to: user.email, userName: user.name });
    } catch (error) {
      if (config.env !== "production") {
        // eslint-disable-next-line no-console
        console.error("[auth] Welcome email send failed:", error?.message || error);
      }
    }
  })();
};

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  status: user.status || "active",
  experienceLevel: user.experienceLevel || "",
  companyName: user.companyName,
  location: user.location,
  headline: user.headline,
  bio: user.bio,
  skills: user.skills,
  experience: user.experience,
  education: user.education,
  resumeUrl: user.resumeUrl,
  avatar: user.avatar || { dataUrl: "", mimeType: "", size: 0, updatedAt: null },
  socialLinks: user.socialLinks || {
    linkedin: "",
    github: "",
    instagram: "",
    portfolio: ""
  },
  resumeDocument: user.resumeDocument || {
    fileName: "",
    dataUrl: "",
    mimeType: "",
    size: 0,
    source: "profile",
    uploadedAt: null
  },
  resumeBuilder: user.resumeBuilder || {
    template: "modern",
    includePhoto: true,
    fullName: user.name,
    headline: user.headline || "",
    email: user.email,
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
  savedJobs: user.savedJobs,
  profileCompletion: calculateProfileCompletion(user)
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName, experienceLevel } = req.body;
  const safeName = normalizeText(name);
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");
  const safeRole = normalizeRole(String(role || ROLE_JOBSEEKER).trim().toLowerCase());
  const safeCompanyName = normalizeText(companyName);
  const safeExperienceLevel = String(experienceLevel || "")
    .trim()
    .toLowerCase();

  if (!safeName || !safeEmail || !safePassword) {
    res.status(400);
    throw new Error("Name, email, and password are required.");
  }

  if (!FULL_NAME_REGEX.test(safeName)) {
    res.status(400);
    throw new Error("Name format is invalid.");
  }

  if (!EMAIL_REGEX.test(safeEmail) || safeEmail.length > 120) {
    res.status(400);
    throw new Error("Email format is invalid.");
  }

  if (!STRONG_PASSWORD_REGEX.test(safePassword)) {
    res.status(400);
    throw new Error(
      "Password must be 8-64 chars with upper, lower, number, and special character."
    );
  }

  if (![ROLE_JOBSEEKER, ROLE_RECRUITER].includes(safeRole)) {
    res.status(400);
    throw new Error("Role is invalid.");
  }

  if (safeRole === ROLE_RECRUITER) {
    if (!safeCompanyName) {
      res.status(400);
      throw new Error("Company name is required for recruiters.");
    }
    if (!COMPANY_NAME_REGEX.test(safeCompanyName)) {
      res.status(400);
      throw new Error("Company name format is invalid.");
    }
  }

  if (safeRole === ROLE_JOBSEEKER && !EXPERIENCE_LEVELS.has(safeExperienceLevel)) {
    res.status(400);
    throw new Error("Experience level must be either fresher or experienced.");
  }

  const existing = await User.findOne({ email: safeEmail });
  if (existing) {
    res.status(409);
    throw new Error("Email already registered.");
  }

  const user = await User.create({
    name: safeName,
    email: safeEmail,
    password: safePassword,
    role: safeRole,
    companyName: safeRole === ROLE_RECRUITER ? safeCompanyName : "",
    experienceLevel: safeRole === ROLE_JOBSEEKER ? safeExperienceLevel : "",
    skills: []
  });

  triggerWelcomeEmail(user);

  return res.status(201).json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");

  if (!safeEmail || !safePassword) {
    res.status(400);
    throw new Error("Email and password are required.");
  }
  if (!EMAIL_REGEX.test(safeEmail) || safeEmail.length > 120) {
    res.status(400);
    throw new Error("Email format is invalid.");
  }
  if (safePassword.length > 128) {
    res.status(400);
    throw new Error("Password is invalid.");
  }

  const user = await User.findOne({ email: safeEmail });
  if (!user || !(await user.comparePassword(safePassword))) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  // Block login for blocked users
  if (user.status === "blocked") {
    res.status(403);
    throw new Error("Your account has been blocked by admin. Please contact support.");
  }

  return res.status(200).json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedJobs");
  return res.status(200).json({ user: sanitizeUser(user) });
});

// ── Helper: verify Google ID token ──
const verifyGoogleToken = async (credential) => {
  if (!credential) throw Object.assign(new Error("Google credential token is required."), { statusCode: 400 });
  if (!config.googleClientId) throw Object.assign(new Error("Google OAuth is not configured on the server."), { statusCode: 500 });

  const client = new OAuth2Client(config.googleClientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error("Invalid Google token. Authentication denied."), { statusCode: 401 });
  }
  if (!payload.email_verified) throw Object.assign(new Error("Google email is not verified."), { statusCode: 401 });
  return payload;
};

// ── Google OAuth Login: returns user if exists, else isNewUser flag ──
export const googleLogin = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = await verifyGoogleToken(req.body.credential);
  } catch (err) {
    res.status(err.statusCode || 400);
    throw err;
  }

  const { sub: googleId, email, name, picture } = payload;
  const safeEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: safeEmail });

  if (user) {
    // Link Google to existing local account if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.provider = user.provider === "local" && user.password ? "local" : "google";
      if (picture && (!user.avatar || !user.avatar.dataUrl)) {
        user.avatar = { dataUrl: picture, mimeType: "image/url", size: 0, updatedAt: new Date() };
      }
      await user.save();
    }
    return res.status(200).json({ token: generateToken(user._id), user: sanitizeUser(user) });
  }

  // New user — don't create yet, let frontend collect role info
  return res.status(200).json({
    isNewUser: true,
    googleProfile: { name: name || "Google User", email: safeEmail, picture: picture || "", googleId }
  });
});

// ── Google OAuth Register: first-time signup with role selection ──
export const googleRegister = asyncHandler(async (req, res) => {
  const { credential, role, companyName, experienceLevel } = req.body;

  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch (err) {
    res.status(err.statusCode || 400);
    throw err;
  }

  const { sub: googleId, email, name, picture } = payload;
  const safeEmail = email.trim().toLowerCase();
  const safeRole = normalizeRole(String(role || ROLE_JOBSEEKER).trim().toLowerCase());
  const safeCompanyName = normalizeText(companyName);
  const safeExperienceLevel = String(experienceLevel || "").trim().toLowerCase();

  if (![ROLE_JOBSEEKER, ROLE_RECRUITER].includes(safeRole)) {
    res.status(400);
    throw new Error("Role is invalid.");
  }
  if (safeRole === ROLE_RECRUITER) {
    if (!safeCompanyName) { res.status(400); throw new Error("Company name is required for recruiters."); }
    if (!COMPANY_NAME_REGEX.test(safeCompanyName)) { res.status(400); throw new Error("Company name format is invalid."); }
  }
  if (safeRole === ROLE_JOBSEEKER && !EXPERIENCE_LEVELS.has(safeExperienceLevel)) {
    res.status(400);
    throw new Error("Experience level must be either fresher or experienced.");
  }

  const existing = await User.findOne({ email: safeEmail });
  if (existing) {
    res.status(409);
    throw new Error("Email already registered. Please login instead.");
  }

  const user = await User.create({
    name: name || "Google User",
    email: safeEmail,
    password: "",
    provider: "google",
    googleId,
    role: safeRole,
    companyName: safeRole === ROLE_RECRUITER ? safeCompanyName : "",
    experienceLevel: safeRole === ROLE_JOBSEEKER ? safeExperienceLevel : "",
    avatar: picture ? { dataUrl: picture, mimeType: "image/url", size: 0, updatedAt: new Date() } : {},
    skills: []
  });

  triggerWelcomeEmail(user);

  return res.status(201).json({ token: generateToken(user._id), user: sanitizeUser(user) });
});
