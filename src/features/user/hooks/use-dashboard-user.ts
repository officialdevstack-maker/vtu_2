import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/providers/auth";
import { customerService } from "../services/customerService";

export const CUSTOMER_DASHBOARD_QUERY_KEY = ["customer", "dashboard"] as const;

// Dashboard, wallet and transaction history all need the same expanded user
// payload. Keeping it behind one query key shares one in-flight request and
// one cache entry while the lightweight /user auth check remains fast.
export const useDashboardUser = () => {
  const { user: authUser } = useAuth();
  const query = useQuery({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEY,
    queryFn: () => customerService.getDashboardUser(),
    // The user dashboard can be available to staff accounts too. Gating only
    // on the legacy user_type caused accounts whose role was displayed as
    // "User" but whose user_type was "admin" to leave the query disabled;
    // React Query then stayed pending and the stat cards remained skeletons.
    enabled: Boolean(authUser),
    initialData: authUser?.stats ? authUser : undefined,
    staleTime: 30_000,
  });

  return {
    ...query,
    user: query.data ?? authUser,
  };
};
