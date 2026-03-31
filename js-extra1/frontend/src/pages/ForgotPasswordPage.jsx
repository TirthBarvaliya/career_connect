import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, KeyRound, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useDispatch } from "react-redux";
import { apiClient } from "../utils/api";
import { addToast } from "../redux/slices/uiSlice";
import { ROUTES } from "../utils/constants";
import GradientButton from "../components/common/GradientButton";
import RevolvingBorderButton from "../components/common/RevolvingBorderButton";
import usePageTitle from "../hooks/usePageTitle";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;
const OTP_LENGTH = 6;
const OTP_COUNTDOWN_SECONDS = 2 * 60; // 2 minutes

/* ═══════════════════════════════════════════════════════
   Forgot Password Page — 3-step flow
   Step 1: Enter email
   Step 2: Enter OTP
   Step 3: Set new password
   ═══════════════════════════════════════════════════════ */
const ForgotPasswordPage = () => {
  usePageTitle("Forgot Password");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  /* ── Step 1: Email Form ── */
  const emailForm = useForm({ mode: "onSubmit" });

  const handleSendOtp = async (data) => {
    setApiError("");
    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: data.email.trim().toLowerCase() });
      setEmail(data.email.trim().toLowerCase());
      setStep(2);
    } catch (err) {
      setApiError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 2: OTP Verification ── */
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef([]);
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    setCountdown(OTP_COUNTDOWN_SECONDS);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleOtpChange = useCallback((index, value) => {
    if (!/^\d?$/.test(value)) return;
    setOtpValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpValues]);

  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const arr = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) arr[i] = pasted[i];
    setOtpValues(arr);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }, []);

  const handleVerifyOtp = async () => {
    const otp = otpValues.join("");
    if (otp.length !== OTP_LENGTH) {
      setApiError("Please enter the complete 6-digit OTP.");
      return;
    }
    setApiError("");
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post("/auth/verify-otp", { email, otp });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setApiError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setApiError("");
    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setCanResend(false);
      setCountdown(OTP_COUNTDOWN_SECONDS);
      dispatch(addToast({ type: "success", message: "A new OTP has been sent to your email." }));
      // Restart timer
      setStep(1);
      setTimeout(() => setStep(2), 0);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 3: Reset Password ── */
  const passwordForm = useForm({ mode: "onSubmit" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError("confirmPassword", { message: "Passwords do not match." });
      return;
    }
    setApiError("");
    setIsSubmitting(true);
    try {
      const { data: resData } = await apiClient.post("/auth/reset-password", {
        resetToken,
        newPassword: data.newPassword
      });
      dispatch(addToast({ type: "success", message: resData.message || "Password reset successfully!" }));
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step indicator ── */
  const steps = [
    { num: 1, label: "Email" },
    { num: 2, label: "Verify OTP" },
    { num: 3, label: "New Password" }
  ];

  return (
    <>
      <Helmet>
        <title>Forgot Password | Career Connect</title>
      </Helmet>

      <div className="relative overflow-hidden px-4 py-10 sm:py-14">
        {/* Background blobs */}
        <motion.div
          className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-brand-purple/35 blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-brand-cyan/35 blur-3xl"
          animate={{ y: [0, -16, 0], x: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel w-full p-6 sm:p-8"
          >
            {/* Back link */}
            <Link
              to={ROUTES.LOGIN}
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-indigo dark:text-slate-400 dark:hover:text-cyan-300"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>

            {/* Step indicator */}
            <div className="mb-8 flex items-center justify-center gap-2">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step >= s.num
                        ? "bg-gradient-to-r from-brand-indigo to-brand-cyan text-white shadow-md"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 size={14} /> : s.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-8 rounded-full transition-all ${step > s.num ? "bg-brand-indigo dark:bg-cyan-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Error display */}
            <AnimatePresence mode="wait">
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 rounded-xl border border-rose-300/70 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/25 dark:text-rose-300"
                >
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ════════ STEP 1: EMAIL ════════ */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <div className="mb-1 flex items-center gap-2 text-brand-indigo dark:text-cyan-300">
                    <Mail size={20} />
                    <h2 className="font-poppins text-xl font-semibold text-slate-900 dark:text-white">Forgot Password?</h2>
                  </div>
                  <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    Enter your registered email address and we'll send you a verification code.
                  </p>

                  <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="field-input"
                        placeholder="you@example.com"
                        {...emailForm.register("email", {
                          required: "Email is required",
                          pattern: { value: EMAIL_REGEX, message: "Invalid email format" }
                        })}
                      />
                      {emailForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-rose-500">{emailForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <RevolvingBorderButton className="w-full">
                      <GradientButton type="submit" disabled={isSubmitting} className="w-full">
                        <span className="inline-flex items-center gap-2">
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                          {isSubmitting ? "Sending OTP..." : "Send OTP"}
                        </span>
                      </GradientButton>
                    </RevolvingBorderButton>
                  </form>
                </motion.div>
              )}

              {/* ════════ STEP 2: OTP VERIFICATION ════════ */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <div className="mb-1 flex items-center gap-2 text-brand-indigo dark:text-cyan-300">
                    <KeyRound size={20} />
                    <h2 className="font-poppins text-xl font-semibold text-slate-900 dark:text-white">Verify OTP</h2>
                  </div>
                  <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    Enter the 6-digit code sent to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
                  </p>

                  {/* OTP Input Boxes */}
                  <div className="mb-4 flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                    {otpValues.map((val, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-12 w-12 rounded-xl border border-slate-300/70 bg-white/80 text-center text-lg font-bold text-slate-900 shadow-sm transition focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/30 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-cyan-400 dark:focus:ring-cyan-400/30 sm:h-14 sm:w-14 sm:text-xl"
                      />
                    ))}
                  </div>

                  {/* Countdown Timer */}
                  <div className="mb-5 text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        OTP expires in <span className="font-semibold text-brand-indigo dark:text-cyan-300">{formatTime(countdown)}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-rose-500 dark:text-rose-400">OTP has expired.</p>
                    )}
                  </div>

                  {/* Verify + Resend buttons */}
                  <div className="space-y-3">
                    <RevolvingBorderButton className="w-full">
                      <GradientButton
                        type="button"
                        disabled={isSubmitting || otpValues.join("").length !== OTP_LENGTH}
                        className="w-full"
                        onClick={handleVerifyOtp}
                      >
                        <span className="inline-flex items-center gap-2">
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                          {isSubmitting ? "Verifying..." : "Verify OTP"}
                        </span>
                      </GradientButton>
                    </RevolvingBorderButton>

                    {canResend && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleResendOtp}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                      >
                        <RefreshCw size={14} />
                        Resend OTP
                      </motion.button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtpValues(Array(OTP_LENGTH).fill("")); setApiError(""); }}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 transition hover:text-brand-indigo dark:text-slate-400 dark:hover:text-cyan-300"
                  >
                    <ArrowLeft size={13} />
                    Change email
                  </button>
                </motion.div>
              )}

              {/* ════════ STEP 3: NEW PASSWORD ════════ */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <div className="mb-1 flex items-center gap-2 text-brand-indigo dark:text-cyan-300">
                    <Lock size={20} />
                    <h2 className="font-poppins text-xl font-semibold text-slate-900 dark:text-white">Reset Password</h2>
                  </div>
                  <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    Create a strong new password for your account.
                  </p>

                  <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="field-input pr-16"
                          placeholder="Enter new password"
                          {...passwordForm.register("newPassword", {
                            required: "Password is required",
                            pattern: {
                              value: STRONG_PASSWORD_REGEX,
                              message: "Must include upper, lower, number, special char, no spaces"
                            }
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-indigo transition hover:text-brand-purple dark:text-cyan-300"
                        >
                          {showPassword ? (
                            <span className="inline-flex items-center gap-1"><EyeOff size={14} /> Hide</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Eye size={14} /> Show</span>
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-xs text-rose-500">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                        Use 8-64 characters with uppercase, lowercase, number, and symbol.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          className="field-input pr-16"
                          placeholder="Confirm new password"
                          {...passwordForm.register("confirmPassword", {
                            required: "Please confirm your password"
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-indigo transition hover:text-brand-purple dark:text-cyan-300"
                        >
                          {showConfirm ? (
                            <span className="inline-flex items-center gap-1"><EyeOff size={14} /> Hide</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Eye size={14} /> Show</span>
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-xs text-rose-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <RevolvingBorderButton className="w-full">
                      <GradientButton type="submit" disabled={isSubmitting} className="w-full">
                        <span className="inline-flex items-center gap-2">
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                          {isSubmitting ? "Resetting..." : "Reset Password"}
                        </span>
                      </GradientButton>
                    </RevolvingBorderButton>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
