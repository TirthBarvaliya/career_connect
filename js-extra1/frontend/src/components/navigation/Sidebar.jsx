import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound, Route, BriefcaseBusiness, LayoutDashboard, X, FileBadge2, PlusCircle, CalendarHeart, ScanSearch, Users, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setSidebarOpen } from "../../redux/slices/uiSlice";
import { logout } from "../../redux/slices/authSlice";
import { ROUTES } from "../../utils/constants";
import { sidebarMotion } from "../../animations/motionVariants";

const roleNav = {
  jobseeker: [
    { label: "Dashboard", to: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard },
    { label: "Jobs", to: ROUTES.JOBS, icon: BriefcaseBusiness },
    { label: "Roadmap", to: ROUTES.ROADMAP, icon: Route },
    { label: "Profile", to: ROUTES.PROFILE, icon: UserRound },
    { label: "Resume Builder", to: ROUTES.STUDENT_RESUME_BUILDER, icon: FileBadge2 },
    { label: "ATS Checker", to: ROUTES.ATS_CHECKER, icon: ScanSearch }
  ],
  student: [
    { label: "Dashboard", to: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard },
    { label: "Jobs", to: ROUTES.JOBS, icon: BriefcaseBusiness },
    { label: "Roadmap", to: ROUTES.ROADMAP, icon: Route },
    { label: "Profile", to: ROUTES.PROFILE, icon: UserRound },
    { label: "Resume Builder", to: ROUTES.STUDENT_RESUME_BUILDER, icon: FileBadge2 },
    { label: "ATS Checker", to: ROUTES.ATS_CHECKER, icon: ScanSearch }
  ],
  recruiter: [
    { label: "Dashboard", to: ROUTES.RECRUITER_DASHBOARD, icon: LayoutDashboard },
    { label: "Applicants", to: ROUTES.RECRUITER_APPLICANTS, icon: Users },
    { label: "Post a Job", to: ROUTES.RECRUITER_POST_JOB, icon: PlusCircle },
    { label: "Interview Scheduling", to: ROUTES.RECRUITER_INTERVIEWS, icon: CalendarHeart }
  ]
};

const Sidebar = ({ role }) => {
  const items = roleNav[role] || roleNav.jobseeker;
  const { sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-1">
        <h2 className="font-poppins text-xl font-semibold text-slate-900 dark:text-white">Workspace</h2>
        <button
          type="button"
          onClick={() => dispatch(setSidebarOpen(false))}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={16} />
        </button>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => dispatch(setSidebarOpen(false))}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                ? "bg-gradient-to-r from-brand-indigo to-brand-cyan text-white shadow-glow"
                : "text-slate-700 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

        {/* Logout */}
        <div className="mt-auto pt-4 border-t border-slate-200/70 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => {
              dispatch(setSidebarOpen(false));
              dispatch(logout());
              navigate(ROUTES.HOME);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setSidebarOpen(false))}
            />
            <motion.aside
              variants={sidebarMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel fixed left-3 top-3 z-50 h-[calc(100vh-1.5rem)] w-[min(330px,92vw)] overflow-y-auto p-4"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
