import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, RefreshCw, TrendingUp, Zap, Lightbulb, Sparkles } from "lucide-react";
import apiClient from "../../utils/api";

const ICON_MAP = {
  "🔥": Zap,
  "📈": TrendingUp,
  "☁️": Sparkles,
  "🎯": Lightbulb,
  "📡": Radio,
  "💰": TrendingUp,
  "🧠": Sparkles,
  "⚡": Zap
};

const getIconForInsight = (emoji) => ICON_MAP[emoji] || Radio;

const PLACEHOLDER_INSIGHTS = [
  { emoji: "📡", title: "Loading insights...", body: "Fetching the latest tech industry trends for you." }
];

const TechPulseCard = () => {
  const [insights, setInsights] = useState(PLACEHOLDER_INSIGHTS);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchInsights = useCallback(async ({ silent = false, force = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const url = force
        ? `/dashboard/tech-insights?forceRefresh=true&t=${Date.now()}`
        : `/dashboard/tech-insights?t=${Date.now()}`;

      const response = await apiClient.get(url);
      const data = response.data;

      if (data?.insights?.length) {
        setInsights(data.insights);
        setGeneratedAt(data.generatedAt);
      }

      // Show popup if limit is reached after a refresh attempt
      if (force && data?.limitReached) {
        setShowLimitPopup(true);
        setTimeout(() => setShowLimitPopup(false), 3000);
      }
    } catch {
      // Keep current insights on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchInsights({ force: false });
  }, [fetchInsights]);

  const timeSinceGenerated = generatedAt
    ? (() => {
        const diff = Date.now() - new Date(generatedAt).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return "Just now";
        if (hrs === 1) return "1 hour ago";
        return `${hrs} hours ago`;
      })()
    : "";

  return (
    <div className="glass-panel relative overflow-hidden p-5">
      {/* Limit reached popup */}
      <AnimatePresence>
        {showLimitPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-md ring-1 ring-amber-200 dark:bg-amber-900/80 dark:text-amber-200 dark:ring-amber-700"
          >
            ✨ More insights tomorrow!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo to-brand-cyan shadow-sm">
            <Radio size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              Tech Pulse
            </h3>
            {timeSinceGenerated && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Updated {timeSinceGenerated}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchInsights({ silent: true, force: true })}
          disabled={refreshing || loading}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-indigo disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          aria-label="Refresh insights"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-brand-indigo dark:text-cyan-400" : ""} />
        </button>
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-slate-200/60 bg-slate-100/50 p-3 dark:border-slate-700/40 dark:bg-slate-800/30"
                >
                  <div className="mb-2 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {insights.map((insight, index) => {
                const Icon = getIconForInsight(insight.emoji);
                return (
                  <motion.div
                    key={`${insight.title}-${index}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.25 }}
                    className="group rounded-xl border border-slate-200/60 bg-white/70 p-3 transition hover:border-brand-indigo/30 hover:shadow-sm dark:border-slate-700/40 dark:bg-slate-800/30 dark:hover:border-cyan-700/40"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Icon
                        size={13}
                        className="text-brand-indigo dark:text-cyan-400"
                      />
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {insight.title}
                      </p>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {insight.body}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle branding */}
      <p className="mt-3 text-center text-[9px] font-medium tracking-wider text-slate-300 dark:text-slate-600">
        PERSONALIZED • UPDATED DAILY
      </p>
    </div>
  );
};

export default TechPulseCard;
