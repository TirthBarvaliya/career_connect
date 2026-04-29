import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Home, Bell, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import ThemeToggle from "../components/common/ThemeToggle";
import { logout } from "../redux/slices/authSlice";
import { setNotifications, markAllNotificationsRead, dismissNotification } from "../redux/slices/uiSlice";
import { ROUTES } from "../utils/constants";
import apiClient from "../utils/api";

const POLL_INTERVAL = 30_000; // 30 seconds

const NOTIF_ICONS = {
  new_user: "👤",
  new_job: "💼",
  user_blocked: "🚫",
  user_unblocked: "✅",
  user_deleted: "🗑️",
  job_deleted: "🗑️",
  job_flagged: "🚩"
};

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector((state) => state.ui.notifications);
  const adminName = (user?.name || "Admin").trim().split(/\s+/)[0];

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/admin/notifications");
      dispatch(setNotifications(data.notifications || []));
    } catch {
      // Silently fail — bell just shows 0
    }
  }, [dispatch]);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all read when bell opens
  const handleBellOpen = useCallback(async () => {
    setBellOpen((prev) => {
      const opening = !prev;
      if (opening && unreadCount > 0) {
        dispatch(markAllNotificationsRead());
        apiClient.patch("/admin/notifications/read").catch(() => {});
      }
      return opening;
    });
  }, [dispatch, unreadCount]);

  // Delete a notification
  const handleDismiss = useCallback(async (id) => {
    dispatch(dismissNotification(id));
    apiClient.delete(`/admin/notifications/${id}`).catch(() => {});
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    if (bellOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bellOpen]);

  const btnClass =
    "rounded-xl border border-slate-300/70 bg-white/70 p-2 text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200";

  return (
    <div className="container-4k py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-poppins text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">
              Admin Panel
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Welcome back, {adminName}.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/35 dark:text-rose-200">
            Role: Admin
          </span>
        </div>

        {/* Action buttons: Home → Toggle → Bell → Logout */}
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {/* Home */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            aria-label="Go to home page"
            title="Home"
            className={btnClass}
          >
            <Home size={18} />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={handleBellOpen}
              aria-label="Notifications"
              title="Notifications"
              className={btnClass}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200/70 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <Bell size={15} />
                      Notifications
                    </h4>
                    {notifications.length > 0 && (
                      <span className="rounded-full bg-brand-indigo/10 px-2 py-0.5 text-[11px] font-medium text-brand-indigo dark:bg-brand-indigo/20">
                        {notifications.length}
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <Check size={24} className="text-emerald-400" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          All caught up. No new notifications.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 transition ${
                            n.isRead
                              ? "border-slate-100 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/60"
                              : "border-indigo-200 bg-indigo-50/60 dark:border-indigo-800/50 dark:bg-indigo-950/30"
                          }`}
                        >
                          <div className="flex gap-2">
                            <span className="mt-0.5 text-base leading-none">
                              {NOTIF_ICONS[n.type] || "🔔"}
                            </span>
                            <div>
                              <p className="text-xs text-slate-700 dark:text-slate-200">
                                {n.message}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                {formatTimeAgo(n.createdAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismiss(n.id)}
                            className="shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              dispatch(logout());
              navigate(ROUTES.HOME);
            }}
            className="rounded-xl border border-slate-300/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <span className="inline-flex items-center gap-1">
              <LogOut size={14} />
              Logout
            </span>
          </button>
        </div>
      </div>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

