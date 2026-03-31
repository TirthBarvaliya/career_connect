import { useCallback, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

// ── Gradient palette for each ring ────────────────────────────────────
const RING_COLORS = [
  { stroke: "url(#grad-0)", glow: "rgba(99,102,241,0.35)", label: "text-brand-indigo dark:text-cyan-300" },
  { stroke: "url(#grad-1)", glow: "rgba(34,211,238,0.35)", label: "text-brand-cyan dark:text-cyan-400" },
  { stroke: "url(#grad-2)", glow: "rgba(16,185,129,0.35)", label: "text-emerald-500 dark:text-emerald-400" },
  { stroke: "url(#grad-3)", glow: "rgba(168,85,247,0.35)", label: "text-purple-500 dark:text-purple-400" }
];

// ── SVG ring with animated stroke-dashoffset ──────────────────────────
const RadialRing = ({ percent, index, isInView }) => {
  const radius = 32;

  return (
    <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {index === 0 && <><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#22d3ee" /></>}
            {index === 1 && <><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#06b6d4" /></>}
            {index === 2 && <><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></>}
            {index === 3 && <><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" /></>}
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-slate-200/50 dark:text-slate-700/50"
        />

        {/* Animated progress arc — pathLength normalizes to 100 units */}
        <motion.circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={`url(#grad-${index})`}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100 }}
          animate={isInView ? { strokeDashoffset: 100 - percent } : { strokeDashoffset: 100 }}
          transition={{ duration: 1.2, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${RING_COLORS[index]?.glow || "rgba(99,102,241,0.3)"})` }}
        />
      </svg>

      {/* Animated counter in center */}
      <CountUp target={percent} isInView={isInView} delay={index * 0.15} />
    </div>
  );
};

// ── Count-up number animation ─────────────────────────────────────────
const CountUp = ({ target, isInView, delay = 0 }) => {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  const animateValue = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), delay * 1000);
  }, [target, delay]);

  if (isInView && !hasAnimated.current) {
    animateValue();
  }

  return (
    <span className="absolute text-sm font-bold text-slate-800 dark:text-white">
      {value}%
    </span>
  );
};

// ── Main 3D card component ────────────────────────────────────────────
const RoadmapSnapshot3D = ({ data = [] }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Max 8° tilt
    const rotateY = ((x - centerX) / centerX) * 8;
    const rotateX = ((centerY - y) / centerY) * 8;
    setTilt({ rotateX, rotateY });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  const items = data.slice(0, 4);

  return (
    <div className="relative [perspective:1200px]">
      {/* Floating gradient orbs behind the card */}
      <motion.div
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-brand-indigo/30 via-brand-cyan/20 to-transparent blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-tr from-brand-purple/25 via-pink-400/15 to-transparent blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute -right-2 bottom-1/3 h-16 w-16 rounded-full bg-gradient-to-bl from-cyan-300/20 to-transparent blur-xl"
        animate={{ y: [-4, 4, -4], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* 3D tilting card */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
          scale: isHovering ? 1.02 : 1
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.07] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 sm:p-7 dark:border-white/[0.08] dark:bg-slate-900/40 dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glossy internal highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.12] via-transparent to-transparent dark:from-white/[0.04]" />

        {/* Animated shimmer sweep */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)"
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />

        {/* Header */}
        <div className="relative" style={{ transform: "translateZ(20px)" }}>
          <div className="mb-1 flex items-center gap-2">
            <motion.div
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo to-brand-cyan"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </motion.div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Trending Career Domains
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Today's hottest tech domains — powered by live job market data.
          </p>
        </div>

        {/* Radial progress rings grid */}
        <div
          className="relative mt-5 grid gap-4 sm:grid-cols-2"
          style={{ transform: "translateZ(30px)" }}
        >
          {items.map((path, index) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-brand-indigo/20 hover:bg-white/[0.08] dark:hover:border-cyan-700/25"
            >
              <RadialRing
                percent={path.completion}
                index={index}
                isInView={isInView}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                  {path.title}
                </p>
                <p className={`mt-0.5 text-xs font-medium ${RING_COLORS[index]?.label || "text-slate-500"}`}>
                  {path.completion >= 70 ? "High demand" : path.completion >= 40 ? "Growing" : "Emerging"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom pulse indicator */}
        <div className="relative mt-4 flex items-center justify-center gap-2" style={{ transform: "translateZ(15px)" }}>
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[10px] font-medium tracking-wider text-slate-400 dark:text-slate-500">
            LIVE MARKET DATA
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadmapSnapshot3D;
