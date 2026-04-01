import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Rocket,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import GradientButton from "../components/common/GradientButton";
import RevolvingBorderButton from "../components/common/RevolvingBorderButton";
import usePageTitle from "../hooks/usePageTitle";
import { setCredentials } from "../redux/slices/authSlice";
import { addToast } from "../redux/slices/uiSlice";
import { JOBSEEKER_EXPERIENCE_LEVELS, ROUTES, USER_ROLES } from "../utils/constants";
import { useDispatch } from "react-redux";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import { fetchAppliedJobs, fetchSavedJobs } from "../redux/slices/jobSlice";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FULL_NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,79}$/;
const COMPANY_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9&().,'\-\/\s]{1,99}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const stepMeta = [
  {
    id: 1,
    title: "Account Setup",
    subtitle: "Identity and credentials",
    icon: ShieldCheck
  },
  {
    id: 2,
    title: "Role Selection",
    subtitle: "Job seeker or recruiter flow",
    icon: GraduationCap
  },
  {
    id: 3,
    title: "Finalize",
    subtitle: "Confirm and create account",
    icon: Rocket
  }
];

const SignupPage = () => {
  usePageTitle("Sign Up");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  // Google OAuth state from login page redirect
  const [googleData, setGoogleData] = useState(null);

  useEffect(() => {
    if (location.state?.googleCredential && location.state?.googleProfile) {
      setGoogleData({
        credential: location.state.googleCredential,
        profile: location.state.googleProfile
      });
      setStep(2); // Skip account setup, go to role selection
    }
  }, [location.state]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: USER_ROLES.JOB_SEEKER,
      experienceLevel: JOBSEEKER_EXPERIENCE_LEVELS[0].value,
      company: "",
      agree: false
    }
  });

  const role = watch("role");
  const progress = (step / 3) * 100;
  const activeStepMeta = stepMeta[step - 1];
  const stepLabels = useMemo(() => stepMeta.map((item) => item.title), []);

  const nextStep = async () => {
    if (step === 1 && !googleData) {
      const ok = await trigger(["fullName", "email", "password", "confirmPassword"]);
      if (!ok) return;
    }
    if (step === 2) {
      const fields = role === USER_ROLES.RECRUITER ? ["company"] : ["experienceLevel"];
      const ok = await trigger(fields);
      if (!ok) return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    if (step !== 3) return;
    const isValid = await trigger(["agree"]);
    if (!isValid) return;

    try {
      let response;
      if (googleData) {
        // Google OAuth signup
        response = await apiClient.post("/auth/google-register", {
          credential: googleData.credential,
          role: data.role,
          companyName: data.role === USER_ROLES.RECRUITER ? normalizeText(data.company) : "",
          experienceLevel: data.role === USER_ROLES.RECRUITER ? "" : data.experienceLevel
        });
      } else {
        // Normal email/password signup
        response = await apiClient.post("/auth/register", {
          name: normalizeText(data.fullName),
          email: String(data.email || "").trim().toLowerCase(),
          password: data.password,
          role: data.role,
          companyName: data.role === USER_ROLES.RECRUITER ? normalizeText(data.company) : "",
          experienceLevel: data.role === USER_ROLES.RECRUITER ? "" : data.experienceLevel
        });
      }

      dispatch(setCredentials(response.data));
      dispatch(fetchSavedJobs());
      dispatch(fetchAppliedJobs());
      dispatch(addToast({ type: "success", message: "Account created successfully." }));
      const actualRole = response.data?.user?.role || USER_ROLES.JOB_SEEKER;
      navigate(actualRole === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_DASHBOARD : ROUTES.STUDENT_DASHBOARD);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Unable to create account.") }));
    }
  };

  /* ── Google Sign-In (direct from signup page) ── */
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const googleBtnContainerRef = useRef(null);

  useEffect(() => {
    if (!googleClientId || googleData) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignupResponse,
          ux_mode: "popup",
          use_fedcm_for_prompt: false
        });
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: Math.min(400, Math.max(200, window.innerWidth - 140)),
          text: "signup_with"
        });
        return true;
      } catch (err) {
        console.error("[Google Sign-Up] Init failed:", err);
        return false;
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    // Don't add duplicate script tags
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      const pollInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(pollInterval);
          initGoogle();
        }
      }, 200);
      const pollTimeout = setTimeout(() => clearInterval(pollInterval), 10000);
      return () => { clearInterval(pollInterval); clearTimeout(pollTimeout); };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const tryInit = () => {
        if (initGoogle()) return;
        if (++attempts < 10) setTimeout(tryInit, 300);
      };
      tryInit();
    };
    script.onerror = () => console.error("[Google Sign-Up] Failed to load GSI script");
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId, googleData]);

  const handleGoogleSignupResponse = useCallback(async (response) => {
    try {
      const res = await apiClient.post("/auth/google", { credential: response.credential });
      if (res.data.isNewUser) {
        setGoogleData({ credential: response.credential, profile: res.data.googleProfile });
        setStep(2);
      } else {
        // Already has an account — log them in
        dispatch(setCredentials(res.data));
        dispatch(fetchSavedJobs());
        dispatch(fetchAppliedJobs());
        dispatch(addToast({ type: "success", message: "Welcome back! You already have an account." }));
        const actualRole = res.data?.user?.role || USER_ROLES.JOB_SEEKER;
        navigate(actualRole === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_DASHBOARD : ROUTES.STUDENT_DASHBOARD, { replace: true });
      }
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Google sign-up failed.") }));
    }
  }, [dispatch, navigate]);

  return (
    <>
      <Helmet>
        <title>Sign Up | Career connect</title>
      </Helmet>

      {/* minimal branded header — same brand as Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40">
        <div className="container-4k flex h-20 items-center">
          <Link to={ROUTES.HOME} className="group flex items-center gap-3">
            <div className="relative">
              {/* Same video logo as Navbar */}
              <motion.div
                className="relative flex h-16 w-14 items-center justify-center overflow-hidden rounded-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                style={{ transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                  src="/logo.webm"
                >
                  <source src="/logo.webm" type="video/webm" />
                </video>
              </motion.div>
            </div>
            <div className="relative leading-tight">
              <p className="font-poppins text-lg font-semibold text-slate-900 dark:text-white">
                <motion.span className="inline-flex items-baseline" aria-label="Career Connect" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } }}>
                  {"Career Connect".split("").map((letter, index) => letter === " " ? <span key={`s-${index}`} className="inline-block w-[0.32em]" aria-hidden /> : (
                    <motion.span key={`l-${letter}-${index}`} aria-hidden className="inline-block bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple bg-[length:200%_200%] bg-clip-text text-transparent" variants={{ hidden: { opacity: 0, y: 10, filter: "blur(3px)" }, visible: { opacity: 1, y: [1, -0.5, 0], filter: "blur(0px)" } }} transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}>{letter}</motion.span>
                  ))}
                </motion.span>
              </p>
              <motion.p className="text-xs text-slate-500 dark:text-slate-400" animate={{ opacity: [0.65, 1, 0.65] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
                Guidance + Hiring Platform
              </motion.p>
            </div>
          </Link>
        </div>
      </header>

      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-10 sm:py-14">
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

        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel relative overflow-hidden p-6 sm:p-8"
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-indigo-950/70 to-cyan-900/60" />
              </div>
              <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />

              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Career connect
                </p>
                <h1 className="mt-3 font-poppins text-3xl font-semibold text-white">
                  Build your career profile in minutes
                </h1>
                <p className="mt-2 text-sm text-cyan-100/90">
                  Smooth onboarding with role-aware setup for job seekers and recruiters.
                </p>

                <div className="mt-8 space-y-3">
                  {stepMeta.map((item, idx) => {
                    const Icon = item.icon;
                    const isCompleted = step > item.id;
                    const isActive = step === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`rounded-2xl border p-3 transition ${
                          isActive
                            ? "border-cyan-300/60 bg-cyan-400/20"
                            : "border-white/20 bg-slate-950/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                              isCompleted
                                ? "bg-emerald-300/25 text-emerald-100"
                                : isActive
                                  ? "bg-cyan-300/25 text-cyan-100"
                                  : "bg-white/15 text-cyan-100"
                            }`}
                          >
                            {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="text-xs text-cyan-100/90">{item.subtitle}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-2xl border border-white/20 bg-slate-950/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/90">Current Step</p>
                  <p className="mt-1 text-sm font-semibold text-white">{activeStepMeta.title}</p>
                  <p className="text-xs text-cyan-100/85">{activeStepMeta.subtitle}</p>
                </div>
              </div>
            </motion.aside>

            <motion.main
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 sm:p-8"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-poppins text-2xl font-semibold text-slate-900 dark:text-white">Create account</h2>
                  <span className="rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-semibold text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300">
                    Step {step} / 3
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {stepLabels.map((label, idx) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={step >= idx + 1 ? "text-brand-indigo dark:text-cyan-300" : ""}>{label}</span>
                      {idx < stepLabels.length - 1 && <span>•</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.45 }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="Your full name"
                          {...register("fullName", {
                            required: "Name is required",
                            setValueAs: normalizeText,
                            minLength: { value: 2, message: "Name must be at least 2 characters" },
                            maxLength: { value: 80, message: "Name is too long" },
                            pattern: {
                              value: FULL_NAME_REGEX,
                              message: "Use letters, spaces, apostrophe, dot, or hyphen only"
                            }
                          })}
                        />
                        {errors.fullName && <p className="mt-1 text-xs text-rose-500">{errors.fullName.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Email
                        </label>
                        <input
                          type="email"
                          className="field-input"
                          placeholder="you@example.com"
                          {...register("email", {
                            required: "Email is required",
                            setValueAs: (value) => String(value || "").trim().toLowerCase(),
                            maxLength: { value: 120, message: "Email is too long" },
                            pattern: { value: EMAIL_REGEX, message: "Invalid email format" }
                          })}
                        />
                        {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="field-input pr-12"
                            placeholder="8-64 chars, upper/lower, number & symbol"
                            {...register("password", {
                              required: "Password is required",
                              minLength: { value: 8, message: "Minimum 8 characters" },
                              maxLength: { value: 64, message: "Maximum 64 characters" },
                              pattern: {
                                value: STRONG_PASSWORD_REGEX,
                                message: "Must include upper, lower, number, special char, no spaces"
                              }
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-brand-indigo dark:text-slate-300 dark:hover:text-cyan-300"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                          Use 8-64 characters with uppercase, lowercase, number, and symbol.
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="field-input pr-12"
                            placeholder="Re-enter password"
                            {...register("confirmPassword", {
                              required: "Please confirm your password",
                              validate: (value) => value === watch("password") || "Passwords do not match"
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-brand-indigo dark:text-slate-300 dark:hover:text-cyan-300"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Google profile banner */}
                      {googleData && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 dark:border-emerald-800 dark:bg-emerald-900/30">
                          {googleData.profile.picture && (
                            <img src={googleData.profile.picture} alt="" className="h-10 w-10 rounded-full" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{googleData.profile.name}</p>
                            <p className="truncate text-xs text-emerald-600 dark:text-emerald-400">{googleData.profile.email}</p>
                          </div>
                          <CheckCircle2 size={18} className="ml-auto shrink-0 text-emerald-500" />
                        </div>
                      )}
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Account Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${role === USER_ROLES.JOB_SEEKER
                              ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                              : "border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                              }`}
                          >
                            <input type="radio" value={USER_ROLES.JOB_SEEKER} className="hidden" {...register("role")} />
                            Job Seeker
                          </label>
                          <label
                            className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${role === USER_ROLES.RECRUITER
                              ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                              : "border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                              }`}
                          >
                            <input type="radio" value={USER_ROLES.RECRUITER} className="hidden" {...register("role")} />
                            Recruiter
                          </label>
                        </div>
                      </div>

                      {role === USER_ROLES.JOB_SEEKER && (
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Sign up as
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {JOBSEEKER_EXPERIENCE_LEVELS.map((item) => (
                              <label
                                key={item.value}
                                className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${watch("experienceLevel") === item.value
                                  ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                                  : "border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  value={item.value}
                                  className="hidden"
                                  {...register("experienceLevel", { required: "Please select fresher or experienced." })}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                          {errors.experienceLevel && (
                            <p className="mt-1 text-xs text-rose-500">{errors.experienceLevel.message}</p>
                          )}
                        </div>
                      )}

                      {role === USER_ROLES.RECRUITER && (
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Company Name
                          </label>
                          <input
                            type="text"
                            className="field-input"
                            placeholder="Your company"
                            {...register("company", {
                              required: "Company is required for recruiters",
                              setValueAs: normalizeText,
                              minLength: { value: 2, message: "Company name is too short" },
                              maxLength: { value: 100, message: "Company name is too long" },
                              pattern: {
                                value: COMPANY_NAME_REGEX,
                                message: "Invalid company name format"
                              }
                            })}
                          />
                          {errors.company && <p className="mt-1 text-xs text-rose-500">{errors.company.message}</p>}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-slate-300/70 bg-white/70 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">Review Details</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">Account type: {role}</p>
                        {googleData && <p className="text-slate-600 dark:text-slate-300">Google: {googleData.profile.email}</p>}
                        <p className="text-slate-600 dark:text-slate-300">
                          {role === USER_ROLES.RECRUITER
                            ? `Company: ${watch("company")}`
                            : `Experience: ${watch("experienceLevel")}`}
                        </p>
                      </div>
                      <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-indigo"
                          {...register("agree", { required: "Please accept terms to continue" })}
                        />
                        I agree to the platform terms and privacy policy.
                      </label>
                      {errors.agree && <p className="text-xs text-rose-500">{errors.agree.message}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {(step > 1 && !(step === 2 && googleData)) ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="rounded-xl border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        <ArrowLeft size={14} />
                        Back
                      </span>
                    </button>
                  ) : (
                    <div /> // spacer
                  )}

                  {step < 3 ? (
                    <RevolvingBorderButton>
                      <GradientButton type="button" className="px-4 py-2 text-sm" onClick={nextStep}>
                        <span className="inline-flex items-center gap-1">
                          Next
                          <ArrowRight size={14} />
                        </span>
                      </GradientButton>
                    </RevolvingBorderButton>
                  ) : (
                    <RevolvingBorderButton>
                      <GradientButton type="submit" className="px-4 py-2 text-sm" disabled={isSubmitting}>
                        <span className="inline-flex items-center gap-1">
                          {isSubmitting ? "Creating..." : "Create Account"}
                          {isSubmitting ? <UserPlus size={14} /> : <CheckCircle2 size={14} />}
                        </span>
                      </GradientButton>
                    </RevolvingBorderButton>
                  )}
                </div>
              </form>

              {/* Google signup button — only on step 1 and not already in Google flow */}
              {step === 1 && !googleData && (
                <>
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-300/60 dark:bg-slate-700" />
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Or</span>
                    <div className="h-px flex-1 bg-slate-300/60 dark:bg-slate-700" />
                  </div>
                  {/* Google Sign-Up — real button perfectly hugged by border */}
                  <div className="flex w-full justify-center">
                    <RevolvingBorderButton 
                      className="w-fit !rounded-[6px] transition hover:-translate-y-0.5 hover:shadow-soft" 
                      innerClassName="w-fit flex items-center justify-center !rounded-[4px] !bg-white dark:!bg-[#131314] overflow-hidden"
                    >
                      <div
                        ref={googleBtnContainerRef}
                        className="flex items-center justify-center"
                        style={{ minHeight: 40 }}
                      />
                    </RevolvingBorderButton>
                  </div>
                </>
              )}

              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-300">
                Already have an account?{" "}
                <Link to={ROUTES.LOGIN} className="font-semibold text-brand-indigo hover:underline dark:text-cyan-300">
                  Sign in
                </Link>
              </p>
            </motion.main>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
