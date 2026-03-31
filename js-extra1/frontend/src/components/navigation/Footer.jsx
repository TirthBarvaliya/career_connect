import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../../utils/constants";

const Footer = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (location.pathname === ROUTES.LOGIN) {
    return null;
  }

  const joinTarget = isAuthenticated
    ? user?.role === "recruiter"
      ? ROUTES.RECRUITER_DASHBOARD
      : ROUTES.STUDENT_DASHBOARD
    : ROUTES.SIGNUP;

  return (
    <footer className="mt-24 border-t border-slate-200/70 dark:border-white/10">
      <div className="container-4k py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-poppins text-xl font-semibold text-slate-900 dark:text-white">Career connect</h3>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
              Built for job seekers and recruiters to discover better opportunities, measurable growth, and faster hiring.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Explore</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <Link to={ROUTES.JOBS} className="hover:text-brand-indigo dark:hover:text-cyan-300">
                  Job Listings
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ROADMAP} className="hover:text-brand-indigo dark:hover:text-cyan-300">
                  Career Roadmaps
                </Link>
              </li>
              <li>
                <Link to={joinTarget} className="hover:text-brand-indigo dark:hover:text-cyan-300">
                  {isAuthenticated ? "Open Dashboard" : "Join Platform"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Contact</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">careerconnect.noreply@gmail.com</p>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Career connect. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
