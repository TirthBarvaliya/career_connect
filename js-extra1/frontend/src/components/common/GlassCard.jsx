import { forwardRef } from "react";
import { motion } from "framer-motion";

const GlassCard = forwardRef(({ children, className = "", hoverable = true }, ref) => {
  const cardProps = hoverable
    ? {
        whileHover: { y: -6, scale: 1.01, rotateX: 2 },
        transition: { duration: 0.2, ease: "easeOut" }
      }
    : {};

  return (
    <motion.div
      ref={ref}
      {...cardProps}
      className={`glass-panel [transform-style:preserve-3d] transition-transform duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = "GlassCard";

export default GlassCard;
