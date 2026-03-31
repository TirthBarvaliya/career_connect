import { Router } from "express";
import { getRoadmapSelection, updateRoadmapSelection } from "../controllers/techRoadmapController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/selection", protect, getRoadmapSelection);
router.put("/selection", protect, updateRoadmapSelection);

export default router;
