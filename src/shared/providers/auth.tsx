import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import { apiClient } from "../api/apiClient";

// Define the shape of your user object
interface User {
  id: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    token: string,
    email: string,
  ) => Promise<void | { redirectTo: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setUser(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.get("/user");
      setUser(response.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Simulate a login action (e.g. saving a token to localStorage)
  const login = useCallback(async (login: string, password: string) => {
    setIsLoading(true);
    try {
      await apiClient.get("/sanctum/csrf-cookie");
      const { data: { data } } = await apiClient.post("/login", {
        login,
        password,
      });
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
      await checkAuth();
    } catch (error: any) {
      console.error("Login failed:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout action
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("authToken");
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume the Auth context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
