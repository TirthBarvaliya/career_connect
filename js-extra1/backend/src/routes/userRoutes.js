import { Router } from "express";
import { authorize, protect } from "../middleware/authMiddleware.js";
import {
  getAppliedJobs,
  getProfile,
  getSavedJobs,
  saveJob,
  unsaveJob,
  updateProfile,
  updateResumeBuilder,
  getAISuggestions
} from "../controllers/userController.js";

const router = Router();

router.use(protect);

router.get("/profile", authorize("jobseeker", "student"), getProfile);
router.put("/profile", authorize("jobseeker", "student"), updateProfile);
router.put("/resume-builder", authorize("jobseeker", "student"), updateResumeBuilder);
router.get("/saved-jobs", authorize("jobseeker", "student"), getSavedJobs);
router.post("/saved-jobs/:jobId", authorize("jobseeker", "student"), saveJob);
router.delete("/saved-jobs/:jobId", authorize("jobseeker", "student"), unsaveJob);
router.get("/applied-jobs", authorize("jobseeker", "student"), getAppliedJobs);
router.get("/ai-suggestions", authorize("jobseeker", "student"), getAISuggestions);

export default router;
