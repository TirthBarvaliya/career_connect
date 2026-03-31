import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Layers3, Users2, BriefcaseBusiness, Search } from "lucide-react";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import usePageTitle from "../hooks/usePageTitle";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";
import { ROUTES } from "../utils/constants";

const statusTone = {
  Applied: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
  Review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  Shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200",
  "Interview Scheduled": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  "Interview Completed": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200",
  Interviewing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  Accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  Hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  Selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  "Offer Sent": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  Withdrawn: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const RecruiterApplicantsPage = () => {
  usePageTitle("Applicants");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState({
    summary: { totalApplicants: 0, totalJobs: 0 },
    jobs: [],
    applicants: []
  });

  const loadApplicants = useCallback(async () => {
    try {
      setLoading(true);
      setApiError("");
      const response = await apiClient.get("/recruiter/applications");
      setPayload({
        summary: response.data.summary || { totalApplicants: 0, totalJobs: 0 },
        jobs: response.data.jobs || [],
        applicants: response.data.applicants || []
      });
    } catch (error) {
      setApiError(getErrorMessage(error, "Failed to load applicants data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const filteredApplicants = useMemo(() => {
    if (!search.trim()) return payload.applicants;
    const needle = search.toLowerCase();
    return payload.applicants.filter((item) => {
      const text = `${item.name} ${item.email} ${item.appliedJob} ${item.status}`.toLowerCase();
      return text.includes(needle);
    });
  }, [payload.applicants, search]);

  const activeJobsWithApplicants = useMemo(
    () => payload.jobs.filter((job) => Number(job.applicantsCount || 0) > 0).length,
    [payload.jobs]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-60 w-full" />
        <LoadingSkeleton className="h-80 w-full" />
      </div>
    );
  }

  if (apiError) {
    return (
      <GlassCard className="p-6" hoverable={false}>
        <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{apiError}</p>
        <button
          type="button"
          onClick={loadApplicants}
          className="mt-3 rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
        >
          Retry
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4" hoverable={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-poppins text-xl font-semibold text-slate-900 dark:text-white">Applicants Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Review applicants by job and open full candidate profiles.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applicants..."
              className="field-input pl-9"
            />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCard className="p-4" hoverable={false}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Applicants</p>
            <Users2 size={16} className="text-brand-indigo dark:text-cyan-300" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{payload.summary.totalApplicants}</p>
        </GlassCard>
        <GlassCard className="p-4" hoverable={false}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Jobs With Applicants</p>
            <Layers3 size={16} className="text-brand-indigo dark:text-cyan-300" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{activeJobsWithApplicants}</p>
        </GlassCard>
        <GlassCard className="p-4" hoverable={false}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Jobs</p>
            <BriefcaseBusiness size={16} className="text-brand-indigo dark:text-cyan-300" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{payload.summary.totalJobs}</p>
        </GlassCard>
      </div>

      <GlassCard className="p-4" hoverable={false}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Job-Wise Applicant Count</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200/70 text-slate-500 dark:border-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Applicants</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payload.jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-200/60 dark:border-slate-800">
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">{job.title}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{job.company || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{job.applicantsCount || 0}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.HIRING_PIPELINE.replace(":jobId", job.id))}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-2.5 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
                    >
                      <Eye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!payload.jobs.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No jobs found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="p-4" hoverable={false}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Applicant List</h3>
          <GradientButton type="button" onClick={loadApplicants} className="px-3 py-2 text-xs">
            Refresh
          </GradientButton>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200/70 text-slate-500 dark:border-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Applied Job</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((applicant) => (
                <tr key={applicant.id} className="border-b border-slate-200/60 dark:border-slate-800">
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">{applicant.name}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{applicant.email || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{applicant.appliedJob}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatDate(applicant.appliedAt)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusTone[applicant.status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {applicant.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(ROUTES.RECRUITER_APPLICANT_PROFILE.replace(":id", applicant.id))
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-2.5 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
                    >
                      <Eye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredApplicants.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No applicants match your current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default RecruiterApplicantsPage;
