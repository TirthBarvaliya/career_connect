import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Helmet } from "react-helmet-async";
import { Eye, EyeOff, LogIn, CheckCircle2, Loader2, ShieldBan } from "lucide-react";
import GradientButton from "../components/common/GradientButton";
import RevolvingBorderButton from "../components/common/RevolvingBorderButton";
import usePageTitle from "../hooks/usePageTitle";
import { setCredentials } from "../redux/slices/authSlice";
import { addToast } from "../redux/slices/uiSlice";
import { ROUTES, USER_ROLES } from "../utils/constants";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import { fetchAppliedJobs, fetchSavedJobs } from "../redux/slices/jobSlice";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;

const BENEFITS = [
  "One-click apply to curated job listings.",
  "Get AI-powered career guidance and recommendations.",
  "Track applications and manage your career roadmap.",
  "Build professional resumes and download as PDF.",
  "Showcase your profile to top companies and recruiters."
];

const DEMO_CREDENTIALS = {
  [USER_ROLES.JOB_SEEKER]: {
    email: "demo.jobseeker@mail.com",
    password: "123456"
  },
  [USER_ROLES.RECRUITER]: {
    email: "demo.recruiter@mail.com",
    password: "123456"
  }
};

const LoginPage = () => {
  usePageTitle("Login");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [demoRoleLoading, setDemoRoleLoading] = useState(null);
  const [blockedError, setBlockedError] = useState("");

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      remember: true
    }
  });

  const handleLogin = async (data, options = {}) => {
    const { isDemo = false, role } = options;
    setBlockedError("");
    if (isDemo) {
      setIsDemoSubmitting(true);
      setDemoRoleLoading(role || null);
    }
    try {
      // Slight delay for loading UX
      await new Promise((r) => setTimeout(r, 800));

      const response = await apiClient.post("/auth/login", {
        email: String(data.email || "").trim().toLowerCase(),
        password: data.password
      });
      dispatch(setCredentials(response.data));
      dispatch(fetchSavedJobs());
      dispatch(fetchAppliedJobs());
      dispatch(addToast({ type: "success", message: "Welcome back. Login successful." }));

      const actualRole = response.data?.user?.role || USER_ROLES.JOB_SEEKER;
      const redirect =
        location.state?.from ||
        (actualRole === USER_ROLES.RECRUITER
          ? ROUTES.RECRUITER_DASHBOARD
          : actualRole === USER_ROLES.ADMIN
            ? ROUTES.ADMIN_DASHBOARD
            : ROUTES.STUDENT_DASHBOARD);
      navigate(redirect, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const msg = getErrorMessage(error, "Login failed.");

      if (status === 403) {
        setBlockedError(msg || "Your account has been blocked by admin. Please contact admin to reactivate your account.");
      } else {
        dispatch(addToast({ type: "error", message: msg }));
      }
    } finally {
      if (isDemo) {
        setIsDemoSubmitting(false);
        setDemoRoleLoading(null);
      }
    }
  };

  const onSubmit = (data) => handleLogin(data);

  const handleDemoLogin = (role) => {
    if (isSubmitting || isDemoSubmitting) return;
    const credentials = DEMO_CREDENTIALS[role];
    if (!credentials) return;
    handleLogin(credentials, { isDemo: true, role });
  };

  /* Google Sign-In */
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "9502897586-lie04l7cjlqmp1rp2u99ks39fhu7rp1u.apps.googleusercontent.com";
  const googleBtnContainerRef = useRef(null);

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          ux_mode: "popup",
          use_fedcm_for_prompt: false
        });
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: Math.min(400, Math.max(200, window.innerWidth - 64)),
          text: "signin_with"
        });
        return true;
      } catch (err) {
        console.error("[Google Sign-In] Init failed:", err);
        return false;
      }
    };

    // Check if script already loaded
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    // Don't add duplicate script tags
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Script exists but maybe not loaded yet, poll for it
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
      // Retry initialization a few times in case the SDK needs time
      let attempts = 0;
      const tryInit = () => {
        if (initGoogle()) return;
        if (++attempts < 10) setTimeout(tryInit, 300);
      };
      tryInit();
    };
    script.onerror = () => console.error("[Google Sign-In] Failed to load GSI script");
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    try {
      const res = await apiClient.post("/auth/google", { credential: response.credential });

      if (res.data.isNewUser) {
        navigate(ROUTES.SIGNUP, {
          state: { googleCredential: response.credential, googleProfile: res.data.googleProfile },
          replace: true
        });
        return;
      }

      dispatch(setCredentials(res.data));
      dispatch(fetchSavedJobs());
      dispatch(fetchAppliedJobs());
      dispatch(addToast({ type: "success", message: "Google login successful. Welcome!" }));
      const actualRole = res.data?.user?.role || USER_ROLES.JOB_SEEKER;
      const redirect =
        location.state?.from ||
        (actualRole === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_DASHBOARD : ROUTES.STUDENT_DASHBOARD);
      navigate(redirect, { replace: true });
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Google login failed.") }));
    }
  }, [dispatch, navigate, location]);

  const isBusy = isSubmitting || isDemoSubmitting;

  return (
    <>
      <Helmet>
        <title>Login | Career connect</title>
      </Helmet>

      <div className="relative overflow-hidden px-4 py-10 sm:py-14">
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

        <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center">
          <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-center xl:p-10"
            >
              {/* Background image + dark overlay for text readability */}
              <img
                src="/login-bg.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-indigo-900/70" />

              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Career connect
                </p>

                <h1 className="mt-4 font-poppins text-2xl font-semibold leading-snug text-white sm:text-3xl">
                  New to Career Connect?
                </h1>

                <ul className="mt-8 space-y-4">
                  {BENEFITS.map((text) => (
                    <motion.li
                      key={text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-cyan-400"
                      />
                      <span className="text-sm leading-relaxed text-slate-200">
                        {text}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <RevolvingBorderButton className="mt-10 w-fit" innerClassName="bg-transparent">
                  <Link
                    to={ROUTES.SIGNUP}
                    className="inline-flex w-fit items-center justify-center rounded-xl border-2 border-cyan-400 bg-white/10 px-8 py-3 text-sm font-semibold text-black backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                  >
                    Register for Free
                  </Link>
                </RevolvingBorderButton>
              </div>
            </motion.aside>

            <motion.main
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel flex flex-col justify-center p-6 sm:p-8"
            >
              <h2 className="font-poppins text-2xl font-semibold text-slate-900 dark:text-white">Login</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Sign in to manage your career journey.</p>

              {blockedError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-3 rounded-xl border border-rose-300/70 bg-rose-50 p-4 dark:border-rose-700/60 dark:bg-rose-900/25"
                >
                  <ShieldBan size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-300" />
                  <div>
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Account Blocked</p>
                    <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-300">{blockedError}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="you@example.com"
                    {...register("email", {
                      required: "Email is required",
                      setValueAs: (value) => String(value || "").trim().toLowerCase(),
                      pattern: {
                        value: EMAIL_REGEX,
                        message: "Invalid email format"
                      },
                      maxLength: {
                        value: 120,
                        message: "Email is too long"
                      }
                    })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="field-input pr-16"
                      placeholder="Enter Password"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-indigo transition hover:text-brand-purple dark:text-cyan-300 dark:hover:text-cyan-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <span className="inline-flex items-center gap-1"><EyeOff size={14} /> Hide</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Eye size={14} /> Show</span>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                    Use 8-64 characters with uppercase, lowercase, number, and symbol.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-200">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-indigo" {...register("remember")} />
                    Remember me
                  </label>
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-sm font-semibold text-brand-indigo transition hover:underline dark:text-cyan-300"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <RevolvingBorderButton className="w-full">
                  <GradientButton type="submit" disabled={isBusy} className="w-full">
                    <span className="inline-flex items-center gap-2">
                      <LogIn size={16} />
                      {isSubmitting ? "Signing in..." : "Login"}
                    </span>
                  </GradientButton>
                </RevolvingBorderButton>
              </form>

             

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-300/60 dark:bg-slate-700" />
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Or</span>
                <div className="h-px flex-1 bg-slate-300/60 dark:bg-slate-700" />
              </div>

              {/* Google Sign-In — real button with animation wrapper */}
              <RevolvingBorderButton className="w-full">
                <div className="flex w-full items-center justify-center rounded-xl border border-slate-300/70 bg-white/80 px-4 py-1 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
                  <div
                    ref={googleBtnContainerRef}
                    className="flex w-full items-center justify-center"
                    style={{ minHeight: 44 }}
                  />
                </div>
              </RevolvingBorderButton>
              {!googleClientId && (
                <p className="text-center text-xs text-slate-400">Google Sign-In is not configured.</p>
              )}

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-300">
                New here?{" "}
                <Link to={ROUTES.SIGNUP} className="font-semibold text-brand-indigo hover:underline dark:text-cyan-300">
                  Create an account
                </Link>
              </p>
            </motion.main>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
