export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.38, ease: "easeOut" }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

export const cardHover = {
  rest: { y: 0, rotateX: 0, scale: 1 },
  hover: {
    y: -6,
    rotateX: 2,
    scale: 1.01,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

export const drawerMotion = {
  hidden: { x: "100%", opacity: 0.9 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 250, damping: 30 } },
  exit: { x: "100%", opacity: 0.9, transition: { duration: 0.24 } }
};

export const sidebarMotion = {
  hidden: { x: -280 },
  visible: { x: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
  exit: { x: -280, transition: { duration: 0.2 } }
};
