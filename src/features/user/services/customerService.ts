import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Public (unauthenticated) Universal Table API read — see AdminController::universalGet.
// Each network eager-loads its network_types; pivot.active reflects whether
// that specific network+service-type pairing is currently enabled for
// purchase (the same toggle Service Control manages admin-side).
export type Network = {
  id: number;
  name: string;
  network_types: {
    id: number;
    name: string;
    service_type: string;
    pivot: { active: boolean | number };
  }[];
};

export const customerService = {
  // Moves the user's entire referral_balance into wallet_balance.
  // Backend returns the updated user, but callers should prefer
  // refreshUser() from useAuth() afterward to keep every field in sync.
  convertReferralToWallet: (userId: string | number): Promise<void> =>
    apiClient.post(`/customer/${userId}/convert-referral`).then(() => undefined),

  getNetworks: (): Promise<Network[]> =>
    apiClient
      .get<ApiEnvelope<Network[]>>("/table/networks")
      .then((r) => r.data.data),
};
