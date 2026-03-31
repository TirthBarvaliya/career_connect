import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Coins, ShoppingCart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";
import CustomSelect from "../components/common/CustomSelect";
import CreditPurchaseModal from "../components/dashboard/CreditPurchaseModal";
import { createJobAsync, fetchJobs } from "../redux/slices/jobSlice";
import { addToast } from "../redux/slices/uiSlice";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import { ROUTES } from "../utils/constants";

const parseTagsInput = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);

const PostJobPage = () => {
  usePageTitle("Post a Job");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [creditBalance, setCreditBalance] = useState(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      title: "",
      location: "",
      salary: "",
      salaryMax: "",
      type: "Full-time",
      remote: true,
      tags: "",
      experienceRequired: "both",
      minExperience: "",
      maxExperience: ""
    }
  });

  const postJobType = watch("type");
  const postExpRequired = watch("experienceRequired");

  const loadCreditBalance = useCallback(async () => {
    try {
      const res = await apiClient.get("/credits/balance");
      setCreditBalance(res.data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadCreditBalance();
  }, [loadCreditBalance]);

  const onSubmit = async (data) => {
    try {
      await dispatch(
        createJobAsync({
          ...data,
          company: user?.companyName || user?.name || "Company",
          salary: Number(data.salary),
          salaryMax: data.salaryMax ? Number(data.salaryMax) : 0,
          level: "Mid",
          tags: parseTagsInput(data.tags)
        })
      ).unwrap();
      dispatch(fetchJobs({ sortBy: "recent" }));
      await loadCreditBalance();
      dispatch(addToast({ type: "success", message: "Job listing posted successfully!" }));
      reset();
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to post job.");
      if (msg.toLowerCase().includes("insufficient credits")) {
        dispatch(addToast({ type: "warning", message: "No credits remaining. Purchase credits to post more jobs." }));
        setCreditModalOpen(true);
      } else {
        dispatch(addToast({ type: "error", message: msg }));
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Back to dashboard */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.RECRUITER_DASHBOARD)}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/60 hover:text-brand-indigo dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-cyan-300"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Credit Balance Card */}
      {creditBalance && (
        <GlassCard className="p-4" hoverable={false}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 p-3 dark:from-amber-900/50 dark:to-amber-800/40">
                <Coins size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{creditBalance.credits}</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">credits remaining</span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
            >
              <ShoppingCart size={16} />
              Buy Credits
            </button>
          </div>
        </GlassCard>
      )}

      {/* Post Job Form */}
      <GlassCard className="p-6 sm:p-8" hoverable={false}>
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Post a New Job</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Job Title</label>
              <input type="text" placeholder="e.g. Senior React Developer" className="field-input" {...register("title", { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Location</label>
              <input type="text" placeholder="e.g. Mumbai, Remote" className="field-input" {...register("location", { required: true })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Salary Range (₹)</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <input type="number" placeholder="Min Salary" className="field-input" {...register("salary", { required: true })} />
                <input type="number" placeholder="Max Salary" className="field-input" {...register("salaryMax")} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Job Type</label>
              <CustomSelect
                value={postJobType}
                onChange={(val) => setValue("type", val)}
                options={[
                  { value: "Full-time", label: "Full-time" },
                  { value: "Part-time", label: "Part-time" },
                  { value: "Internship", label: "Internship" },
                  { value: "Contract", label: "Contract" }
                ]}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Required Skills</label>
              <input
                type="text"
                placeholder="React, Node.js, MongoDB (comma separated)"
                className="field-input"
                {...register("tags")}
              />
            </div>
            <div className="flex items-end">
              <label className="flex w-full items-center gap-2 rounded-xl border border-slate-300/70 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <input type="checkbox" {...register("remote")} className="h-4 w-4 rounded accent-brand-indigo" />
                Remote role
              </label>
            </div>
          </div>

          {/* Experience Level Target */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Visibility</label>
              <CustomSelect
                value={postExpRequired}
                onChange={(val) => setValue("experienceRequired", val)}
                options={[
                  { value: "both", label: "Visible to: Everyone" },
                  { value: "fresher", label: "Visible to: Freshers Only" },
                  { value: "experienced", label: "Visible to: Experienced Only" }
                ]}
              />
            </div>
            {postExpRequired === "experienced" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Experience Range (years)</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    placeholder="Min Exp"
                    className="field-input"
                    min="0"
                    {...register("minExperience")}
                  />
                  <input
                    type="number"
                    placeholder="Max Exp"
                    className="field-input"
                    min="0"
                    {...register("maxExperience")}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <GradientButton type="submit" className="px-6 py-2.5 text-sm" disabled={isSubmitting}>
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                {isSubmitting ? "Posting..." : "Post Job"}
              </span>
            </GradientButton>
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl border border-slate-300/70 bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </form>
      </GlassCard>

      <CreditPurchaseModal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        onPurchaseComplete={() => loadCreditBalance()}
      />
    </div>
  );
};

export default PostJobPage;
