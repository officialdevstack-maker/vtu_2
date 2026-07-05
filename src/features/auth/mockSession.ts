import type { LoginFormData, RegisterFormData } from "./validators";

const SESSION_KEY = "kora.mock.session";

type MockSession = {
  user?: Omit<RegisterFormData, "password" | "confirmPassword" | "acceptTerms">;
  hasPin: boolean;
  lastLogin?: Pick<LoginFormData, "login" | "rememberMe">;
};

function readSession(): MockSession {
  if (typeof window === "undefined") {
    return { hasPin: false };
  }

  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? { hasPin: false, ...JSON.parse(value) } : { hasPin: false };
  } catch {
    return { hasPin: false };
  }
}

function writeSession(session: MockSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function createMockAccount(data: RegisterFormData) {
  const session = readSession();
  writeSession({
    ...session,
    user: {
      fullname: data.fullname,
      username: data.username,
      email: data.email,
      phone: data.phone,
    },
    hasPin: false,
  });
}

export function saveMockLogin(data: LoginFormData) {
  const session = readSession();
  writeSession({
    ...session,
    lastLogin: {
      login: data.login,
      rememberMe: data.rememberMe,
    },
  });

  return session.hasPin;
}

export function saveMockPin() {
  const session = readSession();
  writeSession({ ...session, hasPin: true });
}
