import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../../redux/slices/uiSlice";

const iconMap = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />
};

const colorMap = {
  success: "border-emerald-300/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-600/50 dark:bg-emerald-900/30 dark:text-emerald-200",
  error: "border-rose-300/60 bg-rose-50/80 text-rose-700 dark:border-rose-600/50 dark:bg-rose-900/30 dark:text-rose-200",
  warning: "border-amber-300/60 bg-amber-50/80 text-amber-700 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-100",
  info: "border-cyan-300/60 bg-cyan-50/80 text-cyan-700 dark:border-cyan-600/50 dark:bg-cyan-900/30 dark:text-cyan-200"
};

const ToastContainer = () => {
  const toasts = useSelector((state) => state.ui.toasts);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, 3200)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts, dispatch]);

  return (
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-[80] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 36 }}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-soft ${colorMap[toast.type] || colorMap.info}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{iconMap[toast.type] || iconMap.info}</span>
              <p>{toast.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
