import { Router } from "express";
import { getRecruiterApplicantById, getRecruiterApplications } from "../controllers/recruiterController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("recruiter"));
router.get("/applications", getRecruiterApplications);
router.get("/applicant/:id", getRecruiterApplicantById);

export default router;
