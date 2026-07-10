import { apiClient } from "@/shared/api/apiClient";

type ApiEnvelope<T> = { message: string; success: boolean; data: T; type: string };

export type RegisterPayload = {
  fullname: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation?: string;
  referral_code?: string;
};

export type ResetPasswordPayload = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient
      .post<ApiEnvelope<{ user: Record<string, unknown> }>>("/register", payload)
      .then((r) => r.data.data.user),

  forgotPassword: (email: string) =>
    apiClient.post<ApiEnvelope<null>>("/forgot-password", { email }).then((r) => r.data),

  resendVerificationEmail: () =>
    apiClient.post<ApiEnvelope<null>>("/email/verification-notification").then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ApiEnvelope<null>>("/reset-password", payload).then((r) => r.data),
};
