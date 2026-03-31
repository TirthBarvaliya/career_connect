import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import ThemeToggle from "../components/common/ThemeToggle";
import { logout } from "../redux/slices/authSlice";
import { ROUTES } from "../utils/constants";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const adminName = (user?.name || "Admin").trim().split(/\s+/)[0];

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
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <ThemeToggle />
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
