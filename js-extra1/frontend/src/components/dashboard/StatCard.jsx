import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../common/GlassCard";

const StatCard = ({ label, value, delta, icon: Icon, tone = "indigo" }) => {
  const toneClasses = {
    indigo: "bg-brand-indigo/10 text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300",
    cyan: "bg-brand-cyan/10 text-brand-cyan dark:bg-brand-cyan/20 dark:text-brand-cyan",
    emerald: "bg-brand-emerald/10 text-brand-emerald dark:bg-brand-emerald/20 dark:text-brand-emerald",
    purple: "bg-brand-purple/10 text-brand-purple dark:bg-brand-purple/20 dark:text-brand-purple"
  };

  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame;
    const duration = 700;
    const start = performance.now();
    const target = Number(value) || 0;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{count}</h4>
          {delta && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300"
            >
              {delta}
            </motion.p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2 ${toneClasses[tone] || toneClasses.indigo}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default StatCard;
