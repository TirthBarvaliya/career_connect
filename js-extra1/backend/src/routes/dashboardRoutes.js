import { Router } from "express";
import { getRecruiterDashboard, getStudentDashboard } from "../controllers/dashboardController.js";
import { getTechInsights } from "../controllers/techPulseController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/student", protect, authorize("jobseeker", "student"), getStudentDashboard);
router.get("/jobseeker", protect, authorize("jobseeker", "student"), getStudentDashboard);
router.get("/recruiter", protect, authorize("recruiter"), getRecruiterDashboard);
router.get("/tech-insights", protect, authorize("jobseeker", "student"), getTechInsights);

export default router;
