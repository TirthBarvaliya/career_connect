import { Router } from "express";
import { getMe, googleLogin, googleRegister, login, register } from "../controllers/authController.js";
import { forgotPassword, verifyOtp, resetPassword } from "../controllers/passwordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/google-register", googleRegister);
router.get("/me", protect, getMe);

// Password reset (public — no auth required)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
