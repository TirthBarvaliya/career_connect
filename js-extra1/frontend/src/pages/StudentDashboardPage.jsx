import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Bookmark, Send, FileBadge2, XCircle, Video, Calendar, Clock, ExternalLink } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import GradientButton from "../components/common/GradientButton";
import TechPulseCard from "../components/dashboard/TechPulseCard";
import RoadmapProgressCard from "../components/dashboard/RoadmapProgressCard";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import { addToast } from "../redux/slices/uiSlice";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import { applyToJobAsync, fetchAppliedJobs, withdrawApplicationAsync } from "../redux/slices/jobSlice";
import { ROUTES } from "../utils/constants";

const buildTimelineFromRoadmap = (roadmap, fallbackProgress) => {
  const rows = Array.isArray(roadmap?.paths) ? roadmap.paths : [];
  const normalizedRows = rows
    .map((item) => ({
      label: String(item?.pathTitle || "").trim(),
      progress: Math.max(0, Math.min(100, Math.round(Number(item?.completion || 0)))),
      key: String(item?.pathKey || "").trim()
    }))
    .filter((item) => item.label && item.key);

  if (normalizedRows.length) {
    return normalizedRows.slice(0, 5);
  }

  const p = Math.max(0, Math.min(100, Number(fallbackProgress || 0)));
  return [
    { label: "Current Roadmap", progress: p, key: "current" }
  ];
};

const StudentDashboardPage = () => {
  usePageTitle("Job Seeker Dashboard");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appliedJobIds = useSelector((state) => state.jobs.appliedJobIds);
  const appliedApplications = useSelector((state) => state.jobs.appliedApplications);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [applicationToDrop, setApplicationToDrop] = useState(null);
  const appliedJobsRef = useRef(null);
  const [highlightApplied, setHighlightApplied] = useState(false);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiClient.get("/dashboard/jobseeker");
      setDashboard(response.data);
    } catch (error) {
      if (!silent) {
        dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load dashboard.") }));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadDashboard();
    dispatch(fetchAppliedJobs());
  }, [loadDashboard, dispatch]);

  useEffect(() => {
    const handleWindowFocus = () => {
      loadDashboard({ silent: true });
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadDashboard({ silent: true });
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    const intervalId = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 45000);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  const stats = dashboard?.stats || {
    profileCompletion: 0,
    recommendedJobs: 0,
    savedJobs: 0,
    appliedJobs: 0,
    roadmapProgress: 0
  };
  const recommendations = useMemo(() => (dashboard?.recommended || []).slice(0, 4), [dashboard?.recommended]);
  const activeAppliedApplications = useMemo(
    () =>
      (appliedApplications || [])
        .filter((application) => application?.job && application.status !== "Withdrawn")
        .slice(0, 6),
    [appliedApplications]
  );
  // ── Upcoming interview detection ──
  const upcomingInterview = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (appliedApplications || [])
      .filter((app) => {
        const s = app.status;
        return (s === "Interview Scheduled" || s === "Interviewing") && app.interview?.date;
      })
      .map((app) => ({ ...app, _interviewDate: new Date(app.interview.date) }))
      .filter((app) => app._interviewDate >= today)
      .sort((a, b) => a._interviewDate - b._interviewDate)[0] || null;
  }, [appliedApplications]);

  const formatInterviewCountdown = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target - now;
    if (diff < 0) return "Now";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 1) return `in ${days} days`;
    if (days === 1) return "Tomorrow";
    if (hours >= 1) return `in ${hours}h`;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins > 0) return `in ${mins}m`;
    return "Starting soon";
  };

  const roadmap = dashboard?.roadmap || {};
  const timeline = buildTimelineFromRoadmap(roadmap, stats.roadmapProgress);
  const roadmapSubtitle = roadmap?.selectedPathTitle
    ? `Current path: ${roadmap.selectedPathTitle}`
    : "Track progress from your selected roadmap";

  const confirmDropApplication = async () => {
    try {
      if (!applicationToDrop?.job?.id && !applicationToDrop?.job?._id) return;
      const jobId = applicationToDrop.job.id || applicationToDrop.job._id;
      await dispatch(withdrawApplicationAsync(jobId)).unwrap();
      await dispatch(fetchAppliedJobs());
      await loadDashboard({ silent: true });
      dispatch(addToast({ type: "info", message: "Application dropped successfully." }));
      setApplicationToDrop(null);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-28 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── KPI Cards — single compact row ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-300">Profile Completion</p>
            <BriefcaseBusiness size={16} className="text-brand-indigo" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{stats.profileCompletion}%</p>
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.profileCompletion}%` }}
              className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
            />
          </div>
        </GlassCard>
        <GlassCard className="p-3.5">
          <p className="text-sm text-slate-500 dark:text-slate-300">Recommended Jobs</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{stats.recommendedJobs}</p>
        </GlassCard>
        <GlassCard className="p-3.5">
          <p className="text-sm text-slate-500 dark:text-slate-300">Saved Jobs</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{stats.savedJobs}</p>
        </GlassCard>
        <GlassCard className="p-3.5">
          <p className="text-sm text-slate-500 dark:text-slate-300">Applied Jobs</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{stats.appliedJobs}</p>
        </GlassCard>
      </div>

      {/* ── Upcoming Interview Banner ── */}
      {upcomingInterview && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-purple-300/60 bg-gradient-to-r from-purple-50 via-indigo-50 to-cyan-50 p-4 shadow-sm dark:border-purple-700/50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-cyan-950/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300">
                <Video size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Interview</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {upcomingInterview.job?.title || "Job"} at {upcomingInterview.job?.company || "Company"}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-200">
              {formatInterviewCountdown(upcomingInterview.interview.date)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[52px] text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} className="text-purple-500" />
              {new Date(upcomingInterview.interview.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} className="text-purple-500" />
              {new Date(upcomingInterview.interview.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </span>
            <span className="inline-flex items-center gap-1 capitalize">
              📍 {upcomingInterview.interview.mode || "Online"}
            </span>
          </div>
          {upcomingInterview.interview.meetingLink && (
            <div className="mt-3 pl-[52px]">
              <a
                href={upcomingInterview.interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
              >
                <ExternalLink size={13} />
                Join Interview
              </a>
            </div>
          )}
          {upcomingInterview.interview.notes && (
            <p className="mt-2 pl-[52px] text-[11px] text-slate-500 dark:text-slate-400 italic">
              Note: {upcomingInterview.interview.notes}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Main 2-Column Layout ── */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr] items-stretch">

        {/* LEFT COLUMN (≈65%) — Primary job content */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Recommended Jobs — TOP PRIORITY */}
          <GlassCard className="p-4 flex-1 flex flex-col" hoverable={false}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recommended Jobs</h3>
              <button
                type="button"
                onClick={() => navigate(ROUTES.JOBS)}
                className="rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
              >
                View All Jobs
              </button>
            </div>
            <div className="mb-3 h-px bg-slate-200/80 dark:bg-slate-700/60" />
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {recommendations.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">No recommendations available yet.</p>
              )}
              {recommendations.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-200/80 bg-white/75 p-3.5 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/75"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{job.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-brand-indigo/10 px-2 py-1 text-xs font-semibold text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300">
                        {job.relevance}% match
                      </span>
                      <GradientButton
                        className="px-3 py-2 text-xs"
                        disabled={appliedJobIds.includes(job.id)}
                        onClick={async () => {
                          try {
                            await dispatch(applyToJobAsync(job.id)).unwrap();
                            await dispatch(fetchAppliedJobs());
                            await loadDashboard({ silent: true });
                            dispatch(addToast({ type: "success", message: "Application submitted." }));
                          } catch (error) {
                            dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
                          }
                        }}
                      >
                        {appliedJobIds.includes(job.id) ? "Applied" : "Apply"}
                      </GradientButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Applied Jobs — SECOND PRIORITY */}
          <GlassCard ref={appliedJobsRef} className={`p-4 flex-1 flex flex-col transition-all duration-500 ${highlightApplied ? "ring-2 ring-brand-indigo/60 shadow-glow" : ""}`} hoverable={false}>
            <h3 id="applied-jobs-section" className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Applied Jobs</h3>
            <div className="mb-3 h-px bg-slate-200/80 dark:bg-slate-700/60" />
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {activeAppliedApplications.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-300">
                  You have not applied to any active job yet.
                </p>
              )}
              {activeAppliedApplications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl border border-slate-200/80 bg-white/75 p-3.5 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/75"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{application.job?.title || "Job listing"}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {application.job?.company || "Unknown company"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Status: {application.status}
                        {application.appliedAt
                          ? ` • Applied on ${new Date(application.appliedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                      {(application.status === "Interview Scheduled" || application.status === "Interviewing") && application.interview?.date && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-purple-600 dark:text-purple-300">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(application.interview.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(application.interview.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                          </span>
                          <span className="capitalize">• {application.interview.mode || "Online"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(application.status === "Interview Scheduled" || application.status === "Interviewing") && application.interview?.meetingLink && (
                        <a
                          href={application.interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                          <Video size={13} />
                          Join
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={!application.canWithdraw}
                        onClick={async () => {
                          if (!application.job?.id && !application.job?._id) return;
                          setApplicationToDrop(application);
                        }}
                        className="rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/25 dark:text-rose-200"
                      >
                        <span className="inline-flex items-center gap-1">
                          <XCircle size={13} />
                          {application.canWithdraw ? "Drop Application" : "Locked"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN (≈35%) — Support content */}
        <div className="flex flex-col gap-4">
          {/* Career Roadmap — compact */}
          <RoadmapProgressCard timeline={timeline} subtitle={roadmapSubtitle} />

          {/* Tech Pulse */}
          <TechPulseCard />

          {/* Quick Actions — compact */}
          <GlassCard className="p-4" hoverable={false}>
            <h3 className="mb-2.5 text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.JOBS, { state: { showSaved: true } })}
                className="rounded-xl border border-slate-300/70 bg-white/70 px-4 py-2 text-left text-sm text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <span className="inline-flex items-center gap-2">
                  <Bookmark size={14} />
                  View saved jobs
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(fetchAppliedJobs());
                  appliedJobsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setHighlightApplied(true);
                  setTimeout(() => setHighlightApplied(false), 2000);
                }}
                className="rounded-xl border border-slate-300/70 bg-white/70 px-4 py-2 text-left text-sm text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <span className="inline-flex items-center gap-2">
                  <Send size={14} />
                  Track applications
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.STUDENT_RESUME_BUILDER)}
                className="rounded-xl border border-slate-300/70 bg-white/70 px-4 py-2 text-left text-sm text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <span className="inline-flex items-center gap-2">
                  <FileBadge2 size={14} />
                  Open resume builder
                </span>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={Boolean(applicationToDrop)}
        onClose={() => setApplicationToDrop(null)}
        onConfirm={confirmDropApplication}
        title="Drop Application?"
        description={
          applicationToDrop
            ? `You are about to withdraw your application for "${applicationToDrop.job?.title || "this job"}". Recruiters will see the status as withdrawn.`
            : ""
        }
        confirmLabel="Drop Application"
        tone="warning"
      />
    </div>
  );
};

export default StudentDashboardPage;
