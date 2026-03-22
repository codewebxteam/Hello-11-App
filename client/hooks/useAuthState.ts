import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isTokenExpired } from "../utils/storage";

/**
 * Hook to check and monitor authentication state
 * Automatically handles token expiry and refresh
 */
export const useAuthState = () => {
  const { token, user, isAuthenticated, isLoading, logout } = useAuth();
  const [isTokenExpiring, setIsTokenExpiring] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Check if token is expiring soon (within 5 minutes)
    const checkTokenExpiry = () => {
      const expired = isTokenExpired(token);
      setIsTokenExpiring(expired);

      if (expired) {
        // Token expired - logout user
        logout();
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, [token, logout]);

  return {
    isAuthenticated,
    isLoading,
    user,
    token,
    isTokenExpiring,
    logout,
  };
};
