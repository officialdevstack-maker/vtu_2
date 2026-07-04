import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import { apiClient } from "../api/apiClient";
import { config } from "../config";

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient.get("/user");
      setUser(response.data.data?.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (login: string, password: string) => {
      setIsLoading(true);
      try {
        await apiClient.get("/sanctum/csrf-cookie");

        await apiClient.post("/login", { login, password });
        await checkAuth();
      } catch (error: any) {
        console.error("Login failed:", error?.response?.data ?? error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuth],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await apiClient.post(config.auth.routes.logout);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
