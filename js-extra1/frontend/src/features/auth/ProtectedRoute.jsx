import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../../utils/constants";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  if (!user) {
    return (
      <div className="container-4k py-10">
        <LoadingSkeleton className="mb-4 h-14 w-1/3" />
        <LoadingSkeleton className="mb-4 h-28 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (roles?.length && !roles.includes(user?.role)) {
    let fallback = ROUTES.STUDENT_DASHBOARD;
    if (user?.role === "recruiter") fallback = ROUTES.RECRUITER_DASHBOARD;
    if (user?.role === "admin") fallback = ROUTES.ADMIN_DASHBOARD;
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
