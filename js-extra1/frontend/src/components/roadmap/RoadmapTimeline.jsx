import { motion } from "framer-motion";
import { BadgeCheck, ChevronDown, LockKeyhole, PlayCircle } from "lucide-react";

const resourceTone = {
  documentation: "bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-200",
  video: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200",
  article: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-100",
  practice: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
};

const RoadmapTimeline = ({
  paths = [],
  activePathId,
  activePathTitle,
  steps = [],
  expandedStepIds = [],
  updatingSubStepId = "",
  onPathChange,
  onToggleStep,
  onSubStepToggle,
  registerSubStepRef
}) => {
  if (!paths.length) {
    return (
      <div className="glass-panel p-5">
        <p className="text-sm text-slate-500 dark:text-slate-300">No roadmap data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Career Paths
          </h3>
          <span className="rounded-full bg-slate-200/70 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {paths.length} options
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {paths.map((path) => {
            const isActive = path.id === activePathId;
            return (
              <button
                type="button"
                key={path.id}
                onClick={() => onPathChange(path)}
                className={`min-w-[190px] shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-transparent bg-gradient-to-r from-brand-indigo to-brand-cyan text-white shadow-glow"
                    : "border-slate-200/70 bg-white/75 text-slate-700 hover:border-brand-indigo/35 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-brand-cyan/50 dark:hover:bg-slate-900"
                }`}
              >
                <p className="text-sm font-semibold">{path.title}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
                  <span className={isActive ? "text-white/85" : "text-slate-500 dark:text-slate-300"}>Progress</span>
                  <span>{path.progressPercentage}%</span>
                </div>
                <div
                  className={`mt-2 h-1.5 rounded-full ${
                    isActive ? "bg-white/30" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <div
                    className={`h-full rounded-full ${
                      isActive ? "bg-white" : "bg-gradient-to-r from-brand-indigo to-brand-cyan"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, Number(path.progressPercentage || 0)))}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-5 sm:p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{activePathTitle} Roadmap</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Complete at least 70% of a step to unlock the next step.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {steps.map((step, index) => {
            const expanded = expandedStepIds.includes(step.id);
            const lockReason = "Complete current step to unlock";
            const stepNumber = step.order || index + 1;
            const stepTone =
              step.completion >= 100
                ? "from-emerald-500 to-green-500"
                : step.unlocked
                  ? "from-amber-500 to-orange-500"
                  : "from-slate-400 to-slate-500";
            const railTone =
              step.completion >= 100
                ? "bg-gradient-to-b from-emerald-500/80 to-emerald-300/40"
                : step.unlocked
                  ? "bg-gradient-to-b from-brand-indigo/70 to-brand-cyan/40"
                  : "bg-slate-300/80 dark:bg-slate-700";

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
                  step.unlocked
                    ? "border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                    : "border-slate-200/70 bg-slate-100/75 opacity-75 dark:border-slate-700 dark:bg-slate-900/45"
                }`}
                title={step.unlocked ? "" : lockReason}
              >
                <span className={`absolute left-0 top-0 h-full w-1 ${railTone}`} />

                <button
                  type="button"
                  onClick={() => {
                    if (!step.unlocked) return;
                    onToggleStep(step.id);
                  }}
                  className="w-full text-left"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r ${stepTone} text-xs font-bold text-white shadow-sm`}
                      >
                        {stepNumber}
                      </span>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Step {stepNumber}
                        </p>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">{step.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-200/80 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {step.estimatedHours}h
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          step.unlocked
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {step.unlocked ? <PlayCircle size={12} /> : <LockKeyhole size={12} />}
                        {step.unlocked ? "Unlocked" : "Locked"}
                      </span>
                      <span className="rounded-full bg-brand-indigo/10 px-2 py-1 text-xs font-semibold text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300">
                        {step.completion}%
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-500 transition ${expanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-emerald"
                      initial={{ width: 0 }}
                      animate={{ width: `${step.completion}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </button>

                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 space-y-3"
                  >
                    {(step.subSteps || []).map((subStep) => (
                      <div
                        key={subStep.id}
                        ref={(node) => registerSubStepRef(subStep.id, node)}
                        className="rounded-2xl border border-slate-200/70 bg-white/90 p-3 transition hover:border-brand-indigo/35 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-brand-cyan/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex flex-1 cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(subStep.completed)}
                              disabled={!step.unlocked || updatingSubStepId === subStep.id}
                              onChange={() => onSubStepToggle(step, subStep, !subStep.completed)}
                              className="mt-1 h-4 w-4 rounded accent-brand-indigo"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{subStep.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-300">{subStep.description}</p>
                            </div>
                          </label>
                          {subStep.completed && (
                            <motion.span
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
                            >
                              <BadgeCheck size={12} />
                              Done
                            </motion.span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(subStep.resources || []).map((resource) => (
                            <a
                              key={`${subStep.id}-${resource.url}`}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-200/70 px-2 py-1 text-xs text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:text-slate-200 dark:hover:text-cyan-300"
                            >
                              <span
                                className={`mr-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                  resourceTone[resource.type] || resourceTone.article
                                }`}
                              >
                                {resource.type}
                              </span>
                              {resource.title}
                            </a>
                          ))}
                        </div>

                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Mini Project:</span>{" "}
                          {subStep.miniTask}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoadmapTimeline;
