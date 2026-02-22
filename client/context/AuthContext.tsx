import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, userAPI } from "../utils/api";
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser, clearStorage } from "../utils/storage";

// Types
interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, mobile: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserLocal: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await getToken();
      const storedUser = await getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= LOGIN =================
  const login = async (mobile: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.signin({ mobile, password });
      const { token: newToken, user: userData } = response.data;

      // Save to storage
      await saveToken(newToken);
      await saveUser(userData);

      // Update state
      setToken(newToken);
      setUser(userData);

      return { success: true, message: "Login successful" };
    } catch (error: any) {
      const message = error?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  };

  // ================= REGISTER =================
  const register = async (name: string, mobile: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.signup({ name, mobile, password });
      return { success: true, message: response.data.message || "Signup successful" };
    } catch (error: any) {
      const message = error?.message || "Registration failed. Please try again.";
      return { success: false, message };
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    await clearStorage();
    setToken(null);
    setUser(null);
  };

  // ================= REFRESH PROFILE =================
  const refreshProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.data.user;
      setUser(userData);
      await saveUser(userData);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  // ================= UPDATE USER LOCAL =================
  const updateUserLocal = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      saveUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
        updateUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
