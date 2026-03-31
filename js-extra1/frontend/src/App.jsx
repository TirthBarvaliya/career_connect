import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { pageTransition } from "./animations/motionVariants";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import ToastContainer from "./components/common/ToastContainer";
import LoadingSkeleton from "./components/common/LoadingSkeleton";
import CareerChatbot from "./components/common/CareerChatbot";
import { ROUTES, USER_ROLES } from "./utils/constants";
import apiClient from "./utils/api";
import { setUser, logout } from "./redux/slices/authSlice";
import { clearJobMeta, fetchAppliedJobs, fetchSavedJobs } from "./redux/slices/jobSlice";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const StudentDashboardPage = lazy(() => import("./pages/StudentDashboardPage"));
const ResumeBuilderPage = lazy(() => import("./pages/ResumeBuilderPage"));
const RecruiterDashboardPage = lazy(() => import("./pages/RecruiterDashboardPage"));
const CareerRoadmapPage = lazy(() => import("./pages/CareerRoadmapPage"));
const JobListingsPage = lazy(() => import("./pages/JobListingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AiInterviewPage = lazy(() => import("./pages/AiInterviewPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const InterviewSchedulingPage = lazy(() => import("./pages/InterviewSchedulingPage"));
const ATSCheckerPage = lazy(() => import("./pages/ATSCheckerPage"));
const HiringPipelinePage = lazy(() => import("./pages/HiringPipelinePage"));
const RecruiterApplicantsPage = lazy(() => import("./pages/RecruiterApplicantsPage"));
const RecruiterApplicantProfilePage = lazy(() => import("./pages/RecruiterApplicantProfilePage"));
const PostJobPage = lazy(() => import("./pages/PostJobPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));

const PageShell = ({ children }) => (
  <motion.div initial={pageTransition.initial} animate={pageTransition.animate} exit={pageTransition.exit} transition={pageTransition.transition}>
    {children}
  </motion.div>
);

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearJobMeta());
      return;
    }

    let active = true;
    const hydrateUser = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        if (!active) return;
        const hydratedUser = response.data.user;
        const hydratedRole = hydratedUser?.role === "student" ? USER_ROLES.JOB_SEEKER : hydratedUser?.role;
        dispatch(setUser(hydratedUser));
        if (hydratedRole === USER_ROLES.JOB_SEEKER) {
          dispatch(fetchSavedJobs());
          dispatch(fetchAppliedJobs());
        }
      } catch {
        if (!active) return;
        dispatch(logout());
      }
    };

    hydrateUser();
    return () => {
      active = false;
    };
  }, [dispatch, isAuthenticated]);

  return (
    <>
      <Suspense
        fallback={
          <div className="container-4k py-10">
            <LoadingSkeleton className="mb-4 h-12 w-1/3" />
            <LoadingSkeleton className="mb-4 h-24 w-full" />
            <LoadingSkeleton className="h-72 w-full" />
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Routes location={location}>
              <Route path={ROUTES.HOME} element={<MainLayout />}>
                <Route
                  index
                  element={
                    <PageShell>
                      <LandingPage />
                    </PageShell>
                  }
                />
                <Route
                  path={ROUTES.JOBS.slice(1)}
                  element={
                    <PageShell>
                      <JobListingsPage />
                    </PageShell>
                  }
                />
                <Route
                  path={ROUTES.ROADMAP.slice(1)}
                  element={
                    <ProtectedRoute roles={[USER_ROLES.STUDENT]}>
                      <CareerRoadmapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.PROFILE.slice(1)}
                  element={
                    <ProtectedRoute roles={[USER_ROLES.STUDENT]}>
                      <PageShell>
                        <ProfilePage />
                      </PageShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.LOGIN.slice(1)}
                  element={
                    <PageShell>
                      <LoginPage />
                    </PageShell>
                  }
                />
                <Route
                  path={ROUTES.FORGOT_PASSWORD.slice(1)}
                  element={
                    <PageShell>
                      <ForgotPasswordPage />
                    </PageShell>
                  }
                />
                <Route
                  path={`${ROUTES.INTERVIEW.slice(1)}/:domain`}
                  element={
                    <ProtectedRoute roles={[USER_ROLES.STUDENT]}>
                      <PageShell>
                        <AiInterviewPage />
                      </PageShell>
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                path={ROUTES.SIGNUP}
                element={
                  <PageShell>
                    <SignupPage />
                  </PageShell>
                }
              />

              <Route
                path={ROUTES.STUDENT_DASHBOARD}
                element={
                  <ProtectedRoute roles={[USER_ROLES.STUDENT]}>
                    <DashboardLayout role={USER_ROLES.STUDENT} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboardPage />} />
              </Route>

              <Route
                path={ROUTES.STUDENT_RESUME_BUILDER}
                element={
                  <ProtectedRoute roles={[USER_ROLES.STUDENT]}>
                    <DashboardLayout role={USER_ROLES.STUDENT} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ResumeBuilderPage />} />
              </Route>

              <Route
                path={ROUTES.ATS_CHECKER}
                element={
                  <ProtectedRoute roles={[USER_ROLES.STUDENT]}>
                    <DashboardLayout role={USER_ROLES.STUDENT} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ATSCheckerPage />} />
              </Route>

              <Route
                path={ROUTES.RECRUITER_DASHBOARD}
                element={
                  <ProtectedRoute roles={[USER_ROLES.RECRUITER]}>
                    <DashboardLayout role={USER_ROLES.RECRUITER} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RecruiterDashboardPage />} />
              </Route>

              <Route
                path={ROUTES.RECRUITER_POST_JOB}
                element={
                  <ProtectedRoute roles={[USER_ROLES.RECRUITER]}>
                    <DashboardLayout role={USER_ROLES.RECRUITER} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<PostJobPage />} />
              </Route>

              <Route
                path={ROUTES.RECRUITER_APPLICANTS}
                element={
                  <ProtectedRoute roles={[USER_ROLES.RECRUITER]}>
                    <DashboardLayout role={USER_ROLES.RECRUITER} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RecruiterApplicantsPage />} />
              </Route>

              <Route
                path={ROUTES.RECRUITER_APPLICANT_PROFILE}
                element={
                  <ProtectedRoute roles={[USER_ROLES.RECRUITER]}>
                    <DashboardLayout role={USER_ROLES.RECRUITER} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RecruiterApplicantProfilePage />} />
              </Route>

              <Route
                path={ROUTES.RECRUITER_INTERVIEWS}
                element={
                  <ProtectedRoute roles={[USER_ROLES.RECRUITER]}>
                    <DashboardLayout role={USER_ROLES.RECRUITER} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<InterviewSchedulingPage />} />
              </Route>

              <Route
                path={ROUTES.HIRING_PIPELINE}
                element={
                  <ProtectedRoute roles={[USER_ROLES.RECRUITER]}>
                    <DashboardLayout role={USER_ROLES.RECRUITER} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HiringPipelinePage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
              <Route path="/dashboard" element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />

              <Route
                path={ROUTES.ADMIN_DASHBOARD}
                element={
                  <ProtectedRoute roles={[USER_ROLES.ADMIN]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
              </Route>
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      {location.pathname !== ROUTES.LOGIN && location.pathname !== ROUTES.SIGNUP && <CareerChatbot />}
      <ToastContainer />
    </>
  );
};

export default App;
