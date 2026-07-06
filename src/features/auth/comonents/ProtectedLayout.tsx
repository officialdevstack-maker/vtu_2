import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/providers/auth";
import { SessionPreloader } from "@/features/user/components/shared-ui";

// Guards every customer-facing route (/dashboard, /wallet, /transactions,
// etc.) — unauthenticated visitors are bounced to /login, remembering where
// they were headed so login can send them back.
const ProtectedLayout = () => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <SessionPreloader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // A transaction PIN guards wallet actions — non-admin users can't reach
  // any customer route until they've set one, whether they land here via a
  // stale bookmark, the back button, or a direct URL after registering.
  if (user?.user_type !== "admin" && !user?.has_pin) {
    return <Navigate to="/create-transaction-pin" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
