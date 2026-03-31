import { motion } from "framer-motion";
import { FileText, Type, ListChecks, Paintbrush, LayoutTemplate, AlertCircle } from "lucide-react";

const getCategoryDetails = (category) => {
  switch (category.toLowerCase()) {
    case "content":
      return { icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
    case "format":
      return { icon: LayoutTemplate, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" };
    case "skills":
      return { icon: ListChecks, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    case "style":
      return { icon: Paintbrush, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    case "sections":
      return { icon: Type, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    default:
      return { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" };
  }
};

const ImprovementCard = ({ improvement, index }) => {
  const { category, issue, fix } = improvement;
  const { icon: Icon, color, bg, border } = getCategoryDetails(category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className={`glass-card relative overflow-hidden flex items-start gap-4 border p-4 transition-all hover:shadow-md ${border} dark:bg-slate-900/40`}
    >
      {/* Category Icon */}
      <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
            {category}
          </span>
        </div>

        {/* Issue */}
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {issue}
        </p>

        {/* Fix Suggestion */}
        <div className="rounded-lg bg-green-500/5 px-3 py-2 text-xs text-slate-600 border border-green-500/10 dark:text-slate-300">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Fix Applied: </span>
          {fix}
        </div>
      </div>
    </motion.div>
  );
};

export default ImprovementCard;
