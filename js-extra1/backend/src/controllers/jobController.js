import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import Transaction from "../models/Transaction.js";
import { mapJobForClient } from "../utils/jobFormatter.js";
import calculateMatch from "../utils/calculateMatch.js";
import sendDecisionEmail, { sendInterviewEmail } from "../utils/sendMail.js";
import { FREE_POST_LIMIT } from "./creditController.js";

const WITHDRAWABLE_APPLICATION_STATUSES = new Set(["Applied", "Review", "Shortlisted", "Interviewing"]);
const FINAL_DECISION_STATUSES = new Set(["Accepted", "Rejected"]);
const RECRUITER_ALLOWED_STATUSES = new Set([
  "Review",
  "Shortlisted",
  "Interviewing",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Sent",
  "Hired",
  "Selected",
  "Rejected",
  "Accepted"
]);

const buildFilter = (query, user = null) => {
  const filter = { status: "active" };
  if (query.location) {
    filter.location = { $regex: query.location, $options: "i" };
  }
  if (query.type) {
    filter.type = query.type;
  }
  if (query.remoteOnly === "true") {
    filter.remote = true;
  }
  if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
    const filterMin = query.salaryMin !== undefined ? Number(query.salaryMin) : null;
    const filterMax = query.salaryMax !== undefined ? Number(query.salaryMax) : null;
    if (filterMax !== null) {
      filter.salary = { ...(filter.salary || {}), $lte: filterMax };
    }
    if (filterMin !== null) {
      filter.$expr = {
        $gte: [
          { $cond: [{ $gt: ["$salaryMax", 0] }, "$salaryMax", "$salary"] },
          filterMin
        ]
      };
    }
  }

  // Experience-level visibility filter
  // Recruiters see all jobs; jobseekers see only jobs matching their experienceLevel
  if (user && user.role !== "recruiter" && user.experienceLevel) {
    // User is fresher → see fresher + both; user is experienced → see experienced + both
    filter.experienceRequired = { $in: [user.experienceLevel, "both"] };
  }

  return filter;
};

const addRelevance = (job, q, userSkills = []) => {
  const text = `${job.title} ${job.company} ${(job.tags || []).join(" ")}`.toLowerCase();
  const queryToken = q?.toLowerCase().trim();
  let score = 75;
  if (queryToken) {
    if (text.includes(queryToken)) score += 12;
    const words = queryToken.split(/\s+/).filter(Boolean);
    const matchedWords = words.filter((word) => text.includes(word));
    score += Math.min(8, matchedWords.length * 3);
  }

  const skillMatches = (job.tags || []).filter((tag) =>
    userSkills.map((skill) => skill.toLowerCase()).includes(tag.toLowerCase())
  ).length;
  score += Math.min(12, skillMatches * 4);

  return Math.min(99, score);
};

export const listJobs = asyncHandler(async (req, res) => {
  const { q = "", sortBy = "relevance", page = 1, limit = 12 } = req.query;
  const filter = buildFilter(req.query, req.user);

  if (q) {
    filter.$text = { $search: q };
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  let sort = { createdAt: -1 };
  if (sortBy === "salaryHigh") sort = { salary: -1 };
  if (sortBy === "salaryLow") sort = { salary: 1 };
  if (sortBy === "recent") sort = { createdAt: -1 };

  const [items, total] = await Promise.all([
    Job.find(filter).sort(sort).skip(skip).limit(limitNum),
    Job.countDocuments(filter)
  ]);

  const userSkills = req.user?.skills || [];
  let jobs = items.map((item) => {
    const base = mapJobForClient(item);
    return { ...base, relevance: addRelevance(base, q, userSkills) };
  });

  if (sortBy === "relevance") {
    jobs = jobs.sort((a, b) => b.relevance - a.relevance);
  }

  return res.status(200).json({
    jobs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).populate("recruiter", "name email companyName");
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  return res.status(200).json({ job: mapJobForClient(job) });
});

export const createJob = asyncHandler(async (req, res) => {
  const { title, company, location, salary, type, remote, level, tags, experienceRequired, minExperience, maxExperience } = req.body;

  if (!title || !company || !location || !salary) {
    res.status(400);
    throw new Error("Title, company, location, and salary are required.");
  }

  // ── Credit check ────────────────────────────────────────────────────────
  const recruiter = await User.findById(req.user._id);
  const freePostsUsed = recruiter.freePostsUsed || 0;
  const credits = recruiter.credits || 0;
  let usedFreePost = false;

  if (freePostsUsed < FREE_POST_LIMIT) {
    // Still have free posts available
    usedFreePost = true;
  } else if (credits <= 0) {
    res.status(403);
    throw new Error("Insufficient credits. Please purchase credits to post more jobs.");
  }
  // ─────────────────────────────────────────────────────────────────────────

  const parsedTags =
    Array.isArray(tags) && tags.length
      ? tags
      : typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

  const jobData = {
    title,
    company,
    location,
    salary: Number(salary),
    salaryMax: req.body.salaryMax ? Number(req.body.salaryMax) : 0,
    type: type || "Full-time",
    remote: Boolean(remote),
    level: level || "Mid",
    tags: parsedTags,
    experienceRequired: experienceRequired || "both",
    recruiter: req.user._id
  };

  if (experienceRequired === "experienced") {
    jobData.minExperience = minExperience ? Number(minExperience) : 0;
    jobData.maxExperience = maxExperience ? Number(maxExperience) : 0;
  }

  const job = await Job.create(jobData);

  // ── Deduct credit or increment free post count ──────────────────────────
  if (usedFreePost) {
    recruiter.freePostsUsed = freePostsUsed + 1;
    await recruiter.save();
  } else {
    recruiter.credits = credits - 1;
    await recruiter.save();

    await Transaction.create({
      user: req.user._id,
      type: "credit_usage",
      amount: 1,
      description: `Posted job: ${title}`
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  return res.status(201).json({
    message: usedFreePost
      ? `Job created (free post ${freePostsUsed + 1}/${FREE_POST_LIMIT} used)`
      : "Job created (1 credit used)",
    job: mapJobForClient(job),
    creditsRemaining: usedFreePost ? credits : credits - 1,
    freePostsRemaining: usedFreePost ? FREE_POST_LIMIT - freePostsUsed - 1 : 0
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  if (String(job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only update your own job listings.");
  }

  const allowedUpdates = ["title", "company", "location", "salary", "salaryMax", "type", "remote", "level", "tags", "status", "experienceRequired", "minExperience", "maxExperience"];
  for (const [key, value] of Object.entries(req.body)) {
    if (allowedUpdates.includes(key)) {
      job[key] = (key === "salary" || key === "salaryMax") ? Number(value) : value;
    }
  }

  await job.save();
  return res.status(200).json({ message: "Job updated", job: mapJobForClient(job) });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  if (String(job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete your own job listings.");
  }

  await Application.deleteMany({ job: job._id });
  await Job.deleteOne({ _id: job._id });

  return res.status(200).json({ message: "Job deleted." });
});

export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { message = "" } = req.body;

  const job = await Job.findById(jobId);
  if (!job || job.status !== "active") {
    res.status(404);
    throw new Error("Active job not found.");
  }

  const user = await User.findById(req.user._id);
  const matchScore = calculateMatch(job, user);

  const existing = await Application.findOne({ job: job._id, student: req.user._id });
  if (existing && existing.status !== "Withdrawn") {
    res.status(409);
    throw new Error("You already applied to this job.");
  }

  if (existing && existing.status === "Withdrawn") {
    existing.status = "Applied";
    existing.message = typeof message === "string" ? message : "";
    existing.resumeUrl = user.resumeDocument?.dataUrl || user.resumeUrl || "";
    existing.matchScore = matchScore;
    await existing.save();

    return res.status(200).json({
      message: "Application re-submitted",
      application: {
        id: String(existing._id),
        status: existing.status,
        matchScore: existing.matchScore
      }
    });
  }

  const application = await Application.create({
    job: job._id,
    student: user._id,
    message,
    resumeUrl: user.resumeDocument?.dataUrl || user.resumeUrl || "",
    matchScore
  });

  return res.status(201).json({
    message: "Application submitted",
    application: {
      id: String(application._id),
      status: application.status,
      matchScore: application.matchScore
    }
  });
});

export const withdrawApplicationByJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    res.status(400);
    throw new Error("Invalid job id.");
  }

  const application = await Application.findOne({ job: jobId, student: req.user._id });
  if (!application) {
    res.status(404);
    throw new Error("No application found for this job.");
  }

  if (application.status === "Withdrawn") {
    res.status(409);
    throw new Error("Application is already withdrawn.");
  }

  if (!WITHDRAWABLE_APPLICATION_STATUSES.has(application.status)) {
    res.status(400);
    throw new Error(`Cannot withdraw an application with status "${application.status}".`);
  }

  application.status = "Withdrawn";
  await application.save();

  return res.status(200).json({
    message: "Application withdrawn successfully.",
    application: {
      id: String(application._id),
      status: application.status
    }
  });
});

export const getApplicantsForJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { q = "" } = req.query;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    res.status(400);
    throw new Error("Invalid job id.");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  if (String(job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only view applicants for your own listings.");
  }

  const applications = await Application.find({ job: job._id })
    .populate("student", "name email skills headline resumeUrl")
    .sort({ createdAt: -1 })
    .lean();

  const needle = q.toLowerCase();
  const applicants = applications
    .filter((application) => {
      if (!needle) return true;
      const student = application.student;
      const text = `${student?.name || ""} ${student?.email || ""} ${(student?.skills || []).join(" ")}`.toLowerCase();
      return text.includes(needle);
    })
    .map((application) => ({
      id: String(application._id),
      name: application.student?.name || "Unknown",
      email: application.student?.email || "",
      role: job.title || "Unknown",
      jobId: String(job._id),
      score: application.matchScore,
      status: application.extendedStatus || application.status,
      appliedAt: application.createdAt,
      skills: application.student?.skills || [],
      headline: application.student?.headline || "",
      resumeUrl: application.resumeUrl || application.student?.resumeUrl || "",
      emailSent: application.emailSent || false,
      decisionMessage: application.decisionMessage || "",
      interview: application.interview || null
    }));

  return res.status(200).json({ job: { id: String(job._id), title: job.title }, applicants });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  if (!RECRUITER_ALLOWED_STATUSES.has(status)) {
    res.status(400);
    throw new Error("Invalid status.");
  }

  const application = await Application.findById(applicationId).populate("job");
  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  if (application.status === "Withdrawn") {
    res.status(400);
    throw new Error("Withdrawn applications cannot be updated.");
  }
  if (String(application.job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to update this application.");
  }

  const previousExtendedStatus = application.extendedStatus;
  const previousBaseStatus = application.status;
  
  // If no extendedStatus exists, and baseStatus is Accepted, but we are moving to Hired, let it pass.
  // Because older DB entries might have status='Accepted' without extendedStatus='Offer Sent'.
  const previousStatus = previousExtendedStatus || previousBaseStatus;
  
  if (previousStatus === status) {
    return res.status(200).json({
      message: "Application status unchanged.",
      status
    });
  }

  const finalStatuses = new Set(["Selected", "Hired", "Rejected", "Accepted"]);
  // If the DB only has "Accepted" and no extended status, allow transitioning to "Hired" or "Rejected"
  // just in case they were stuck in an old "Offer Sent" visually but "Accepted" in DB.
  if (finalStatuses.has(previousStatus) && status !== "Review") {
    if (previousStatus === "Accepted" && (status === "Hired" || status === "Rejected")) {
        // Allow migrating legacy 'Accepted' to explicit 'Hired' or 'Rejected'
    } else {
        res.status(400);
        throw new Error("Final decisions are locked. Use Withdraw Decision to move back to Review.");
    }
  }

  const { decisionMessage } = req.body;
  let baseStatus = status;
  // Map extended UI statuses backwards to strict mongoose enums
  if (["Selected", "Offer Sent", "Hired"].includes(status)) baseStatus = "Accepted";
  if (["Interview Scheduled", "Interview Completed"].includes(status)) baseStatus = "Shortlisted";

  application.emailSent = false;
  if (typeof decisionMessage === "string") {
    application.decisionMessage = decisionMessage.trim();
  }
  
  // Save using updateOne to bypass schema strictness for extendedStatus
  await Application.updateOne(
    { _id: application._id },
    {
      $set: {
        status: baseStatus,
        extendedStatus: status,
        emailSent: false,
        decisionMessage: typeof decisionMessage === "string" ? decisionMessage.trim() : application.decisionMessage
      }
    },
    { strict: false }
  );

  const actionMessage =
    finalStatuses.has(previousStatus) && status === "Review"
      ? "Decision withdrawn. Application moved back to Review."
      : "Application status updated";

  return res.status(200).json({ message: actionMessage, status });
});

export const scheduleInterview = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { date, mode, meetingLink, notes, sendEmail } = req.body;

  if (!date || !mode) {
    res.status(400);
    throw new Error("Date and mode are required for scheduling an interview.");
  }

  const application = await Application.findById(applicationId)
    .populate("job")
    .populate("student", "name email");

  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  if (String(application.job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to update this application.");
  }

  const interviewData = {
    date,
    mode,
    meetingLink: meetingLink || "",
    notes: notes || ""
  };

  await Application.updateOne(
    { _id: application._id },
    {
      $set: {
        status: "Shortlisted",
        extendedStatus: "Interview Scheduled",
        interview: interviewData
      }
    },
    { strict: false }
  );

  let emailSentStatus = false;
  if (sendEmail) {
    emailSentStatus = await sendInterviewEmail({
      to: application.student.email,
      candidateName: application.student.name,
      jobTitle: application.job.title,
      interviewData
    });
  }

  return res.status(200).json({
    message: emailSentStatus ? "Interview scheduled and email sent." : "Interview scheduled successfully.",
    status: "Interview Scheduled",
    interview: interviewData,
    emailSent: emailSentStatus
  });
});

export const sendApplicationEmail = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { decisionMessage } = req.body;

  const application = await Application.findById(applicationId)
    .populate("job", "title recruiter")
    .populate("student", "name email");

  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  if (String(application.job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized.");
  }
  if (!FINAL_DECISION_STATUSES.has(application.status)) {
    res.status(400);
    throw new Error("Email can only be sent for Accepted or Rejected applications.");
  }

  if (typeof decisionMessage === "string" && decisionMessage.trim()) {
    application.decisionMessage = decisionMessage.trim();
  }

  const sent = await sendDecisionEmail({
    to: application.student.email,
    candidateName: application.student.name,
    jobTitle: application.job.title,
    status: application.status,
    message: application.decisionMessage
  });

  application.emailSent = sent;
  await application.save();

  if (sent) {
    return res.status(200).json({ message: "Decision email sent successfully." });
  }
  res.status(500);
  throw new Error("Failed to send email. Check server email configuration.");
});

export const getRecruiterJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json({ jobs: jobs.map(mapJobForClient) });
});

export const getApplicationDetails = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400);
    throw new Error("Invalid application id.");
  }

  const application = await Application.findById(applicationId)
    .populate("job")
    .populate(
      "student",
      "name email location headline bio skills resumeUrl resumeDocument avatar socialLinks experience education companyName"
    )
    .lean();

  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  if (!application.job || String(application.job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to view this application.");
  }

  const student = application.student || {};
  const job = application.job || {};

  return res.status(200).json({
    application: {
      id: String(application._id),
      status: application.status,
      message: application.message || "",
      matchScore: application.matchScore,
      decisionMessage: application.decisionMessage || "",
      emailSent: application.emailSent || false,
      interview: application.interview || null,
      appliedAt: application.createdAt,
      resumeUrl: application.resumeUrl || student.resumeUrl || "",
      job: {
        id: String(job._id),
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        salaryMax: job.salaryMax || 0
      },
      candidate: {
        id: String(student._id || ""),
        name: student.name || "Unknown",
        email: student.email || "",
        location: student.location || "",
        headline: student.headline || "",
        bio: student.bio || "",
        avatar: student.avatar || { dataUrl: "", mimeType: "", size: 0, updatedAt: null },
        socialLinks: student.socialLinks || {
          linkedin: "",
          github: "",
          instagram: "",
          portfolio: ""
        },
        skills: student.skills || [],
        resumeUrl: student.resumeDocument?.dataUrl || student.resumeUrl || "",
        resumeDocument: student.resumeDocument || {
          fileName: "",
          dataUrl: "",
          mimeType: "",
          size: 0,
          source: "profile",
          uploadedAt: null
        },
        experience: student.experience || [],
        education: student.education || []
      }
    }
  });
});
