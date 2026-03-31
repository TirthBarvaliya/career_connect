import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";

const PIPELINE_COLUMNS = [
    { id: "Applied", label: "Applied", bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800/50" },
    { id: "Shortlisted", label: "Shortlisted", bg: "bg-cyan-50 dark:bg-cyan-900/10", border: "border-cyan-200 dark:border-cyan-800/50" },
    { id: "Interview Scheduled", label: "Interviewed", bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800/50" },
    { id: "Selected", label: "Selected", bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800/50" },
    { id: "Rejected", label: "Rejected", bg: "bg-rose-50 dark:bg-rose-900/10", border: "border-rose-200 dark:border-rose-800/50" }
];

export default function PipelineBoard({ applicants, onViewProfile }) {
    const grouped = useMemo(() => {
        const defaultGroups = {
            Applied: [],
            Shortlisted: [],
            "Interview Scheduled": [],
            Selected: [],
            Rejected: []
        };

        applicants.forEach((appl) => {
            // Map statuses to appropriate pipeline columns
            let col = "Applied";
            if (appl.status === "Review" || appl.status === "Applied") col = "Applied";
            else if (appl.status === "Shortlisted") col = "Shortlisted";
            else if (["Interviewing", "Interview Scheduled", "Interview Completed"].includes(appl.status)) col = "Interview Scheduled";
            else if (["Selected", "Accepted", "Offer Sent", "Hired"].includes(appl.status)) col = "Selected";
            else if (appl.status === "Rejected" || appl.status === "Withdrawn") col = "Rejected";

            if (!defaultGroups[col]) defaultGroups[col] = [];
            defaultGroups[col].push(appl);
        });

        return defaultGroups;
    }, [applicants]);

    return (
        <div className="w-full overflow-hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                {PIPELINE_COLUMNS.map((col) => {
                    const columnApplicants = grouped[col.id];
                    return (
                        <div
                            key={col.id}
                            className={`flex h-[600px] w-80 shrink-0 snap-start flex-col rounded-2xl border ${col.border} ${col.bg} p-3`}
                        >
                            <div className="mb-3 flex items-center justify-between px-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{col.label}</h4>
                                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/60 px-2 text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-800/60 dark:text-slate-300">
                                    {columnApplicants.length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                <AnimatePresence>
                                    {columnApplicants.map((applicant) => (
                                        <motion.div
                                            key={applicant.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group relative cursor-pointer rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:border-brand-indigo/30 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/90"
                                            onClick={() => onViewProfile?.(applicant.id)}
                                        >
                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                <p className="line-clamp-1 font-semibold text-slate-900 dark:text-slate-100">
                                                    {applicant.name}
                                                </p>
                                                <span className="shrink-0 rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    {applicant.score}%
                                                </span>
                                            </div>
                                            <p className="line-clamp-1 text-xs text-brand-indigo dark:text-cyan-400">
                                                {applicant.role}
                                            </p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    {new Date(applicant.appliedAt).toLocaleDateString()}
                                                </p>
                                                {applicant.emailSent && (
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {columnApplicants.length === 0 && (
                                    <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-200/50 bg-white/30 text-xs text-slate-400 dark:border-slate-700/50 dark:bg-slate-800/30">
                                        No candidates
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
