import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const ATSScoreRing = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score || 0));
    if (end === 0) return;

    const duration = 1500; // ms
    const incrementTime = 20;
    const steps = duration / incrementTime;
    const stepValue = end / steps;

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [score]);

  const getColorClass = (val) => {
    if (val < 50) return { stroke: "text-rose-500", bg: "bg-rose-500/10", label: "Poor" };
    if (val < 70) return { stroke: "text-amber-500", bg: "bg-amber-500/10", label: "Fair" };
    if (val < 85) return { stroke: "text-brand-cyan", bg: "bg-brand-cyan/10", label: "Good" };
    return { stroke: "text-emerald-500", bg: "bg-emerald-500/10", label: "Excellent" };
  };

  const { stroke, bg, label } = getColorClass(animatedScore);
  const strokeDasharray = 100;
  const strokeDashoffset = 100 - animatedScore;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative flex h-36 w-36 items-center justify-center rounded-full ${bg} shadow-inner`}>
        <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
          {/* Background Ring */}
          <circle cx="50" cy="50" r="42" fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="8" />
          {/* Foreground Progress Ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            className={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            pathLength="100"
          />
        </svg>

        {/* Score Text inside */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={animatedScore}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-poppins text-4xl font-bold tracking-tight ${stroke}`}
          >
            {animatedScore}
          </motion.span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            ATS Score
          </span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 1 }}
        className="mt-4 text-center"
      >
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${bg} ${stroke}`}>
          {label} Match
        </span>
      </motion.div>
    </div>
  );
};

export default ATSScoreRing;
