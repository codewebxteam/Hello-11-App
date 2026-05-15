import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, userAPI, setLogoutCallback } from "../utils/api";
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser, clearStorage, isValidToken, isTokenExpired } from "../utils/storage";

// Types
interface User {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  email?: string;
  gender?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOTP: (mobile: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (mobile: string, otp: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, mobile: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserLocal: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ================= LOGOUT =================
  const logout = React.useCallback(async () => {
    console.log("[Auth] logout called, clearing storage");
    await clearStorage();
    setToken(null);
    setUser(null);
  }, []);

  const isRefreshing = React.useRef(false);

  // ================= REFRESH PROFILE =================
  const refreshProfile = React.useCallback(async () => {
    if (isRefreshing.current) {
        console.log("[Auth] refreshProfile: already in progress, skipping");
        return;
    }
    
    isRefreshing.current = true;
    try {
      const response = await userAPI.getProfile();
      const userData = response.data.user;
      console.log("[Auth] refreshProfile: success", userData);
      setUser(userData);
      await saveUser(userData);
    } catch (error: any) {
      console.error("[Auth] refreshProfile: error", error);
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // ================= LOAD STORED AUTH =================
  const loadStoredAuth = async () => {
    try {
      const storedToken = await getToken();
      const storedUser = await getUser();

      console.log("[Auth] loadStoredAuth: storedToken", !!storedToken, "storedUser", !!storedUser);

      if (storedToken) {
        // Just set the token first to allow the app to show authenticated screens
        setToken(storedToken);
        
        const tokenValid = await isValidToken(storedToken);
        console.log("[Auth] loadStoredAuth: tokenValid?", tokenValid);
        if (!tokenValid) {
          console.warn("Stored token has expired. Logging out.");
          await logout();
          return;
        }

        if (storedUser) {
          setUser(storedUser);
          // Refresh in background to get latest data
          refreshProfile();
        } else {
          // If user data is missing but token is valid, fetch it
          await refreshProfile();
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= EFFECTS =================
  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  // ================= REQUEST OTP =================
  const requestOTP = React.useCallback(async (mobile: string): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedMobile = mobile.replace(/\D/g, "").slice(-10);
      const response = await authAPI.requestOtp({ mobile: normalizedMobile });
      return { success: true, message: response.data.message || "OTP sent successfully" };
    } catch (error: any) {
      const message = error?.message || "Failed to send OTP.";
      return { success: false, message };
    }
  }, []);

  // ================= VERIFY OTP =================
  const verifyOTP = React.useCallback(async (mobile: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedMobile = mobile.replace(/\D/g, "").slice(-10);
      const response = await authAPI.verifyOtp({ mobile: normalizedMobile, otp });
      const { token: newToken, user: userData } = response.data;

      await saveToken(newToken);
      await saveUser(userData);
      setToken(newToken);
      setUser(userData);

      return { success: true, message: "Login successful" };
    } catch (error: any) {
      const message = error?.message || "Verification failed.";
      return { success: false, message };
    }
  }, []);

  // ================= REGISTER =================
  const register = React.useCallback(async (name: string, mobile: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.signup({ name, mobile });
      return { success: true, message: response.data.message || "Signup successful. OTP sent." };
    } catch (error: any) {
      const message = error?.message || "Registration failed.";
      return { success: false, message };
    }
  }, []);

  // ================= UPDATE USER LOCAL =================
  const updateUserLocal = React.useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      saveUser(updated);
      return updated;
    });
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!token, // Only depend on token for authentication status
    requestOTP,
    verifyOTP,
    register,
    logout,
    refreshProfile,
    updateUserLocal,
  }), [user, token, isLoading, requestOTP, verifyOTP, register, logout, refreshProfile, updateUserLocal]);

  return (
    <AuthContext.Provider value={contextValue}>
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
