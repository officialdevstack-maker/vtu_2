import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/providers/auth";
import { LoadingScreen } from "@/features/user/components/shared-ui";

// Guards every customer-facing route (/dashboard, /wallet, /transactions,
// etc.) — unauthenticated visitors are bounced to /login, remembering where
// they were headed so login can send them back.
const ProtectedLayout = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingScreen label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
