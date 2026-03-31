import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import config from "../config/env.js";
import { isMailConfigured, mailFromAddress, mailTransporter } from "../utils/mailer.js";

/* ── Constants ── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;
const OTP_EXPIRY_MINUTES = 2;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY = "10m";

/* ── Generate 6-digit OTP ── */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/* ── OTP Email HTML Template ── */
const buildOtpEmailHtml = (otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">🔐 Password Reset OTP</h1>
          <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">Career Connect Account Security</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            We received a request to reset your password. Use the OTP below to verify your identity:
          </p>
          <div style="background:#f0f9ff;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#4f46e5;letter-spacing:8px;font-family:monospace;">${otp}</p>
          </div>
          <div style="background:#fefce8;border-left:4px solid #eab308;padding:12px 16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;color:#854d0e;font-size:13px;line-height:1.5;">
              ⏱ This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong> only.<br>
              If you did not request this, please ignore this email.
            </p>
          </div>
          <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Best regards,<br><strong style="color:#334155;">Career Connect Team</strong></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated email from Career Connect. Please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* ═══════════════════════════════════════════════════════
   1. FORGOT PASSWORD — Send OTP to email
   ═══════════════════════════════════════════════════════ */
export const forgotPassword = asyncHandler(async (req, res) => {
  const safeEmail = String(req.body.email || "").trim().toLowerCase();

  if (!safeEmail || !EMAIL_REGEX.test(safeEmail)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  const successMessage = "OTP has been sent to your registered email address.";

  const user = await User.findOne({ email: safeEmail });
  if (!user) {
    res.status(404);
    throw new Error("This email is not registered. Please sign up first.");
  }

  // Delete any existing OTPs for this email
  await Otp.deleteMany({ email: safeEmail });

  // Generate, hash, and store OTP
  const plainOtp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(plainOtp, salt);

  await Otp.create({
    email: safeEmail,
    otpHash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  });

  if (!isMailConfigured) {
    await Otp.deleteMany({ email: safeEmail });
    res.status(503);
    throw new Error("OTP email service is not configured. Please contact support.");
  }

  try {
    await mailTransporter.sendMail({
      from: mailFromAddress,
      to: safeEmail,
      subject: "🔐 Your Password Reset OTP — Career Connect",
      html: buildOtpEmailHtml(plainOtp)
    });
    console.log(`[password] OTP email sent to ${safeEmail}`);
  } catch (err) {
    await Otp.deleteMany({ email: safeEmail });
    console.error("[password] Failed to send OTP email:", err.message);
    res.status(502);
    throw new Error("Unable to send OTP right now. Please try again in a minute.");
  }

  return res.status(200).json({ message: successMessage });
});

/* ═══════════════════════════════════════════════════════
   2. VERIFY OTP — Returns a short-lived reset token
   ═══════════════════════════════════════════════════════ */
export const verifyOtp = asyncHandler(async (req, res) => {
  const safeEmail = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  if (!safeEmail || !EMAIL_REGEX.test(safeEmail)) {
    res.status(400);
    throw new Error("Email is required.");
  }
  if (!otp || otp.length !== 6) {
    res.status(400);
    throw new Error("Please enter a valid 6-digit OTP.");
  }

  const otpRecord = await Otp.findOne({ email: safeEmail });

  if (!otpRecord) {
    res.status(400);
    throw new Error("OTP has expired or was not requested. Please request a new one.");
  }

  // Check max attempts
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteMany({ email: safeEmail });
    res.status(429);
    throw new Error("Too many failed attempts. Please request a new OTP.");
  }

  // Increment attempts
  otpRecord.attempts += 1;
  await otpRecord.save();

  // Check expiry
  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteMany({ email: safeEmail });
    res.status(400);
    throw new Error("OTP has expired. Please request a new one.");
  }

  // Compare OTP
  const isMatch = await otpRecord.compareOtp(otp);
  if (!isMatch) {
    const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts;
    res.status(400);
    throw new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
  }

  // OTP is valid — generate a short-lived reset token
  const resetToken = jwt.sign(
    { email: safeEmail, purpose: "password-reset" },
    config.jwtSecret,
    { expiresIn: RESET_TOKEN_EXPIRY }
  );

  // Delete OTP records (used successfully)
  await Otp.deleteMany({ email: safeEmail });

  return res.status(200).json({
    message: "OTP verified successfully.",
    resetToken
  });
});

/* ═══════════════════════════════════════════════════════
   3. RESET PASSWORD — Update password using reset token
   ═══════════════════════════════════════════════════════ */
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken) {
    res.status(400);
    throw new Error("Reset token is required.");
  }
  if (!newPassword || !STRONG_PASSWORD_REGEX.test(newPassword)) {
    res.status(400);
    throw new Error("Password must be 8-64 chars with upper, lower, number, and special character.");
  }

  // Verify reset token
  let decoded;
  try {
    decoded = jwt.verify(resetToken, config.jwtSecret);
  } catch {
    res.status(401);
    throw new Error("Reset link has expired. Please start the process again.");
  }

  if (decoded.purpose !== "password-reset" || !decoded.email) {
    res.status(401);
    throw new Error("Invalid reset token.");
  }

  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // Update password (bcrypt hashing handled by User model pre-save hook)
  user.password = newPassword;
  if (user.provider === "google") {
    user.provider = "local"; // Now has a password, allow local login too
  }
  await user.save();

  // Clean up any remaining OTPs
  await Otp.deleteMany({ email: decoded.email });

  return res.status(200).json({ message: "Password reset successfully. You can now login with your new password." });
});
