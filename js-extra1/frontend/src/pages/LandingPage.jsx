import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Brain,
  BriefcaseBusiness,
  CloudCog,
  Code2,
  FileText,
  Palette,
  Route,
  ArrowRight,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bot,
  Target
} from "lucide-react";
import AnimatedSection from "../components/common/AnimatedSection";
import GradientButton from "../components/common/GradientButton";
import RevolvingBorderButton from "../components/common/RevolvingBorderButton";
import TypingHeadline from "../components/common/TypingHeadline";
import RoadmapSnapshot3D from "../components/landing/RoadmapSnapshot3D";
import { featuredCompanies, platformFeatures, testimonials, topCategories } from "../utils/mockData";
import { ROUTES, USER_ROLES } from "../utils/constants";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";



const featureIcons = {
  Brain,
  BriefcaseBusiness,
  FileText,
  Route,
  Bot,
  Target
};

const PREP_DOMAINS = [
  { id: "frontend-developer", title: "Frontend Developer", icon: Code2, color: "from-blue-500/20 to-cyan-500/5", border: "border-blue-500/30", video: "https://res.cloudinary.com/dj7wzw0o1/video/upload/v1775821746/frontend_oojzdx.mp4" },
  { id: "ai-ml-engineer", title: "AI / ML Engineer", icon: Brain, color: "from-purple-500/20 to-pink-500/5", border: "border-purple-500/30", video: "https://res.cloudinary.com/dj7wzw0o1/video/upload/v1775821228/aiml_tewlk0.mp4" },
  { id: "ui-ux-designer", title: "UI / UX Designer", icon: Palette, color: "from-emerald-500/20 to-teal-500/5", border: "border-emerald-500/30", video: "https://res.cloudinary.com/dj7wzw0o1/video/upload/v1775821756/uiux_qbjjwj.mp4" },
  { id: "backend-developer", title: "Backend Developer", icon: CloudCog, color: "from-indigo-500/20 to-violet-500/5", border: "border-indigo-500/30", video: "https://res.cloudinary.com/dj7wzw0o1/video/upload/v1775821569/backend_g7psmr.mp4" },
  { id: "data-analyst", title: "Data Analyst", icon: Route, color: "from-orange-500/20 to-red-500/5", border: "border-orange-500/30", video: "https://res.cloudinary.com/dj7wzw0o1/video/upload/v1775821728/data_x85gxb.mp4" }
];

const buildFallbackSnapshot = () => {
  const source = topCategories.slice(0, 4);
  const maxOpenRoles = Math.max(...source.map((item) => Number(item.openRoles || 0)), 1);

  return source.map((item) => {
    const normalizedOpenRoles = Number(item.openRoles || 0);
    return {
      id: String(item.id),
      title: item.title,
      completion: Math.max(12, Math.min(100, Math.round((normalizedOpenRoles / maxOpenRoles) * 100))),
      source: "market-demand"
    };
  });
};

const normalizeSnapshot = (rows = []) =>
  (Array.isArray(rows) ? rows : [])
    .map((item) => ({
      id: String(item?.id || item?.pathKey || "").trim(),
      title: String(item?.title || item?.pathTitle || "").trim(),
      completion: Math.max(0, Math.min(100, Math.round(Number(item?.completion || 0)))),
      source: String(item?.source || "").trim()
    }))
    .filter((item) => item.id && item.title);

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [activeFeatureId, setActiveFeatureId] = useState(platformFeatures[0]?.id || "");
  const [prepIndex, setPrepIndex] = useState(0);
  const [roadmapSnapshot, setRoadmapSnapshot] = useState(() => buildFallbackSnapshot());
  const [featureScrollProgress, setFeatureScrollProgress] = useState(0);
  const featuresContainerRef = useRef(null);

  useEffect(() => {
    let frameId = 0;

    const updateFeatureProgress = () => {
      frameId = 0;
      const section = featuresContainerRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const nextProgress = Math.min(Math.max((-rect.top) / scrollableDistance, 0), 1);

      setFeatureScrollProgress((prev) => (Math.abs(prev - nextProgress) < 0.001 ? prev : nextProgress));

      const featureCount = platformFeatures.length;
      const idx = Math.min(Math.floor(nextProgress * featureCount), featureCount - 1);
      const newId = platformFeatures[Math.max(0, idx)]?.id;
      if (newId) {
        setActiveFeatureId((prev) => (prev === newId ? prev : newId));
      }
    };

    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateFeatureProgress);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const videoRefs = useRef({});

  // Pause hidden videos, play only visible ones to prevent stuttering
  useEffect(() => {
    PREP_DOMAINS.forEach((domain, i) => {
      let stackPos = i - prepIndex;
      if (stackPos > Math.floor(PREP_DOMAINS.length / 2)) stackPos -= PREP_DOMAINS.length;
      if (stackPos < -Math.floor(PREP_DOMAINS.length / 2)) stackPos += PREP_DOMAINS.length;

      const video = videoRefs.current[domain.id];
      if (!video) return;

      const shouldPlay = stackPos >= 0 && stackPos <= 2;
      if (shouldPlay) {
        video.play().catch(() => { });
      } else {
        video.pause();
      }
    });
  }, [prepIndex]);
  usePageTitle("Career Guidance & Jobs");
  const joinTarget = isAuthenticated
    ? user?.role === "recruiter"
      ? ROUTES.RECRUITER_DASHBOARD
      : ROUTES.STUDENT_DASHBOARD
    : ROUTES.SIGNUP;
  const activeFeature =
    platformFeatures.find((feature) => feature.id === activeFeatureId) || platformFeatures[0];
  const activeFeatureIndex = Math.max(
    platformFeatures.findIndex((feature) => feature.id === activeFeature?.id),
    0
  );
  const featureProgressPercent = `${Math.max(0, Math.min(100, featureScrollProgress * 100))}%`;

  useEffect(() => {
    let active = true;

    const loadCareerTrends = async () => {
      try {
        const response = await apiClient.get("/landing/career-trends");
        if (!active) return;
        const trends = response.data?.trends;
        if (Array.isArray(trends) && trends.length) {
          setRoadmapSnapshot(
            trends.slice(0, 4).map((t, i) => ({
              id: t.id || String(i + 1),
              title: t.title,
              completion: t.completion || 0,
              source: t.source || "adzuna"
            }))
          );
        }
      } catch {
        // Keep fallback snapshot data.
      }
    };

    loadCareerTrends();
    return () => {
      active = false;
    };
  }, []);

  const handleFeatureCta = () => {
    if (!activeFeature?.ctaRoute) return;

    // AI Chatbot: dispatch custom event to open the floating chatbot widget
    if (activeFeature.id === "ai-chatbot") {
      window.dispatchEvent(new Event("open-chatbot"));
      return;
    }

    // AI Interview Prep: scroll to the Job Prep section on this page
    if (activeFeature.id === "ai-interview") {
      document.getElementById("ai-job-prep")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (activeFeature.ctaRoute === ROUTES.STUDENT_RESUME_BUILDER) {
      if (!isAuthenticated) {
        navigate(ROUTES.SIGNUP);
        return;
      }
      if (user?.role !== USER_ROLES.JOB_SEEKER) {
        navigate(ROUTES.RECRUITER_DASHBOARD);
        return;
      }
    }
    navigate(activeFeature.ctaRoute);
  };

  const handlePrepNavigation = (dir) => {
    if (dir === "next") {
      setPrepIndex((prev) => (prev + 1) % PREP_DOMAINS.length);
    } else {
      setPrepIndex((prev) => (prev - 1 + PREP_DOMAINS.length) % PREP_DOMAINS.length);
    }
  };

  const startInterview = (domainId) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(`${ROUTES.INTERVIEW}/${domainId}`);
  };

  return (
    <>
      <Helmet>
        <title>Career connect | Modern Career Guidance & Job Portal</title>
        <meta
          name="description"
          content="Discover jobs, build career roadmaps, and connect job seekers with recruiters on a modern MERN-based platform."
        />
      </Helmet>

      <section className="relative overflow-hidden pb-16 pt-14 sm:pt-20">
        <div className="container-4k grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-indigo/25 bg-brand-indigo/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-indigo dark:border-brand-indigo/40 dark:bg-brand-indigo/20 dark:text-cyan-300"
            >
              <Sparkles size={13} />
              New era of career growth
            </motion.span>

            <h1 className="font-poppins text-[2rem] font-bold leading-tight text-slate-900 sm:text-5xl xl:text-6xl dark:text-white">
              One Platform To{" "}
              <span className="bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple bg-clip-text text-transparent">
                Guide Careers
              </span>{" "}
              And <TypingHeadline phrases={["match top jobs", "unlock milestones", "accelerate hiring"]} />
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
              Career connect helps job seekers and recruiters navigate skill growth, job discovery, hiring pipelines, and analytics with a vibrant modern experience.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <div className="w-full sm:w-auto">
                <RevolvingBorderButton className="w-full">
                  <GradientButton className="w-full" onClick={() => navigate(joinTarget)}>
                    {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                    <ArrowRight size={15} className="ml-2 inline-block" />
                  </GradientButton>
                </RevolvingBorderButton>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.JOBS)}
                className="w-full sm:w-auto rounded-xl border border-slate-300/70 bg-white/75 px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Explore Jobs
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-white/30 bg-white/70 p-2 backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/70">
              <Search size={18} className="ml-2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by role, company, or skill..."
                className="min-w-[160px] flex-1 bg-transparent py-2 text-sm outline-none"
              />
              <GradientButton
                className="w-full px-4 py-2 text-sm sm:w-auto"
                onClick={() => navigate(`${ROUTES.JOBS}?q=${encodeURIComponent(search)}`)}
              >
                Search Jobs
              </GradientButton>
            </div>
          </div>

          <RoadmapSnapshot3D data={roadmapSnapshot} />
        </div>
      </section>

      {/* Sticky-scroll Platform Features section */}
      <section
        ref={featuresContainerRef}
        className="relative"
        style={{ height: `${platformFeatures.length * 100}vh` }}
      >
        <div className="sticky top-0 flex min-h-screen items-center py-12">
          <div className="container-4k w-full">
            <div className="mb-8">
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Platform Features In Action
              </motion.h2>
              <motion.p
                className="section-subtitle mt-2"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Explore what Career connect offers through an interactive feature map.
              </motion.p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="glass-panel relative p-3">
                {/* Stable progress rail */}
                <div className="pointer-events-none absolute -left-[1px] bottom-4 top-4 w-[3px] rounded-full bg-slate-200/40 dark:bg-slate-700/30">
                  <motion.div
                    className="absolute left-0 top-0 w-full rounded-full bg-gradient-to-b from-brand-indigo via-brand-cyan to-brand-purple"
                    animate={{ height: featureProgressPercent }}
                    transition={{ type: "spring", stiffness: 180, damping: 28 }}
                  />
                  <motion.div
                    className="pointer-events-none absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-white/80 bg-brand-cyan shadow-[0_0_10px_rgba(6,182,212,0.75)]"
                    animate={{ top: `calc(${featureProgressPercent} - 6px)` }}
                    transition={{ type: "spring", stiffness: 180, damping: 28 }}
                  />
                </div>

                <div className="grid gap-2">
                  {platformFeatures.map((feature, idx) => {
                    const Icon = featureIcons[feature.icon] || Sparkles;
                    const active = activeFeature?.id === feature.id;
                    const completed = idx < activeFeatureIndex;
                    return (
                      <motion.button
                        key={feature.id}
                        type="button"
                        onClick={() => setActiveFeatureId(feature.id)}
                        initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ duration: 0.45, delay: idx * 0.1, ease: "easeOut" }}
                        className={`group relative overflow-hidden rounded-xl border px-4 py-3.5 text-left transition duration-300 ${active
                          ? "border-brand-indigo/60 bg-brand-indigo/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] dark:bg-brand-indigo/20"
                          : "border-slate-200/80 bg-white/70 hover:border-brand-indigo/40 dark:border-slate-700 dark:bg-slate-900/70"
                          }`}
                      >
                        <span
                          className={`absolute left-0 top-0 h-full w-[3px] transition ${
                            active
                              ? "bg-gradient-to-b from-brand-indigo via-brand-cyan to-brand-purple"
                              : completed
                                ? "bg-brand-indigo/35 dark:bg-cyan-400/35"
                                : "bg-transparent"
                          }`}
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`block rounded-lg p-2 transition duration-300 ${active ? "bg-brand-indigo/20 text-brand-indigo dark:bg-cyan-500/20 dark:text-cyan-300" : "bg-slate-100 text-slate-500 group-hover:bg-brand-indigo/10 group-hover:text-brand-indigo dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-brand-indigo/25 dark:group-hover:text-cyan-300"}`}>
                              <Icon size={16} />
                            </span>
                            <div>
                              <p className={`text-sm font-semibold transition ${active ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>{feature.title}</p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{feature.audience}</p>
                            </div>
                          </div>
                          {active && <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-indigo dark:text-cyan-300">Active</span>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <motion.div
                key={activeFeature?.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{activeFeature?.title}</h3>
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-200">
                    {activeFeature?.audience}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{activeFeature?.summary}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(activeFeature?.metrics || []).map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200/80 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/75"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-300">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  {(activeFeature?.bullets || []).map((point) => (
                    <p key={point} className="text-sm text-slate-600 dark:text-slate-300">
                      • {point}
                    </p>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <GradientButton onClick={handleFeatureCta}>
                    {activeFeature?.ctaLabel || "Explore"}
                    <ArrowRight size={15} className="ml-2" />
                  </GradientButton>
                  {activeFeature?.id !== "ai-chatbot" && activeFeature?.id !== "ai-interview" && (
                    <button
                      type="button"
                      onClick={() => navigate(joinTarget)}
                      className="rounded-xl border border-slate-300/70 bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                    >
                      {isAuthenticated ? "Open Workspace" : "Join Platform"}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection className="py-16 sm:py-20">
        <div className="container-4k">
          <div className="mb-12 text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-indigo/25 bg-brand-indigo/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-indigo dark:border-brand-indigo/40 dark:bg-brand-indigo/20 dark:text-cyan-300"
            >
              <Route size={13} />
              Your Journey
            </motion.span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto mt-2 max-w-2xl">
              From profile to placement — five powerful steps to accelerate your career with AI.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Vertical connecting timeline line — desktop only */}
            <div className="pointer-events-none absolute left-6 top-0 hidden h-full w-px lg:left-1/2 lg:block">
              <motion.div
                className="h-full w-full bg-gradient-to-b from-brand-indigo via-brand-cyan to-brand-purple"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
              />
            </div>

            <div className="space-y-8 lg:space-y-12">
              {[
                {
                  step: "01",
                  title: "Build Your Profile",
                  description: "Add your skills, write your bio, and let the platform understand your unique career goals and aspirations.",
                  icon: Sparkles,
                  highlight: "Skills · Bio · Career Goals",
                  gradient: "from-blue-500 to-brand-indigo"
                },
                {
                  step: "02",
                  title: "Explore AI-Powered Tools",
                  description: "Get daily Tech Pulse insights, chat with our AI career guide, and analyze your resume with ATS scoring.",
                  icon: Brain,
                  highlight: "Tech Pulse · AI Chatbot · ATS Checker",
                  gradient: "from-brand-indigo to-brand-cyan"
                },
                {
                  step: "03",
                  title: "Follow Your Roadmap",
                  description: "AI-generated career paths tailored to your skill level with real-time progress tracking and milestone celebrations.",
                  icon: Route,
                  highlight: "AI Roadmaps · Progress Tracking",
                  gradient: "from-brand-cyan to-emerald-500"
                },
                {
                  step: "04",
                  title: "Ace Your Interviews",
                  description: "Practice domain-specific interviews with our AI coach. Get instant feedback, scoring, and improvement tips.",
                  icon: Bot,
                  highlight: "AI Interview Prep · Instant Feedback",
                  gradient: "from-emerald-500 to-brand-purple"
                },
                {
                  step: "05",
                  title: "Land Your Dream Job",
                  description: "Smart job matching powered by your skills, 20+ professional resume templates, and seamless one-click applications.",
                  icon: BriefcaseBusiness,
                  highlight: "Smart Matching · 20+ Templates · One-Click Apply",
                  gradient: "from-brand-purple to-pink-500"
                }
              ].map((item, index) => {
                const Icon = item.icon;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className={`relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-0 ${
                      isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                  >
                    {/* Timeline dot — centered on timeline */}
                    <div className="absolute left-6 top-0 z-10 hidden lg:left-1/2 lg:block lg:-translate-x-1/2">
                      <motion.div
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} shadow-lg`}
                        whileHover={{ scale: 1.15 }}
                        whileInView={{
                          boxShadow: [
                            "0 0 0px rgba(99,102,241,0)",
                            "0 0 20px rgba(99,102,241,0.3)",
                            "0 0 0px rgba(99,102,241,0)"
                          ]
                        }}
                        viewport={{ once: true }}
                        transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.2 } }}
                      >
                        <span className="text-sm font-bold text-white">{item.step}</span>
                      </motion.div>
                    </div>

                    {/* Content card */}
                    <div className={`w-full lg:w-[calc(50%-2rem)] ${isEven ? "lg:pr-4" : "lg:pl-4"}`}>
                      <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.25 } }}
                        className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.06] p-5 backdrop-blur-xl transition-all duration-300 hover:border-brand-indigo/30 hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)] dark:border-white/10 dark:bg-slate-900/30 dark:hover:border-cyan-500/25 dark:hover:shadow-[0_8px_32px_rgba(34,211,238,0.08)]"
                      >
                        {/* Subtle gradient background on hover */}
                        <span className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04]`} />

                        <div className="relative z-10">
                          <div className="mb-3 flex items-center gap-3">
                            {/* Mobile step number */}
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-xs font-bold text-white shadow-md lg:hidden`}>
                              {item.step}
                            </div>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} bg-opacity-10`}>
                              <Icon size={17} className="text-brand-indigo dark:text-cyan-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {item.title}
                            </h3>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {item.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.highlight.split(" · ").map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-brand-indigo/15 bg-brand-indigo/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-brand-indigo dark:border-cyan-500/20 dark:bg-cyan-500/[0.08] dark:text-cyan-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Spacer for the other side */}
                    <div className="hidden w-[calc(50%-2rem)] lg:block" />
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <GradientButton onClick={() => navigate(joinTarget)} className="px-6 py-3">
                {isAuthenticated ? "Go to Dashboard" : "Start Your Journey"}
                <ArrowRight size={15} className="ml-2" />
              </GradientButton>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="ai-job-prep" className="py-16">
        <div className="container-4k">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* LEFT SIDE: Text & CTA */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-cyan text-white shadow-glow">
                <Bot size={24} />
              </div>
              <h2 className="font-poppins text-3xl font-bold leading-tight text-slate-900 sm:text-4xl dark:text-white">
                Job Prep
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Practice interviews with our Free AI Interview Coach. Select your domain, face technical questions, and get instant feedback to sharpen your skills.
              </p>
              <div className="mt-8">
                <GradientButton onClick={() => startInterview(PREP_DOMAINS[prepIndex].id)}>
                  Practice Now
                </GradientButton>
              </div>
            </div>

            {/* RIGHT SIDE: Stacked Card Deck Carousel */}
            <div className="relative flex w-full flex-col items-center">

              {/* Navigation Arrows — ABOVE the deck on mobile, top-right on sm+ */}
              <div className="relative z-30 mb-3 flex w-full items-center justify-center gap-3 sm:absolute sm:right-2 sm:top-0 sm:mb-0 sm:w-auto sm:justify-end">
                <button
                  onClick={() => handlePrepNavigation("prev")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/40 bg-white/80 text-slate-600 shadow-md backdrop-blur-xl transition-all hover:scale-110 hover:border-brand-cyan/40 hover:text-brand-indigo dark:border-white/15 dark:bg-slate-800/70 dark:text-white/70 dark:hover:bg-slate-700 dark:hover:text-white sm:h-11 sm:w-11"
                  aria-label="Previous domain"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePrepNavigation("next")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/40 bg-white/80 text-slate-600 shadow-md backdrop-blur-xl transition-all hover:scale-110 hover:border-brand-cyan/40 hover:text-brand-indigo dark:border-white/15 dark:bg-slate-800/70 dark:text-white/70 dark:hover:bg-slate-700 dark:hover:text-white sm:h-11 sm:w-11"
                  aria-label="Next domain"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="relative flex h-[340px] w-[min(100%,320px)] items-center justify-center sm:h-[400px] sm:mt-6">
                {PREP_DOMAINS.map((domain, i) => {
                  let stackPos = i - prepIndex;
                  if (stackPos > Math.floor(PREP_DOMAINS.length / 2)) stackPos -= PREP_DOMAINS.length;
                  if (stackPos < -Math.floor(PREP_DOMAINS.length / 2)) stackPos += PREP_DOMAINS.length;

                  const isVisible = stackPos >= -1 && stackPos <= 3;
                  const isActive = stackPos === 0;

                  const rotation = isActive ? 0 : stackPos * 6 + (stackPos > 0 ? 2 : -2);
                  const yShift = isActive ? 0 : stackPos * -8;
                  const xShift = isActive ? 0 : stackPos * 12;
                  const cardScale = isActive ? 1 : 1 - Math.abs(stackPos) * 0.04;
                  const cardOpacity = !isVisible ? 0 : isActive ? 1 : Math.max(0.3, 1 - Math.abs(stackPos) * 0.2);

                  return (
                    <motion.div
                      key={domain.id}
                      animate={{
                        opacity: cardOpacity,
                        scale: cardScale,
                        x: xShift,
                        y: yShift,
                        rotate: rotation,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28,
                        mass: 0.8,
                      }}
                      className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl border p-4 sm:p-6 ${isActive
                        ? `${domain.border} bg-slate-900/80 shadow-[0_12px_50px_rgba(99,102,241,0.3),0_4px_20px_rgba(0,0,0,0.6)]`
                        : "border-white/[0.08] bg-slate-900/60 shadow-[0_6px_30px_rgba(0,0,0,0.5)]"
                        }`}
                      style={{
                        zIndex: isActive ? 20 : isVisible ? 10 - Math.abs(stackPos) : 0,
                        transformOrigin: "center bottom",
                        pointerEvents: isVisible ? "auto" : "none",
                      }}
                    >
                      {/* Looping video background */}
                      <video
                        ref={(el) => { videoRefs.current[domain.id] = el; }}
                        src={domain.video}
                        loop
                        muted
                        playsInline
                        preload={isActive || stackPos === 1 ? "auto" : "metadata"}
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                      />

                      {/* Dark gradient overlay for text readability */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Subtle color tint overlay */}
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20 ${domain.color}`} />

                      {/* Glossy top highlight on active card */}
                      {isActive && (
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/[0.06] to-transparent" />
                      )}

                      {/* Bottom overlay with title + button */}
                      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 sm:gap-4 text-center">
                        <div>
                          <h3
                            className={`font-poppins text-lg sm:text-xl font-bold drop-shadow-lg transition-colors duration-300 ${isActive ? "text-white" : "text-white/70"
                              }`}
                          >
                            {domain.title}
                          </h3>
                          <p className="mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide text-brand-cyan drop-shadow-md">
                            5 Min AI Interview
                          </p>
                        </div>

                        {isActive && (
                          <motion.button
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            onClick={() => startInterview(domain.id)}
                            className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-glow transition duration-300 hover:scale-[1.03] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo"
                          >
                            Practice Interview
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </AnimatedSection >
    </>
  );
};

export default LandingPage;
