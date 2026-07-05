import { apiClient } from "@/shared/api/apiClient";

type ApiEnvelope<T> = { message: string; success: boolean; data: T; type: string };

export type ProfileUpdatePayload = {
  fullname?: string;
  phone?: string;
};

export type PasswordUpdatePayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export const accountService = {
  updateProfile: (payload: ProfileUpdatePayload) =>
    apiClient
      .put<ApiEnvelope<{ user: Record<string, unknown> }>>("/account/profile", payload)
      .then((r) => r.data.data.user),

  updatePassword: (payload: PasswordUpdatePayload) =>
    apiClient.put<ApiEnvelope<null>>("/account/password", payload).then((r) => r.data),
};
