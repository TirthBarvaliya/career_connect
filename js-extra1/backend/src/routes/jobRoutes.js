import { Router } from "express";
import {
  applyToJob,
  createJob,
  deleteJob,
  getApplicationDetails,
  getApplicantsForJob,
  getJobById,
  getRecruiterJobs,
  listJobs,
  withdrawApplicationByJob,
  updateApplicationStatus,
  sendApplicationEmail,
  updateJob,
  scheduleInterview
} from "../controllers/jobController.js";
import { authorize, optionalProtect, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", optionalProtect, listJobs);
router.get("/recruiter/mine", protect, authorize("recruiter"), getRecruiterJobs);
router.get("/:jobId", getJobById);

router.post("/", protect, authorize("recruiter"), createJob);
router.put("/:jobId", protect, authorize("recruiter"), updateJob);
router.delete("/:jobId", protect, authorize("recruiter"), deleteJob);
router.post("/:jobId/apply", protect, authorize("jobseeker", "student"), applyToJob);
router.delete("/:jobId/apply", protect, authorize("jobseeker", "student"), withdrawApplicationByJob);
router.get("/:jobId/applicants", protect, authorize("recruiter"), getApplicantsForJob);
router.get("/applications/:applicationId", protect, authorize("recruiter"), getApplicationDetails);
router.patch("/applications/:applicationId/status", protect, authorize("recruiter"), updateApplicationStatus);
router.post("/applications/:applicationId/send-email", protect, authorize("recruiter"), sendApplicationEmail);
router.put("/applications/:applicationId/interview", protect, authorize("recruiter"), scheduleInterview);

export default router;
