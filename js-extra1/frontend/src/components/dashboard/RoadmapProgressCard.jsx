import { motion } from "framer-motion";
import GlassCard from "../common/GlassCard";

const RoadmapProgressCard = ({ timeline = [], subtitle = "" }) => {
  return (
    <GlassCard className="p-5" hoverable={false}>
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Career Roadmap Progress</h3>
      {subtitle ? <p className="mb-4 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p> : null}
      <div className="space-y-4">
        {!timeline.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">No roadmap progress yet.</p>
        ) : null}
        {timeline.map((item, index) => (
          <div key={item.key || item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
              <span className="text-slate-500 dark:text-slate-300">{item.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
                initial={{ width: 0 }}
                whileInView={{ width: `${item.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default RoadmapProgressCard;
