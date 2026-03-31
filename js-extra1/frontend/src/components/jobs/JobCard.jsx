import { motion } from "framer-motion";
import {
  Bookmark, BookmarkCheck, MapPin, Clock3, WalletCards,
  Building2, Briefcase, Wifi, ChevronRight, Sparkles
} from "lucide-react";

/* ── colour helpers for job-type badges ── */
const TYPE_STYLES = {
  "Full-time": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  "Part-time": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  "Internship": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  "Contract": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
};

/* ── experience badge styles ── */
const EXP_STYLES = {
  "fresher": { label: "Fresher", style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  "experienced": { label: "Experienced", style: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" },
  "both": { label: "Fresher / Experienced", style: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800" }
};

/* ── format salary ── */
const formatSalary = (min, max) => {
  const fmt = (n) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n.toLocaleString("en-IN")}`;
  };
  if (max && max > min) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min);
};

/* ══════════════════════════════════════════════════════
   JobCard Component
   ══════════════════════════════════════════════════════ */
const JobCard = ({
  job,
  isSaved,
  isApplied,
  onSaveToggle,
  onApply,
  showSave = true,
  actionLabel,
  actionDisabled = false,
  recruiterMode = false
}) => {
  const primaryLabel = actionLabel || (isApplied ? "Applied" : "Apply Now");
  const disablePrimary = actionDisabled || (!onApply && !isApplied) || (isApplied && !actionLabel);
  const typeStyle = TYPE_STYLES[job.type] || TYPE_STYLES["Full-time"];
  const expInfo = job.experienceRequired ? EXP_STYLES[job.experienceRequired] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all dark:border-slate-700/50 dark:bg-slate-900/80 sm:p-6"
    >
      {/* ── Decorative accent (top-left glow on hover) ── */}
      <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-brand-indigo/0 blur-2xl transition-all duration-500 group-hover:bg-brand-indigo/10 dark:group-hover:bg-cyan-500/10" />

      {/* ── Row 1: Title + Company ── */}
      <div className="min-w-0">
        <h3 className="truncate font-poppins text-lg font-semibold text-slate-900 dark:text-white">
          {job.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500 dark:text-slate-400">
          <Building2 size={13} className="shrink-0" />
          {job.company}
        </p>
      </div>

      {/* ── Row 2: Meta info pills ── */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Location */}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <MapPin size={12} className="text-slate-400 dark:text-slate-500" />
          {job.location}
        </span>

        {/* Job Type */}
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${typeStyle}`}>
          <Briefcase size={12} />
          {job.type}
        </span>

        {/* Salary */}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <WalletCards size={12} className="text-slate-400 dark:text-slate-500" />
          {formatSalary(job.salary, job.salaryMax)}
        </span>

        {/* Remote */}
        {job.remote && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Wifi size={12} />
            Remote
          </span>
        )}

        {/* Experience Required (Fresher / Experienced) */}
        {expInfo && (
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${expInfo.style}`}>
            {expInfo.label}
          </span>
        )}

        {/* Posted time */}
        {job.postedAt && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock3 size={11} />
            {job.postedAt}
          </span>
        )}

        {/* Recruiter badge */}
        {recruiterMode && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
            <Sparkles size={12} />
            Recruiter View
          </span>
        )}
      </div>

      {/* ── Row 3: Skills / Tags ── */}
      {job.tags && job.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gradient-to-r from-brand-indigo/[0.06] to-brand-cyan/[0.06] px-3 py-1 text-xs font-medium text-brand-indigo ring-1 ring-brand-indigo/15 dark:from-cyan-500/10 dark:to-indigo-500/10 dark:text-cyan-300 dark:ring-cyan-500/20"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 6 && (
            <span className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">
              +{job.tags.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* ── Row 4: Actions (Apply + Save side by side) ── */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        {/* Apply / Primary action */}
        <button
          type="button"
          onClick={onApply}
          disabled={disablePrimary}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
            isApplied && !actionLabel
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : disablePrimary
                ? "border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                : "bg-gradient-to-r from-brand-indigo to-brand-cyan text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          }`}
        >
          {isApplied && !actionLabel ? "✓ Applied" : primaryLabel}
          {!isApplied && !actionLabel && !disablePrimary && <ChevronRight size={14} />}
        </button>

        {/* Save button (always visible, proper size) */}
        {showSave && (
          <button
            type="button"
            onClick={onSaveToggle}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
              isSaved
                ? "border-brand-indigo/30 bg-brand-indigo/10 text-brand-indigo dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-400"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-indigo/30 hover:bg-brand-indigo/5 hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:text-cyan-400"
            }`}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {isSaved ? "Saved" : "Save Job"}
          </button>
        )}

        {/* Experience years info (right side) */}
        {(job.minExperience > 0 || job.maxExperience > 0) && (
          <span className="ml-auto hidden text-xs text-slate-400 dark:text-slate-500 sm:inline-flex sm:items-center sm:gap-1">
            <Briefcase size={11} />
            {job.minExperience}–{job.maxExperience} yrs exp
          </span>
        )}
      </div>
    </motion.article>
  );
};

export default JobCard;
