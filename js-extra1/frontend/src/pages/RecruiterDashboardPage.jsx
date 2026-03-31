import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList, FileUser, Layers3, Pencil, Trash2, LayoutList, KanbanSquare, Coins, ShoppingCart, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";
import ApplicationsBarChart from "../components/charts/ApplicationsBarChart";
import ApplicantsTable from "../components/dashboard/ApplicantsTable";
import PipelineBoard from "../components/dashboard/PipelineBoard";
import StatCard from "../components/dashboard/StatCard";
import CreditPurchaseModal from "../components/dashboard/CreditPurchaseModal";
import { fetchJobs } from "../redux/slices/jobSlice";
import { addToast } from "../redux/slices/uiSlice";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import ResumeViewerModal from "../components/common/ResumeViewerModal";
import CustomSelect from "../components/common/CustomSelect";
import { getSkillIconUrl } from "../utils/skillIcons";
import { ROUTES } from "../utils/constants";

const kpiIcons = [Layers3, FileUser, ClipboardList, BarChart3];
const emptyKpis = [
  { id: "k1", label: "Active Listings", value: 0, delta: "0%" },
  { id: "k2", label: "Total Applicants", value: 0, delta: "0%" },
  { id: "k3", label: "Interviews Scheduled", value: 0, delta: "0%" },
  { id: "k4", label: "Offer Acceptance", value: 0, delta: "0%" }
];

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

const parseTagsInput = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
const FINAL_DECISION_STATUSES = new Set(["Accepted", "Rejected"]);

const RecruiterDashboardPage = () => {
  usePageTitle("Recruiter Dashboard");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicantSearch, setApplicantSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [profileLoadingId, setProfileLoadingId] = useState("");
  const [jobActionLoadingId, setJobActionLoadingId] = useState("");
  const [emailSendingId, setEmailSendingId] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [resumeModalData, setResumeModalData] = useState(null);

  // ── Credit system state ──
  const [creditBalance, setCreditBalance] = useState(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [listingsFilter, setListingsFilter] = useState("monthly");

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    formState: { isSubmitting: isEditSubmitting }
  } = useForm({
    defaultValues: {
      title: "",
      company: "",
      location: "",
      salary: "",
      salaryMax: "",
      type: "Full-time",
      remote: false,
      status: "active",
      tags: "",
      experienceRequired: "both",
      minExperience: "",
      maxExperience: ""
    }
  });

  const editJobType = watchEdit("type");
  const editJobStatus = watchEdit("status");
  const editExpRequired = watchEdit("experienceRequired");

  const loadDashboard = useCallback(
    async ({ showLoader = false, notifyError = true } = {}) => {
      if (showLoader) setLoading(true);
      try {
        const response = await apiClient.get("/dashboard/recruiter");
        setDashboard(response.data);
      } catch (error) {
        if (notifyError) {
          dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load recruiter dashboard.") }));
        }
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [dispatch]
  );

  const loadCreditBalance = useCallback(async () => {
    try {
      const res = await apiClient.get("/credits/balance");
      setCreditBalance(res.data);
    } catch {
      // Silently fail — credit card will show fallback
    }
  }, []);

  useEffect(() => {
    loadDashboard({ showLoader: true });
    loadCreditBalance();
    const intervalId = setInterval(() => {
      loadDashboard({ showLoader: false, notifyError: false });
    }, 12000);
    return () => {
      clearInterval(intervalId);
    };
  }, [loadDashboard, loadCreditBalance]);

  const openEditJobModal = (job) => {
    setEditingJob(job);
    resetEdit({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: Number(job.salary || 0),
      salaryMax: Number(job.salaryMax || 0),
      type: job.type || "Full-time",
      remote: Boolean(job.remote),
      status: job.status || "active",
      tags: Array.isArray(job.tags) ? job.tags.join(", ") : "",
      experienceRequired: job.experienceRequired || "both",
      minExperience: job.minExperience || "",
      maxExperience: job.maxExperience || ""
    });
    setEditModalOpen(true);
  };

  const onEditJobSubmit = async (data) => {
    if (!editingJob?.id) return;
    try {
      await apiClient.put(`/jobs/${editingJob.id}`, {
        title: data.title,
        company: data.company,
        location: data.location,
        salary: Number(data.salary),
        salaryMax: data.salaryMax ? Number(data.salaryMax) : 0,
        type: data.type,
        remote: Boolean(data.remote),
        status: data.status,
        tags: parseTagsInput(data.tags),
        experienceRequired: data.experienceRequired,
        minExperience: data.minExperience,
        maxExperience: data.maxExperience
      });
      dispatch(addToast({ type: "success", message: "Job listing updated." }));
      setEditModalOpen(false);
      setEditingJob(null);
      await loadDashboard({ showLoader: false });
      dispatch(fetchJobs({ sortBy: "recent" }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update job listing.") }));
    }
  };

  const handleDeleteJob = async (job) => {
    if (!job?.id) return;
    setJobToDelete(job);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete?.id) return;
    try {
      setJobActionLoadingId(jobToDelete.id);
      await apiClient.delete(`/jobs/${jobToDelete.id}`);
      if (editingJob?.id === jobToDelete.id) {
        setEditModalOpen(false);
        setEditingJob(null);
      }
      dispatch(addToast({ type: "success", message: "Job listing deleted." }));
      await loadDashboard({ showLoader: false });
      dispatch(fetchJobs({ sortBy: "recent" }));
      setJobToDelete(null);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to delete job listing.") }));
    } finally {
      setJobActionLoadingId("");
    }
  };

  const kpis = dashboard?.kpis || emptyKpis;
  const chartData = dashboard?.applicationsPerJob || [];
  const listings = dashboard?.listings || [];
  const applicantsRaw = dashboard?.applicants || [];

  const filteredListings = useMemo(() => {
    if (!listings.length) return [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let cutoff;
    if (listingsFilter === "today") {
      cutoff = startOfDay;
    } else if (listingsFilter === "weekly") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return listings.filter((job) => {
      const jobDate = new Date(job.createdAt);
      return jobDate >= cutoff;
    });
  }, [listings, listingsFilter]);

  const filteredApplicants = useMemo(() => {
    if (!applicantSearch.trim()) return applicantsRaw;
    const needle = applicantSearch.toLowerCase();
    return applicantsRaw.filter(
      (applicant) =>
        applicant.name.toLowerCase().includes(needle) || applicant.role.toLowerCase().includes(needle)
    );
  }, [applicantSearch, applicantsRaw]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      const applicant = applicantsRaw.find((item) => item.id === applicationId);
      if (!applicant) return;
      const decisionLocked = FINAL_DECISION_STATUSES.has(applicant.status);
      if (decisionLocked && status !== "Review") {
        dispatch(addToast({ type: "warning", message: "Final decision is locked. Use Withdraw Decision." }));
        return;
      }

      setStatusUpdatingId(applicationId);
      const response = await apiClient.patch(`/jobs/applications/${applicationId}/status`, { status });
      const serverMessage = response.data?.message || "";
      dispatch(
        addToast({
          type: "success",
          message: serverMessage || `Applicant marked as ${status}.`
        })
      );
      await loadDashboard({ showLoader: false });
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update applicant status.") }));
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleSendEmail = async (applicationId, decisionMessage) => {
    try {
      setEmailSendingId(applicationId);
      await apiClient.post(`/jobs/applications/${applicationId}/send-email`, {
        decisionMessage: typeof decisionMessage === "string" ? decisionMessage : ""
      });
      dispatch(addToast({ type: "success", message: "Decision email sent successfully." }));
      await loadDashboard({ showLoader: false });
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to send email.") }));
    } finally {
      setEmailSendingId("");
    }
  };

  const handleViewProfile = async (applicationId) => {
    try {
      setProfileLoadingId(applicationId);
      const response = await apiClient.get(`/jobs/applications/${applicationId}`);
      setSelectedApplication(response.data.application);
      setProfileModalOpen(true);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load applicant details.") }));
    } finally {
      setProfileLoadingId("");
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
      {/* ── Compact Control Panel ── */}
      <GlassCard className="px-4 py-2.5" hoverable={false}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Recruiter control center: applicant data auto-refreshes every 12 seconds.
          </p>
          <button
            type="button"
            onClick={() => loadDashboard({ showLoader: false })}
            className="rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            Refresh Now
          </button>
        </div>
      </GlassCard>

      {/* ── KPI Cards — single compact row ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, idx) => (
          <StatCard
            key={item.id || `${item.label}-${idx}`}
            label={item.label}
            value={item.value}
            delta={item.delta}
            icon={kpiIcons[idx]}
          />
        ))}
      </div>

      {/* ── Main 2-Column Layout ── */}
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr] items-start">
        {/* LEFT COLUMN (≈60%) — Recent Job Posts with integrated CTA */}
        <GlassCard className="p-4 flex flex-col min-w-0" hoverable={false}>
          {/* Header: Title + Filter + Post a Job CTA */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Job Posts</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                {["monthly", "weekly", "today"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setListingsFilter(filter)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
                      listingsFilter === filter
                        ? "bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {filter === "today" ? "Today" : filter === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.RECRUITER_POST_JOB)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
              >
                <Sparkles size={14} />
                Post a Job
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-3 h-px bg-slate-200/80 dark:bg-slate-700/60" />

          {/* Job Listings — constrained height with inner scroll */}
          <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 340px)" }}>
            {filteredListings.length > 0 ? (
              filteredListings.slice(0, 8).map((job) => (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-slate-200/80 bg-white/75 p-3.5 dark:border-slate-700 dark:bg-slate-900/75"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{job.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {job.location} • ₹{job.salary.toLocaleString("en-IN")}{job.salaryMax ? ` - ₹${job.salaryMax.toLocaleString("en-IN")}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          job.status === "closed"
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            : job.status === "flagged"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200"
                              : "animate-pulse-glow bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
                        }`}
                      >
                        {job.status === "closed" ? "Closed" : job.status === "flagged" ? "⚠ Flagged" : "Active"}
                      </span>
                      {job.status === "flagged" && (
                        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">Hidden from job seekers</p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300">
                        Applicants: {job.applicantsCount || 0}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.HIRING_PIPELINE.replace(":jobId", job.id))}
                      className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        <KanbanSquare size={12} />
                        Pipeline
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditJobModal(job)}
                      disabled={jobActionLoadingId === job.id}
                      className="rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 disabled:opacity-60 dark:bg-brand-indigo/20 dark:text-cyan-300"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Pencil size={12} />
                        Edit
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job)}
                      disabled={jobActionLoadingId === job.id}
                      className="rounded-lg border border-rose-300/70 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={12} />
                        {jobActionLoadingId === job.id ? "Deleting..." : "Delete"}
                      </span>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  No job posts found for the {listingsFilter} view.
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Switch to another time filter to see more recent posts.
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* RIGHT COLUMN (≈40%) — Chart + Credits stacked */}
        <div className="flex flex-col gap-4">
          {/* Applications per Job Chart */}
          {chartData.length ? (
            <ApplicationsBarChart data={chartData} />
          ) : (
            <GlassCard className="p-4" hoverable={false}>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Applications chart will appear when applicants start applying.
              </p>
            </GlassCard>
          )}

          {/* Credit Balance — compact */}
          {creditBalance && (
            <GlassCard className="p-3.5" hoverable={false}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 p-2.5 dark:from-amber-900/50 dark:to-amber-800/40">
                    <Coins size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{creditBalance.credits}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">credits remaining</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {creditBalance.canPostFree
                        ? `${creditBalance.freePostsRemaining} of ${creditBalance.freePostLimit} free posts remaining`
                        : "Free posts exhausted — using credits"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreditModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
                >
                  <ShoppingCart size={14} />
                  Buy Credits
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingJob(null);
        }}
        title="Edit Job Listing"
      >
        <form onSubmit={handleSubmitEdit(onEditJobSubmit)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="text" placeholder="Job title" className="field-input" {...registerEdit("title", { required: true })} />
            <input
              type="text"
              placeholder="Company name"
              className="field-input"
              {...registerEdit("company", { required: true })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="text" placeholder="Location" className="field-input" {...registerEdit("location", { required: true })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="number" placeholder="Min Salary (₹)" className="field-input" {...registerEdit("salary", { required: true })} />
              <input type="number" placeholder="Max Salary (₹)" className="field-input" {...registerEdit("salaryMax")} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect
              value={editJobType}
              onChange={(val) => setValueEdit("type", val)}
              options={[
                { value: "Full-time", label: "Full-time" },
                { value: "Part-time", label: "Part-time" },
                { value: "Internship", label: "Internship" },
                { value: "Contract", label: "Contract" }
              ]}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-300/70 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <input type="checkbox" {...registerEdit("remote")} className="h-4 w-4 rounded accent-brand-indigo" />
              Remote role
            </label>
          </div>

          {/* Experience Level Target (Edit) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect
              value={editExpRequired}
              onChange={(val) => setValueEdit("experienceRequired", val)}
              options={[
                { value: "both", label: "Visible to: Everyone" },
                { value: "fresher", label: "Visible to: Freshers Only" },
                { value: "experienced", label: "Visible to: Experienced Only" }
              ]}
            />
            {editExpRequired === "experienced" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  placeholder="Min Exp (yrs)"
                  className="field-input"
                  min="0"
                  {...registerEdit("minExperience")}
                />
                <input
                  type="number"
                  placeholder="Max Exp (yrs)"
                  className="field-input"
                  min="0"
                  {...registerEdit("maxExperience")}
                />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect
              value={editJobStatus}
              onChange={(val) => setValueEdit("status", val)}
              options={[
                { value: "active", label: "Active" },
                { value: "closed", label: "Closed" }
              ]}
            />
            <input
              type="text"
              className="field-input"
              placeholder="Tags (comma separated)"
              {...registerEdit("tags")}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setEditingJob(null);
              }}
              className="rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            >
              Cancel
            </button>
            <GradientButton type="submit" className="px-3 py-2 text-xs" disabled={isEditSubmitting}>
              {isEditSubmitting ? "Saving..." : "Save Changes"}
            </GradientButton>
          </div>
        </form>
      </Modal>

      <ConfirmActionModal
        isOpen={Boolean(jobToDelete)}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDeleteJob}
        loading={Boolean(jobToDelete && jobActionLoadingId === jobToDelete.id)}
        title="Delete Job Post?"
        description={
          jobToDelete
            ? `You are deleting "${jobToDelete.title}". This will also remove related applications and cannot be undone.`
            : ""
        }
        confirmLabel="Delete Post"
      />

      <Modal
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setSelectedApplication(null);
        }}
        title="Applicant Details"
        maxWidthClass="max-w-4xl"
      >
        {!selectedApplication ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading applicant details...</p>
        ) : (
          <div className="space-y-4 pb-1">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  {selectedApplication.candidate?.avatar?.dataUrl ? (
                    <img
                      src={selectedApplication.candidate.avatar.dataUrl}
                      alt={selectedApplication.candidate?.name || "Candidate"}
                      className="h-16 w-16 rounded-xl object-cover shadow-soft"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedApplication.candidate?.name || "Unnamed candidate"}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {selectedApplication.candidate?.headline || "No headline"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-brand-indigo/10 px-2 py-1 font-semibold text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300">
                        {selectedApplication.status || "Review"}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200">
                        Match {selectedApplication.matchScore || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-xl border border-slate-200/70 bg-white/80 p-3 text-xs text-slate-600 sm:min-w-[220px] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Email: </span>
                    {selectedApplication.candidate?.email || "N/A"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Location: </span>
                    {selectedApplication.candidate?.location || "N/A"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Applied: </span>
                    {formatDate(selectedApplication.appliedAt)}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Role: </span>
                    {selectedApplication.job?.title || "Unknown role"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Company: </span>
                    {selectedApplication.job?.company || "Unknown company"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/75">
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Candidate Bio</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedApplication.candidate?.bio || "No bio provided."}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/75">
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Resume and Links</p>
                {selectedApplication.resumeUrl ||
                  selectedApplication.candidate?.resumeDocument?.dataUrl ||
                  selectedApplication.candidate?.resumeUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      const url =
                        selectedApplication.resumeUrl ||
                        selectedApplication.candidate?.resumeDocument?.dataUrl ||
                        selectedApplication.candidate?.resumeUrl;
                      setResumeModalData({ url, name: selectedApplication.candidate?.name || "Candidate" });
                    }}
                    className="inline-flex items-center rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 active:scale-95 dark:bg-brand-indigo/20 dark:text-cyan-300"
                  >
                    View Resume PDF
                  </button>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No resume shared.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {["linkedin", "github", "instagram", "portfolio"].map((key) =>
                    selectedApplication.candidate?.socialLinks?.[key] ? (
                      <a
                        key={key}
                        href={selectedApplication.candidate.socialLinks[key]}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300/80 bg-white/90 px-2 py-1 font-medium text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:text-cyan-300"
                      >
                        {key}
                      </a>
                    ) : null
                  )}
                  {!selectedApplication.candidate?.socialLinks?.linkedin &&
                    !selectedApplication.candidate?.socialLinks?.github &&
                    !selectedApplication.candidate?.socialLinks?.instagram &&
                    !selectedApplication.candidate?.socialLinks?.portfolio ? (
                    <p className="text-sm text-slate-500 dark:text-slate-300">No social links provided.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/75">
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Skills</p>
              <div className="flex flex-wrap gap-2">
                {(selectedApplication.candidate?.skills || []).map((skill) => {
                  const iconUrl = getSkillIconUrl(skill);
                  return (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-medium text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                    >
                      {iconUrl && (
                        <img src={iconUrl} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" loading="lazy" />
                      )}
                      {skill}
                    </span>
                  );
                })}
                {!selectedApplication.candidate?.skills?.length && (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No skills provided.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/75">
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Experience</p>
                {(selectedApplication.candidate?.experience || []).length ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {selectedApplication.candidate.experience.map((item, idx) => (
                      <div
                        key={`${item.title || "exp"}-${item.company || "company"}-${idx}`}
                        className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70"
                      >
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {item.title || "Role not specified"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {item.company || "Company not specified"} {item.period ? `• ${item.period}` : ""}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No experience details provided.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/75">
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Education</p>
                {(selectedApplication.candidate?.education || []).length ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {selectedApplication.candidate.education.map((item, idx) => (
                      <div
                        key={`${item.degree || "degree"}-${item.institute || "institute"}-${idx}`}
                        className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70"
                      >
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {item.degree || "Degree not specified"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {item.institute || "Institute not specified"} {item.period ? `• ${item.period}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No education details provided.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/75">
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Application Message</p>
              {selectedApplication.message ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedApplication.message}</p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No application message provided.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {FINAL_DECISION_STATUSES.has(selectedApplication.status) ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApplication.id, "Review")}
                  disabled={statusUpdatingId === selectedApplication.id}
                  className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  Withdraw Decision
                </button>
              ) : (
                <>
                  <GradientButton
                    className="px-3 py-2 text-xs"
                    onClick={() => handleStatusChange(selectedApplication.id, "Shortlisted")}
                    disabled={statusUpdatingId === selectedApplication.id || selectedApplication.status === "Withdrawn"}
                  >
                    Shortlist
                  </GradientButton>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedApplication.id, "Accepted")}
                    disabled={statusUpdatingId === selectedApplication.id || selectedApplication.status === "Withdrawn"}
                    className="rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedApplication.id, "Rejected")}
                    disabled={statusUpdatingId === selectedApplication.id || selectedApplication.status === "Withdrawn"}
                    className="rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
            {selectedApplication.status === "Withdrawn" && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This candidate has withdrawn the application, so status updates are disabled.
              </p>
            )}
            {FINAL_DECISION_STATUSES.has(selectedApplication.status) && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Final decision is locked. Use Withdraw Decision to reopen this application.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Resume Viewer Modal */}
      <ResumeViewerModal
        open={!!resumeModalData}
        onClose={() => setResumeModalData(null)}
        resumeUrl={resumeModalData?.url || ""}
        candidateName={resumeModalData?.name || "Candidate"}
      />

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        onPurchaseComplete={() => loadCreditBalance()}
      />
    </div>
  );
};

export default RecruiterDashboardPage;
