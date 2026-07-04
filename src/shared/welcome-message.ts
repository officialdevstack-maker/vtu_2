// Frontend-only placeholder for the welcome message feature — there is no
// backend endpoint for this yet. Persisting to localStorage lets the admin
// composer and the customer-facing app talk to each other in the meantime;
// swap this module for real API calls (e.g. a dedicated endpoint, or
// POST /admin/broadcast + GET /table/notifications) once one exists.

export type WelcomeMessage = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  updatedAt: string;
};

const MESSAGE_KEY = "kora-welcome-message";
const SEEN_KEY = "kora-welcome-message-seen";

export const getWelcomeMessage = (): WelcomeMessage | null => {
  try {
    const raw = localStorage.getItem(MESSAGE_KEY);
    return raw ? (JSON.parse(raw) as WelcomeMessage) : null;
  } catch {
    return null;
  }
};

export const saveWelcomeMessage = (message: Pick<WelcomeMessage, "title" | "body" | "active">): WelcomeMessage => {
  const saved: WelcomeMessage = {
    ...message,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(MESSAGE_KEY, JSON.stringify(saved));
  return saved;
};

export const clearWelcomeMessage = () => {
  localStorage.removeItem(MESSAGE_KEY);
};

export const getSeenMessageId = (): string | null => localStorage.getItem(SEEN_KEY);

export const markMessageSeen = (id: string) => {
  localStorage.setItem(SEEN_KEY, id);
};
