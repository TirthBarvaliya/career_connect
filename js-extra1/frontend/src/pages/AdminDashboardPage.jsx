import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Briefcase, FileText, Building2,
  ShieldBan, ShieldCheck, Trash2, Flag, FlagOff,
  Search, ChevronLeft, ChevronRight, AlertTriangle
} from "lucide-react";
import GlassCard from "../components/common/GlassCard";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import { useDispatch } from "react-redux";
import { addToast } from "../redux/slices/uiSlice";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";

const TABS = [
  { key: "users", label: "Users", icon: Users },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "recruiters", label: "Recruiters", icon: Building2 }
];

const StatCard = ({ label, value, icon: Icon, tone = "indigo" }) => {
  const toneMap = {
    indigo: "bg-brand-indigo/10 text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300",
    cyan: "bg-brand-cyan/10 text-brand-cyan dark:bg-brand-cyan/20 dark:text-brand-cyan",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-xl p-2 ${toneMap[tone] || toneMap.indigo}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </GlassCard>
  );
};

const AdminDashboardPage = () => {
  usePageTitle("Admin Panel");
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data
  const [users, setUsers] = useState({ items: [], total: 0, pages: 1 });
  const [jobs, setJobs] = useState({ items: [], total: 0, pages: 1 });

  // Action state
  const [actionLoading, setActionLoading] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);

  // ── Load stats ──
  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.get("/admin/stats");
      setStats(res.data);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load stats.") }));
    }
  }, [dispatch]);

  // ── Load users ──
  const loadUsers = useCallback(async (p = 1, q = "") => {
    try {
      const roleFilter = activeTab === "recruiters" ? "&role=recruiter" : "";
      const res = await apiClient.get(`/admin/users?page=${p}&limit=15&search=${encodeURIComponent(q)}${roleFilter}`);
      setUsers({ items: res.data.users, total: res.data.total, pages: res.data.pages });
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load users.") }));
    }
  }, [dispatch, activeTab]);

  // ── Load jobs ──
  const loadJobs = useCallback(async (p = 1, q = "") => {
    try {
      const res = await apiClient.get(`/admin/jobs?page=${p}&limit=15&search=${encodeURIComponent(q)}`);
      setJobs({ items: res.data.jobs, total: res.data.total, pages: res.data.pages });
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load jobs.") }));
    }
  }, [dispatch]);

  // ── Initial load ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadStats();
      setLoading(false);
    };
    init();
  }, [loadStats]);

  // ── Tab / search / page change ──
  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "jobs") {
      loadJobs(page, search);
    } else {
      loadUsers(page, search);
    }
  }, [activeTab, page, search, loadUsers, loadJobs]);

  // ── Actions ──
  const handleBlockUser = async (userId) => {
    try {
      setActionLoading(userId);
      const res = await apiClient.patch(`/admin/users/${userId}/block`);
      dispatch(addToast({ type: "success", message: res.data.message }));
      await loadUsers(page, search);
      await loadStats();
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      setActionLoading("");
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      setActionLoading(userId);
      const res = await apiClient.patch(`/admin/users/${userId}/unblock`);
      dispatch(addToast({ type: "success", message: res.data.message }));
      await loadUsers(page, search);
      await loadStats();
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      setActionLoading("");
    }
  };

  const confirmDeleteUser = async () => {
    if (!confirmModal?.id) return;
    try {
      setActionLoading(confirmModal.id);
      const res = await apiClient.delete(`/admin/users/${confirmModal.id}`);
      dispatch(addToast({ type: "success", message: res.data.message }));
      setConfirmModal(null);
      await loadUsers(page, search);
      await loadStats();
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      setActionLoading("");
    }
  };

  const handleFlagJob = async (jobId) => {
    try {
      setActionLoading(jobId);
      const res = await apiClient.patch(`/admin/jobs/${jobId}/flag`);
      dispatch(addToast({ type: "success", message: res.data.message }));
      await loadJobs(page, search);
      await loadStats();
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      setActionLoading("");
    }
  };

  const confirmDeleteJob = async () => {
    if (!confirmModal?.id) return;
    try {
      setActionLoading(confirmModal.id);
      const res = await apiClient.delete(`/admin/jobs/${confirmModal.id}`);
      dispatch(addToast({ type: "success", message: res.data.message }));
      setConfirmModal(null);
      await loadJobs(page, search);
      await loadStats();
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      setActionLoading("");
    }
  };

  const totalPages = activeTab === "jobs" ? jobs.pages : users.pages;

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── KPI Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} tone="indigo" />
        <StatCard label="Total Jobs" value={stats?.totalJobs ?? 0} icon={Briefcase} tone="cyan" />
        <StatCard label="Applications" value={stats?.totalApplications ?? 0} icon={FileText} tone="emerald" />
        <StatCard label="Recruiters" value={stats?.totalRecruiters ?? 0} icon={Building2} tone="rose" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr] items-start">
        {/* LEFT — Tabbed Tables */}
        <GlassCard className="p-4 min-w-0" hoverable={false}>
          {/* Tabs */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${activeTab}...`}
                className="w-full rounded-xl border border-slate-300/70 bg-white/80 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-brand-indigo sm:min-w-[220px] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mb-3 h-px bg-slate-200/80 dark:bg-slate-700/60" />

          {/* Table Content */}
          <div className="overflow-x-auto">
            {activeTab === "jobs" ? (
              /* ── Jobs Table ── */
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-700/60">
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Title</th>
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Company</th>
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Recruiter</th>
                    <th className="pb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No jobs found.
                      </td>
                    </tr>
                  ) : (
                    jobs.items.map((job) => (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-slate-100/80 dark:border-slate-800/60"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{job.title}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{job.company}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            job.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
                            : job.status === "flagged" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200"
                            : job.status === "closed" ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200"
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">{job.recruiterName}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFlagJob(job.id)}
                              disabled={actionLoading === job.id}
                              className="rounded-lg border border-amber-300/70 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
                            >
                              <span className="inline-flex items-center gap-1">
                                {job.status === "flagged" ? <FlagOff size={11} /> : <Flag size={11} />}
                                {job.status === "flagged" ? "Unflag" : "Flag"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ type: "job", id: job.id, name: job.title })}
                              disabled={actionLoading === job.id}
                              className="rounded-lg border border-rose-300/70 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Trash2 size={11} />
                                Delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* ── Users / Recruiters Table ── */
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-700/60">
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Name</th>
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Email</th>
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Role</th>
                    <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    {activeTab === "recruiters" && (
                      <th className="pb-2.5 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Company</th>
                    )}
                    <th className="pb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.items.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "recruiters" ? 6 : 5} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No {activeTab} found.
                      </td>
                    </tr>
                  ) : (
                    users.items.map((u) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-slate-100/80 dark:border-slate-800/60"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{u.name}</td>
                        <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">{u.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            u.role === "recruiter"
                              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-200"
                              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        {activeTab === "recruiters" && (
                          <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">{u.companyName || "—"}</td>
                        )}
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            {u.status === "active" ? (
                              <button
                                type="button"
                                onClick={() => handleBlockUser(u.id)}
                                disabled={actionLoading === u.id}
                                className="rounded-lg border border-amber-300/70 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <ShieldBan size={11} />
                                  Block
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUnblockUser(u.id)}
                                disabled={actionLoading === u.id}
                                className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <ShieldCheck size={11} />
                                  Unblock
                                </span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ type: "user", id: u.id, name: u.name })}
                              disabled={actionLoading === u.id}
                              className="rounded-lg border border-rose-300/70 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Trash2 size={11} />
                                Delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="inline-flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-300/70 bg-white/80 p-1.5 text-slate-600 transition hover:border-brand-indigo hover:text-brand-indigo disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-300/70 bg-white/80 p-1.5 text-slate-600 transition hover:border-brand-indigo hover:text-brand-indigo disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* RIGHT — Analytics & Quick Info */}
        <div className="flex flex-col gap-4">
          {/* System Summary */}
          <GlassCard className="p-4" hoverable={false}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">System Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <ShieldBan size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Blocked Users</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats?.blockedUsers ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <Flag size={14} className="text-rose-600 dark:text-rose-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Flagged Jobs</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats?.flaggedJobs ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Total Recruiters</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats?.totalRecruiters ?? 0}</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Info */}
          <GlassCard className="p-4" hoverable={false}>
            <h3 className="mb-2.5 text-lg font-semibold text-slate-900 dark:text-white">Admin Notes</h3>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>• Block users to prevent login without deleting their data.</p>
              <p>• Flag suspicious jobs for review. Flagged jobs remain visible but marked.</p>
              <p>• Deleting a user removes all their jobs and applications permanently.</p>
              <p>• Admin accounts cannot be blocked or deleted from this panel.</p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmActionModal
        isOpen={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.type === "job" ? confirmDeleteJob : confirmDeleteUser}
        loading={Boolean(confirmModal && actionLoading === confirmModal.id)}
        title={confirmModal?.type === "job" ? "Delete Job?" : "Delete User?"}
        description={
          confirmModal
            ? confirmModal.type === "job"
              ? `Permanently delete "${confirmModal.name}" and all associated applications?`
              : `Permanently delete user "${confirmModal.name}" and all their data (jobs, applications)?`
            : ""
        }
        confirmLabel={confirmModal?.type === "job" ? "Delete Job" : "Delete User"}
      />
    </div>
  );
};

export default AdminDashboardPage;
