import { motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { dismissNotification } from "../../redux/slices/uiSlice";

const NotificationCenter = () => {
  const notifications = useSelector((state) => state.ui.notifications);
  const dispatch = useDispatch();

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Bell size={18} />
          Notifications
        </h3>
        <span className="rounded-full bg-brand-indigo/10 px-2 py-1 text-xs font-medium text-brand-indigo dark:bg-brand-indigo/20">
          {notifications.length}
        </span>
      </div>
      <div className="space-y-3">
        {notifications.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">All caught up. No new notifications.</p>
        )}
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/80"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-700 dark:text-slate-200">{notification.message}</p>
              <button
                type="button"
                onClick={() => dispatch(dismissNotification(notification.id))}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationCenter;
