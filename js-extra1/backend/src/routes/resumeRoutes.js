import { Router } from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { listThemes, renderThemePreview, exportPdf } from "../controllers/resumeController.js";
import { atsCheck } from "../controllers/atsCheckerController.js";

const router = Router();

// All routes require authentication as a jobseeker
router.get("/themes", protect, authorize("jobseeker"), listThemes);
router.post("/render", protect, authorize("jobseeker"), renderThemePreview);
router.post("/export-pdf", protect, authorize("jobseeker"), exportPdf);
router.post("/ats-check", protect, authorize("jobseeker"), atsCheck);

export default router;
