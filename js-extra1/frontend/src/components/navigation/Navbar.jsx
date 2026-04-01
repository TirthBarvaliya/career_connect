import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import ThemeToggle from "../common/ThemeToggle";
import GradientButton from "../common/GradientButton";
import { logout } from "../../redux/slices/authSlice";
import { ROUTES } from "../../utils/constants";

const defaultLinks = [
  { label: "Jobs", to: ROUTES.JOBS },
  { label: "Roadmap", to: ROUTES.ROADMAP },
  { label: "Profile", to: ROUTES.PROFILE }
];
const BRAND_TITLE = "Career Connect";

const AnimatedBrandLogo = () => (
  <motion.div
    className="relative flex h-12 w-10 items-center justify-center overflow-hidden rounded-xl sm:h-16 sm:w-14"
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 260, damping: 14 }}
    style={{ transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }} // Force hardware acceleration
  >
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className="h-full w-full object-cover"
      src="/logo.webm"
    >
      <source src="/logo.webm" type="video/webm" />
    </video>
  </motion.div>
);

const AnimatedBrandText = ({ animationKey }) => (
  <motion.span
    key={`brand-reveal-${animationKey}`}
    className="inline-flex items-baseline"
    aria-label={BRAND_TITLE}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.055,
          delayChildren: 0.08
        }
      }
    }}
  >
    {BRAND_TITLE.split("").map((letter, index) => {
      if (letter === " ") {
        return <span key={`brand-space-${index}`} className="inline-block w-[0.32em]" aria-hidden />;
      }

      return (
        <motion.span
          key={`brand-reveal-letter-${letter}-${index}`}
          aria-hidden
          className="inline-block bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple bg-[length:200%_200%] bg-clip-text text-transparent"
          variants={{
            hidden: { opacity: 0, y: 10, filter: "blur(3px)" },
            visible: { opacity: 1, y: [1, -0.5, 0], filter: "blur(0px)" }
          }}
          transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
        >
          {letter}
        </motion.span>
      );
    })}
  </motion.span>
);

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [titleAnimationKey, setTitleAnimationKey] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardRoute = user?.role === "recruiter" ? ROUTES.RECRUITER_DASHBOARD : ROUTES.STUDENT_DASHBOARD;
  const links = isAuthenticated && user?.role === "recruiter" ? [] : defaultLinks;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-white/[0.06] shadow-[0_1px_24px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 dark:bg-slate-950/[0.12] dark:shadow-[0_1px_24px_rgba(0,0,0,0.25)]"
          : "bg-transparent"
      }`}
    >
      <div className="container-4k flex h-16 items-center justify-between sm:h-20">
        <Link to={ROUTES.HOME} className="group flex min-w-0 items-center gap-1.5">
          <span className="sr-only">{BRAND_TITLE}</span>
          <div className="relative">
            <AnimatedBrandLogo />
          </div>
          <div className="relative hidden leading-tight sm:block" onMouseEnter={() => setTitleAnimationKey((prev) => prev + 1)}>
            <p className="font-poppins text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
              <AnimatedBrandText animationKey={titleAnimationKey} />
            </p>
            <motion.p
              className="text-xs text-slate-500 dark:text-slate-400"
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              Guidance + Hiring Platform
            </motion.p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group relative overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive
                  ? "text-brand-indigo shadow-glow dark:text-cyan-300"
                  : "text-slate-600 hover:-translate-y-0.5 hover:text-brand-indigo hover:shadow-soft dark:text-slate-300 dark:hover:text-cyan-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-brand-indigo/0 via-brand-cyan/0 to-brand-purple/0 transition-all duration-300 group-hover:from-brand-indigo/15 group-hover:via-brand-cyan/10 group-hover:to-brand-purple/15" />
                  <motion.span className="relative z-10 inline-block" whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                    {link.label}
                  </motion.span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <span className="pointer-events-none absolute inset-x-3 -bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple transition-transform duration-300 group-hover:scale-x-100" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {!isAuthenticated && (
            <GradientButton className="px-4 py-2 text-sm" onClick={() => navigate(ROUTES.LOGIN)}>
              Sign In
            </GradientButton>
          )}
          {isAuthenticated && (
            <>
              <button
                type="button"
                className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm transition hover:border-brand-indigo/40 hover:bg-white/[0.12] hover:text-brand-indigo dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-cyan-500/30"
                onClick={() => navigate(dashboardRoute)}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm transition hover:border-rose-300/50 hover:bg-white/[0.12] hover:text-rose-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-rose-500/30"
                onClick={() => {
                  dispatch(logout());
                  navigate(ROUTES.HOME);
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-xl border border-white/20 bg-white/[0.08] p-2 text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 dark:bg-slate-950/[0.12] lg:hidden"
          >
            <div className="container-4k flex flex-col gap-2 py-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-gradient-to-r from-brand-indigo/0 via-brand-cyan/0 to-brand-purple/0 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-indigo/10 hover:via-brand-cyan/10 hover:to-brand-purple/10 dark:text-slate-200 dark:hover:from-brand-indigo/20 dark:hover:via-brand-cyan/20 dark:hover:to-brand-purple/20"
                >
                  {link.label}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <GradientButton
                  className="mt-2 w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate(ROUTES.LOGIN);
                  }}
                >
                  Sign In
                </GradientButton>
              )}
              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onClick={() => {
                      setOpen(false);
                      navigate(dashboardRoute);
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    onClick={() => {
                      dispatch(logout());
                      setOpen(false);
                      navigate(ROUTES.HOME);
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
