import { Router } from "express";
import {
  getCreditBalance,
  getCreditPlans,
  purchaseCredits,
  getTransactions
} from "../controllers/creditController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/balance", protect, authorize("recruiter"), getCreditBalance);
router.get("/plans", protect, authorize("recruiter"), getCreditPlans);
router.post("/purchase", protect, authorize("recruiter"), purchaseCredits);
router.get("/transactions", protect, authorize("recruiter"), getTransactions);

export default router;
