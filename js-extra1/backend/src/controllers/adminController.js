import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { normalizeRole, ROLE_RECRUITER, ROLE_JOBSEEKER, ROLE_ADMIN } from "../utils/roles.js";

// ── GET /admin/stats ──
export const getAdminStats = asyncHandler(async (_req, res) => {
  const [totalUsers, totalRecruiters, totalJobs, totalApplications, blockedUsers, flaggedJobs] =
    await Promise.all([
      User.countDocuments({ role: { $ne: ROLE_ADMIN } }),
      User.countDocuments({ role: ROLE_RECRUITER }),
      Job.countDocuments(),
      Application.countDocuments(),
      User.countDocuments({ status: "blocked" }),
      Job.countDocuments({ status: "flagged" })
    ]);

  return res.status(200).json({
    totalUsers,
    totalRecruiters,
    totalJobs,
    totalApplications,
    blockedUsers,
    flaggedJobs
  });
});

// ── GET /admin/users ──
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "", role: filterRole = "" } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const query = { role: { $ne: ROLE_ADMIN } };
  if (filterRole && [ROLE_JOBSEEKER, ROLE_RECRUITER].includes(filterRole)) {
    query.role = filterRole;
  }
  if (search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("name email role status companyName createdAt")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);

  const sanitized = users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: normalizeRole(u.role),
    status: u.status || "active",
    companyName: u.companyName || "",
    createdAt: u.createdAt
  }));

  return res.status(200).json({
    users: sanitized,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  });
});

// ── PATCH /admin/users/:id/block ──
export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found."); }
  if (normalizeRole(user.role) === ROLE_ADMIN) { res.status(403); throw new Error("Cannot block another admin."); }

  user.status = "blocked";
  await user.save();
  return res.status(200).json({ message: `User "${user.name}" has been blocked.` });
});

// ── PATCH /admin/users/:id/unblock ──
export const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found."); }

  user.status = "active";
  await user.save();
  return res.status(200).json({ message: `User "${user.name}" has been unblocked.` });
});

// ── DELETE /admin/users/:id ──
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found."); }
  if (normalizeRole(user.role) === ROLE_ADMIN) { res.status(403); throw new Error("Cannot delete another admin."); }

  // Clean up associated data
  const userJobs = await Job.find({ recruiter: user._id }).select("_id").lean();
  const jobIds = userJobs.map((j) => j._id);

  await Promise.all([
    Application.deleteMany({ $or: [{ student: user._id }, { job: { $in: jobIds } }] }),
    Job.deleteMany({ recruiter: user._id }),
    User.findByIdAndDelete(user._id)
  ]);

  return res.status(200).json({ message: `User "${user.name}" and associated data deleted.` });
});

// ── GET /admin/jobs ──
export const getJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "", status: filterStatus = "" } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const query = {};
  if (filterStatus && ["active", "closed", "flagged", "removed"].includes(filterStatus)) {
    query.status = filterStatus;
  }
  if (search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ title: regex }, { company: regex }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .select("title company location status type createdAt recruiter")
      .populate("recruiter", "name email companyName")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Job.countDocuments(query)
  ]);

  const sanitized = jobs.map((j) => ({
    id: String(j._id),
    title: j.title,
    company: j.company,
    location: j.location,
    status: j.status,
    type: j.type,
    recruiterName: j.recruiter?.name || "Unknown",
    recruiterEmail: j.recruiter?.email || "",
    createdAt: j.createdAt
  }));

  return res.status(200).json({
    jobs: sanitized,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  });
});

// ── DELETE /admin/jobs/:id ──
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error("Job not found."); }

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    Job.findByIdAndDelete(job._id)
  ]);

  return res.status(200).json({ message: `Job "${job.title}" and its applications deleted.` });
});

// ── PATCH /admin/jobs/:id/flag ──
export const flagJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { res.status(404); throw new Error("Job not found."); }

  job.status = job.status === "flagged" ? "active" : "flagged";
  await job.save();
  return res.status(200).json({
    message: job.status === "flagged" ? `Job "${job.title}" flagged.` : `Job "${job.title}" unflagged.`,
    status: job.status
  });
});
