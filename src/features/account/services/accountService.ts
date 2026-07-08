import { apiClient } from "@/shared/api/apiClient";

type ApiEnvelope<T> = { message: string; success: boolean; data: T; type: string };

export type ProfileUpdatePayload = {
  fullname?: string;
  phone?: string;
  // Accepted by PUT /account/profile so the default owner bootstrap account
  // (see DefaultCredentialsModal) can rotate its login identity.
  username?: string;
  email?: string;
};

export type PasswordUpdatePayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type PinUpdatePayload = {
  pin: string;
  pin_confirmation: string;
  // Only required when the user already has a PIN set (i.e. changing it,
  // not creating it for the first time right after registration).
  current_pin?: string;
};

export const accountService = {
  updateProfile: (payload: ProfileUpdatePayload) =>
    apiClient
      .put<ApiEnvelope<{ user: Record<string, unknown> }>>("/account/profile", payload)
      .then((r) => r.data.data.user),

  updatePassword: (payload: PasswordUpdatePayload) =>
    apiClient.put<ApiEnvelope<null>>("/account/password", payload).then((r) => r.data),

  updatePin: (payload: PinUpdatePayload) =>
    apiClient
      .put<ApiEnvelope<{ user: Record<string, unknown> }>>("/account/pin", payload)
      .then((r) => r.data.data.user),
};
