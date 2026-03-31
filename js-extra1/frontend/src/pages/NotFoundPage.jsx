import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "../utils/constants";

const NotFoundPage = () => {
  return (
    <div className="container-4k flex min-h-[70vh] flex-col items-center justify-center text-center">
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-poppins text-6xl font-bold text-slate-900 dark:text-white"
      >
        404
      </motion.h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">The page you requested does not exist.</p>
      <Link
        to={ROUTES.HOME}
        className="mt-5 rounded-xl border border-slate-300/70 bg-white/80 px-5 py-2 font-medium text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
      >
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
