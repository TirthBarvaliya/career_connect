import { Router } from "express";
import {
  getPublicRoadmapSnapshot,
  getRoadmapPaths,
  getUserRoadmapProgress,
  updateRoadmapProgress
} from "../controllers/roadmapController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/paths", getRoadmapPaths);
router.get("/snapshot", getPublicRoadmapSnapshot);
router.get("/progress", protect, getUserRoadmapProgress);
router.put("/progress/:pathKey", protect, updateRoadmapProgress);

export default router;
