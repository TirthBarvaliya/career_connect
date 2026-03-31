import { Router } from "express";
import { getCareerTrends } from "../controllers/careerTrendsController.js";

const router = Router();

// Public endpoint — no auth required (landing page)
router.get("/career-trends", getCareerTrends);

export default router;
