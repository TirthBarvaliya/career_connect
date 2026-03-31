import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../../animations/motionVariants";

const AnimatedSection = ({ children, className = "", id }) => {
  return (
    <motion.section
      id={id}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      <motion.div variants={fadeUp}>{children}</motion.div>
    </motion.section>
  );
};

export default AnimatedSection;
