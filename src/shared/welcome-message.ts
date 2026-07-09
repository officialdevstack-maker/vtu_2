import { apiClient } from "@shared/api/apiClient";

// Backend-backed welcome message (see WelcomeMessageController). A single
// record shown to every user as a modal after login; the customer endpoint
// also reports whether THIS user has already seen the current version, so
// editing the message re-shows it to everyone.
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type WelcomeMessage = {
  id: number;
  body: string;
  active: boolean;
  updated_at: string;
};

export type WelcomeMessagePayload = {
  body: string;
  active: boolean;
};

type RawWelcomeMessage = {
  id?: number | string;
  body?: string;
  active?: boolean | number;
  updated_at?: string;
};

const mapMessage = (raw: RawWelcomeMessage | null | undefined): WelcomeMessage | null =>
  raw
    ? {
        id: Number(raw.id),
        body: raw.body ?? "",
        active: Boolean(raw.active),
        updated_at: raw.updated_at ?? "",
      }
    : null;

export const welcomeMessageService = {
  // Customer-facing: the active message + whether this user has seen it.
  getForUser: async (): Promise<{ message: WelcomeMessage | null; seen: boolean }> => {
    const response = await apiClient.get<
      ApiEnvelope<{ welcome_message: RawWelcomeMessage | null; seen: boolean }>
    >("/welcome-message");
    return {
      message: mapMessage(response.data.data?.welcome_message),
      seen: Boolean(response.data.data?.seen),
    };
  },

  markSeen: async (id: number): Promise<void> => {
    await apiClient.post("/welcome-message/seen", { welcome_message_id: id });
  },

  // Admin: the configured message regardless of active state.
  getAdmin: async (): Promise<WelcomeMessage | null> => {
    const response = await apiClient.get<
      ApiEnvelope<{ welcome_message: RawWelcomeMessage | null }>
    >("/admin/welcome-message");
    return mapMessage(response.data.data?.welcome_message);
  },

  save: async (payload: WelcomeMessagePayload): Promise<WelcomeMessage | null> => {
    const response = await apiClient.put<
      ApiEnvelope<{ welcome_message: RawWelcomeMessage | null }>
    >("/admin/welcome-message", payload);
    return mapMessage(response.data.data?.welcome_message);
  },

  remove: async (): Promise<void> => {
    await apiClient.delete("/admin/welcome-message");
  },
};
