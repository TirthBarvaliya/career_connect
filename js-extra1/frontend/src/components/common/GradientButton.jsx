import { motion } from "framer-motion";

const GradientButton = ({ children, className = "", type = "button", onClick, disabled = false }) => {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1, scale: 1.01 }}
      disabled={disabled}
      onClick={onClick}
      className={`gradient-btn disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default GradientButton;
