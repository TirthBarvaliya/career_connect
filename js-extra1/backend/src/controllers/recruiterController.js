import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const readApplicationStatus = (application) => application?.extendedStatus || application?.status || "Applied";

const readResumePayload = (application, student) => {
  const applicationResume = String(application?.resumeUrl || "").trim();
  const profileDocumentResume = String(student?.resumeDocument?.dataUrl || "").trim();
  const profileResume = String(student?.resumeUrl || "").trim();
  return applicationResume || profileDocumentResume || profileResume;
};

export const getRecruiterApplications = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user._id })
    .select("_id title company location")
    .sort({ createdAt: -1 })
    .lean();

  if (!jobs.length) {
    return res.status(200).json({
      summary: {
        totalApplicants: 0,
        totalJobs: 0
      },
      jobs: [],
      applicants: []
    });
  }

  const jobIds = jobs.map((job) => job._id);
  const applications = await Application.find({ job: { $in: jobIds } })
    .populate("student", "name email")
    .populate("job", "title company location")
    .sort({ createdAt: -1 })
    .lean();

  const countByJobId = new Map();
  const latestAppliedAtByJobId = new Map();
  applications.forEach((application) => {
    const jobId = application?.job?._id ? String(application.job._id) : "";
    if (!jobId) return;
    countByJobId.set(jobId, (countByJobId.get(jobId) || 0) + 1);

    const appliedAtMillis = application.createdAt ? new Date(application.createdAt).getTime() : 0;
    const previous = latestAppliedAtByJobId.get(jobId) || 0;
    if (appliedAtMillis > previous) {
      latestAppliedAtByJobId.set(jobId, appliedAtMillis);
    }
  });

  const jobsWithCounts = jobs
    .map((job) => {
      const id = String(job._id);
      const latestAppliedAtMillis = latestAppliedAtByJobId.get(id) || 0;
      return {
        id,
        title: job.title || "Untitled Role",
        company: job.company || "",
        location: job.location || "",
        applicantsCount: countByJobId.get(id) || 0,
        latestAppliedAt: latestAppliedAtMillis ? new Date(latestAppliedAtMillis).toISOString() : null
      };
    })
    .sort((a, b) => {
      if (b.applicantsCount !== a.applicantsCount) return b.applicantsCount - a.applicantsCount;
      return new Date(b.latestAppliedAt || 0).getTime() - new Date(a.latestAppliedAt || 0).getTime();
    });

  const applicants = applications.map((application) => ({
    id: String(application._id),
    name: application?.student?.name || "Unknown",
    email: application?.student?.email || "",
    appliedJob: application?.job?.title || "Unknown",
    jobId: application?.job?._id ? String(application.job._id) : "",
    appliedAt: application.createdAt,
    status: readApplicationStatus(application)
  }));

  return res.status(200).json({
    summary: {
      totalApplicants: applicants.length,
      totalJobs: jobs.length
    },
    jobs: jobsWithCounts,
    applicants
  });
});

export const getRecruiterApplicantById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid applicant id.");
  }

  const application = await Application.findById(id)
    .populate("job", "title company location type salary salaryMax recruiter")
    .populate(
      "student",
      "name email location headline bio skills education experience resumeUrl resumeDocument resumeBuilder socialLinks"
    )
    .lean();

  if (!application) {
    res.status(404);
    throw new Error("Applicant not found.");
  }

  if (!application.job || String(application.job.recruiter) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to view this applicant.");
  }

  const candidate = application.student || {};
  const resumeUrl = readResumePayload(application, candidate);
  const fallbackFileName = `${String(candidate.name || "candidate").trim().replace(/\s+/g, "_")}_resume.pdf`;

  return res.status(200).json({
    application: {
      id: String(application._id),
      status: readApplicationStatus(application),
      appliedAt: application.createdAt,
      message: application.message || "",
      decisionMessage: application.decisionMessage || "",
      job: {
        id: String(application.job._id),
        title: application.job.title || "Untitled Role",
        company: application.job.company || "",
        location: application.job.location || "",
        type: application.job.type || "",
        salary: Number(application.job.salary || 0),
        salaryMax: Number(application.job.salaryMax || 0)
      },
      candidate: {
        id: candidate?._id ? String(candidate._id) : "",
        name: candidate.name || "Unknown",
        email: candidate.email || "",
        phone: candidate?.resumeBuilder?.phone || "",
        location: candidate.location || "",
        headline: candidate.headline || "",
        bio: candidate.bio || "",
        skills: candidate.skills || [],
        education: candidate.education || [],
        experience: candidate.experience || [],
        socialLinks: candidate.socialLinks || {
          linkedin: "",
          github: "",
          instagram: "",
          portfolio: ""
        },
        resumeUrl,
        resumeDocument: {
          fileName: candidate?.resumeDocument?.fileName || fallbackFileName,
          mimeType: candidate?.resumeDocument?.mimeType || "",
          size: Number(candidate?.resumeDocument?.size || 0),
          uploadedAt: candidate?.resumeDocument?.uploadedAt || null
        }
      }
    }
  });
});
