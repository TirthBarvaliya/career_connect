import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, Bookmark, Briefcase } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import JobCard from "../components/jobs/JobCard";
import FilterDrawer, { SALARY_RANGES } from "../components/jobs/FilterDrawer";
import CustomSelect from "../components/common/CustomSelect";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import useDebounce from "../hooks/useDebounce";
import usePageTitle from "../hooks/usePageTitle";
import {
  applyToJobAsync,
  fetchJobs,
  fetchSavedJobs,
  saveJobAsync,
  unsaveJobAsync
} from "../redux/slices/jobSlice";
import { addToast } from "../redux/slices/uiSlice";
import getErrorMessage from "../utils/errorMessage";
import { ROUTES, USER_ROLES } from "../utils/constants";

const JobListingsPage = () => {
  usePageTitle("Job Listings");
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(!!location.state?.showSaved);
  const [filters, setFilters] = useState({
    location: "",
    remoteOnly: false,
    salaryRanges: [],
    type: "",
    sortBy: "relevance"
  });

  const debouncedQuery = useDebounce(query, 350);
  const dispatch = useDispatch();

  const { jobs, status: jobStatus } = useSelector((state) => state.jobs);
  const savedIds = useSelector((state) => state.jobs.savedJobIds);
  const appliedIds = useSelector((state) => state.jobs.appliedJobIds);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isRecruiter = user?.role === USER_ROLES.RECRUITER;

  useEffect(() => {
    const salaryQuery = {};
    if (filters.salaryRanges.length) {
      const selected = SALARY_RANGES.filter((r) => filters.salaryRanges.includes(r.label));
      salaryQuery.salaryMin = Math.min(...selected.map((r) => r.min));
      salaryQuery.salaryMax = Math.max(...selected.map((r) => r.max));
    }
    dispatch(
      fetchJobs({
        q: debouncedQuery || undefined,
        location: filters.location || undefined,
        remoteOnly: filters.remoteOnly || undefined,
        ...salaryQuery,
        type: filters.type || undefined,
        sortBy: filters.sortBy
      })
    );
  }, [debouncedQuery, dispatch, filters]);

  // Fetch saved job ids on mount so the saved filter works
  useEffect(() => {
    dispatch(fetchSavedJobs());
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [dispatch]);

  const isLoading = jobStatus === "loading";
  const filteredJobs = useMemo(() => {
    if (!showSavedOnly) return jobs;
    return jobs.filter((job) => savedIds.includes(job.id));
  }, [jobs, savedIds, showSavedOnly]);

  const ensureAuth = () => {
    if (isAuthenticated) return true;
    dispatch(addToast({ type: "warning", message: "Please login to continue." }));
    navigate(ROUTES.LOGIN, { state: { from: ROUTES.JOBS } });
    return false;
  };

  const getRecruiterId = (job) => {
    if (!job?.recruiter) return "";
    if (typeof job.recruiter === "string") return job.recruiter;
    if (typeof job.recruiter === "object") return String(job.recruiter.id || job.recruiter._id || "");
    return "";
  };

  const isOwnListing = (job) => {
    if (!isRecruiter || !user?.id) return false;
    return String(getRecruiterId(job)) === String(user.id);
  };

  return (
    <div className="container-4k py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-poppins text-3xl font-semibold text-slate-900 dark:text-white">Find Your Next Opportunity</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Search roles, apply filters, and track saved or applied jobs.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 lg:hidden"
          onClick={() => setMobileFilterOpen(true)}
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>
      </div>

      {isRecruiter && (
        <div className="glass-panel mb-4 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Recruiter mode is active. Application actions are disabled here. Use your dashboard to manage listings and applicants.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <FilterDrawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} filters={filters} setFilters={setFilters} />

        <div>
          <div className="glass-panel relative z-10 mb-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search role, company, or skill..."
                className="field-input"
              />
              <CustomSelect
                value={filters.sortBy}
                onChange={(val) => setFilters((prev) => ({ ...prev, sortBy: val }))}
                options={[
                  { value: "relevance", label: "Sort: Relevance" },
                  { value: "recent", label: "Sort: Recent" },
                  { value: "salaryHigh", label: "Salary: High to Low" },
                  { value: "salaryLow", label: "Salary: Low to High" }
                ]}
              />
            </div>
          </div>

          {/* Saved filter indicator */}
          {showSavedOnly && (
            <div className="glass-panel mb-4 flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo dark:text-cyan-300">
                <Bookmark size={15} className="fill-current" />
                Showing Saved Jobs Only ({filteredJobs.length})
              </span>
              <button
                type="button"
                onClick={() => setShowSavedOnly(false)}
                className="rounded-lg border border-slate-300/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Show All Jobs
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/50 dark:bg-slate-900/80 sm:p-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700 sm:h-14 sm:w-14" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-5 w-3/5 rounded-lg bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3.5 w-2/5 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="h-7 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <div className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <div className="h-7 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="h-6 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200/70 bg-white p-12 text-center dark:border-slate-700/50 dark:bg-slate-900/80">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Briefcase size={28} className="text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="font-poppins text-lg font-semibold text-slate-700 dark:text-slate-200">No jobs found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {showSavedOnly
                  ? "You haven't saved any jobs yet. Browse jobs and save the ones you like."
                  : "No jobs match your current filters. Try adjusting your search or broadening your filter criteria."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedIds.includes(job.id)}
                  isApplied={appliedIds.includes(job.id)}
                  showSave={!isRecruiter}
                  recruiterMode={isRecruiter}
                  actionLabel={
                    isRecruiter
                      ? isOwnListing(job)
                        ? `Applicants${job.applicantsCount ? ` (${job.applicantsCount})` : ""}`
                        : "Recruiter View"
                      : undefined
                  }
                  actionDisabled={isRecruiter && !isOwnListing(job)}
                  onSaveToggle={async () => {
                    if (!ensureAuth()) return;
                    try {
                      if (savedIds.includes(job.id)) {
                        await dispatch(unsaveJobAsync(job.id)).unwrap();
                        dispatch(addToast({ type: "info", message: "Job removed from saved list." }));
                      } else {
                        await dispatch(saveJobAsync(job.id)).unwrap();
                        dispatch(addToast({ type: "success", message: "Job saved successfully." }));
                      }
                    } catch (error) {
                      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
                    }
                  }}
                  onApply={async () => {
                    if (isRecruiter) {
                      if (isOwnListing(job)) {
                        navigate(ROUTES.RECRUITER_DASHBOARD);
                      }
                      return;
                    }
                    if (!ensureAuth()) return;
                    if (user?.role !== USER_ROLES.STUDENT) {
                      dispatch(addToast({ type: "warning", message: "Only job seeker accounts can apply to jobs." }));
                      return;
                    }
                    try {
                      await dispatch(applyToJobAsync(job.id)).unwrap();
                      dispatch(addToast({ type: "success", message: "Application submitted." }));
                    } catch (error) {
                      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListingsPage;
