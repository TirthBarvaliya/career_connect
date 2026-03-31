import { Router } from "express";
import { startInterview, evaluateAnswer, generateFeedback } from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Both routes are protected; require a valid user token
router.post("/start", protect, startInterview);
router.post("/evaluate", protect, evaluateAnswer);
router.post("/feedback", protect, generateFeedback);

export default router;
