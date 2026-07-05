import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/providers/auth";
import { LoadingScreen } from "@/features/user/components/shared-ui";

// Guards every /admin/* route: unauthenticated visitors go to /login;
// authenticated non-admins are bounced to their own dashboard rather than
// seeing a 403 page (the API independently enforces this too — see
// user_type:admin in backend/routes/api.php — this is UX, not the real gate).
const AdminProtectedLayout = () => {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingScreen label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.user_type !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedLayout;
