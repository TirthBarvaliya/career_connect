import { Router } from "express";
import { getTechStacks } from "../controllers/techRoadmapController.js";

const router = Router();

router.get("/", getTechStacks);

export default router;
