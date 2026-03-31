import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import RoadmapProgress from "../models/RoadmapProgress.js";
import calculateProfileCompletion from "../utils/profileCompletion.js";
import { mapJobForClient } from "../utils/jobFormatter.js";
import calculateMatch from "../utils/calculateMatch.js";

const ROADMAP_DISPLAY_ORDER = ["frontend", "backend", "mern", "ai-ml", "devops", "product-design"];

const skillGraphFromUser = (skills = []) => {
  if (!skills.length) {
    return [
      { skill: "React", value: 55 },
      { skill: "Node", value: 49 },
      { skill: "MongoDB", value: 45 },
      { skill: "Testing", value: 42 },
      { skill: "System Design", value: 38 }
    ];
  }
  return skills.slice(0, 6).map((skill, index) => ({
    skill,
    value: Math.min(95, 45 + index * 7 + 8)
  }));
};

const toRoadmapEntry = (row) => ({
  pathKey: String(row.pathKey || "").trim(),
  pathTitle: String(row.pathTitle || "").trim() || "Roadmap",
  completion: Math.max(0, Math.min(100, Math.round(Number(row.completion || 0)))),
  updatedAt: row.updatedAt || null
});

const sortRoadmapEntries = (items = [], selectedPathKey = "") => {
  const orderMap = new Map(ROADMAP_DISPLAY_ORDER.map((value, index) => [value, index]));
  const safeSelected = String(selectedPathKey || "").trim();

  return [...items].sort((a, b) => {
    if (safeSelected) {
      if (a.pathKey === safeSelected && b.pathKey !== safeSelected) return -1;
      if (b.pathKey === safeSelected && a.pathKey !== safeSelected) return 1;
    }
    const ai = orderMap.has(a.pathKey) ? orderMap.get(a.pathKey) : Number.MAX_SAFE_INTEGER;
    const bi = orderMap.has(b.pathKey) ? orderMap.get(b.pathKey) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.pathTitle.localeCompare(b.pathTitle);
  });
};

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // Build job filter with experience-level visibility rules
  const jobFilter = { status: "active" };
  if (user.experienceLevel) {
    jobFilter.experienceRequired = { $in: [user.experienceLevel, "both"] };
  }

  const [appliedCount, roadmapDocs, jobs] = await Promise.all([
    Application.countDocuments({ student: user._id }),
    RoadmapProgress.find({ user: user._id }),
    Job.find(jobFilter).sort({ createdAt: -1 }).limit(15)
  ]);

  const profileCompletion = calculateProfileCompletion(user);
  const roadmapEntries = roadmapDocs.map(toRoadmapEntry);
  const selectedPathKey = String(user?.roadmapSelection?.techStackSlug || "").trim();
  const selectedPathTitle = String(user?.roadmapSelection?.techStackTitle || "").trim();
  const selectedPathRow = roadmapEntries.find((entry) => entry.pathKey === selectedPathKey);
  const averageRoadmapProgress = roadmapDocs.length
    ? Math.round(
        roadmapDocs.reduce((sum, item) => sum + item.completion, 0) / roadmapDocs.length
      )
    : 0;
  const roadmapProgress = selectedPathRow
    ? selectedPathRow.completion
    : averageRoadmapProgress;

  if (selectedPathKey && !selectedPathRow) {
    roadmapEntries.unshift({
      pathKey: selectedPathKey,
      pathTitle: selectedPathTitle || selectedPathKey.toUpperCase(),
      completion: 0,
      updatedAt: null
    });
  }
  const sortedRoadmapEntries = sortRoadmapEntries(roadmapEntries, selectedPathKey);

  const recommendedJobs = jobs
    .map((job) => {
      const relevance = calculateMatch(job, user);
      return { ...mapJobForClient(job), relevance };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8);

  return res.status(200).json({
    stats: {
      profileCompletion,
      recommendedJobs: recommendedJobs.length,
      savedJobs: user.savedJobs?.length || 0,
      appliedJobs: appliedCount,
      roadmapProgress
    },
    roadmap: {
      selectedPathKey,
      selectedPathTitle: selectedPathTitle || selectedPathRow?.pathTitle || "",
      selectedPathProgress: selectedPathRow?.completion ?? 0,
      averageProgress: averageRoadmapProgress,
      paths: sortedRoadmapEntries
    },
    skillsGraph: skillGraphFromUser(user.skills),
    recommended: recommendedJobs
  });
});

export const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
  const jobIds = jobs.map((job) => job._id);

  const applications = await Application.find({ job: { $in: jobIds } })
    .populate("student", "name email skills headline resumeUrl")
    .populate("job", "title _id")
    .lean();

  const activeListings = jobs.filter((job) => job.status === "active").length;
  const interviewsScheduled = applications.filter((application) => {
    const s = application.extendedStatus || application.status;
    return ["Interviewing", "Interview Scheduled", "Interview Completed"].includes(s);
  }).length;
  const acceptedOffers = applications.filter((application) => {
    const s = application.extendedStatus || application.status;
    return ["Accepted", "Hired", "Selected", "Offer Sent"].includes(s);
  }).length;
  const reviewedCount = applications.filter((application) => {
    const s = application.extendedStatus || application.status;
    return ["Review", "Shortlisted", "Interviewing", "Interview Scheduled", "Interview Completed", "Accepted", "Selected", "Offer Sent", "Hired"].includes(s);
  }).length;
  const offerAcceptance = reviewedCount ? Math.round((acceptedOffers / reviewedCount) * 100) : 0;

  const applicationsPerJobMap = new Map();
  const applicationCountByJobId = new Map();
  for (const application of applications) {
    const title = application.job?.title || "Unknown";
    applicationsPerJobMap.set(title, (applicationsPerJobMap.get(title) || 0) + 1);
    const jobId = application.job?._id ? String(application.job._id) : "";
    if (jobId) {
      applicationCountByJobId.set(jobId, (applicationCountByJobId.get(jobId) || 0) + 1);
    }
  }

  const applicants = applications
    .map((application) => ({
      id: String(application._id),
      name: application.student?.name || "Unknown",
      email: application.student?.email || "",
      role: application.job?.title || "Unknown",
      jobId: application.job?._id ? String(application.job._id) : "",
      score: application.matchScore,
      status: application.extendedStatus || application.status,
      appliedAt: application.createdAt,
      skills: application.student?.skills || [],
      headline: application.student?.headline || "",
      resumeUrl: application.resumeUrl || application.student?.resumeUrl || "",
      decisionMessage: application.decisionMessage || "",
      emailSent: application.emailSent || false,
      interview: application.interview || null
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);

  const listings = jobs.map((job) => {
    const mapped = mapJobForClient(job);
    return {
      ...mapped,
      applicantsCount: applicationCountByJobId.get(String(job._id)) || 0
    };
  });

  return res.status(200).json({
    kpis: [
      { label: "Active Listings", value: activeListings, delta: "+0%" },
      { label: "Total Applicants", value: applications.length, delta: "+0%" },
      { label: "Interviews Scheduled", value: interviewsScheduled, delta: "+0%" },
      { label: "Offer Acceptance", value: offerAcceptance, delta: "+0%" }
    ],
    applicationsPerJob: Array.from(applicationsPerJobMap.entries()).map(([job, applicantsCount]) => ({
      job,
      applicants: applicantsCount
    })),
    applicants,
    listings
  });
});
