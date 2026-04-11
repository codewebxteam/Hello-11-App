import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { driverAuthAPI, driverAPI } from "../utils/api";
import { getDriverToken, getDriverData, setDriverToken, setDriverData, clearDriverData } from "../utils/storage";

// Types
interface Driver {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleColor?: string;
  serviceType?: string;
  isAvailable?: boolean;
  isOnline?: boolean;
  profileImage?: string;
  rating?: number;
  experienceYears?: number;
  isVerified?: boolean;
  verificationNote?: string;
  pendingCommission?: number;
  unpaidRideCount?: number;
  stats?: {
    completedBookings: number;
    totalEarnings?: number;
  };
  documents?: {
    license?: string;
    insurance?: string;
    registration?: string;
  };
}

interface DriverAuthContextType {
  driver: Driver | null;
  setDriver: React.Dispatch<React.SetStateAction<Driver | null>>;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  profileVersion: string;
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

export const DriverAuthProvider = ({ children }: { children: ReactNode }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileVersion, setProfileVersion] = useState<string>(Date.now().toString());

  // Check for existing session on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await getDriverToken();
      const storedDriver = await getDriverData();

      if (storedToken && storedDriver) {
        setToken(storedToken);
        setDriver(storedDriver);
      }
    } catch (error) {
      console.error("Error loading stored driver auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= LOGIN =================
  const login = React.useCallback(async (mobile: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await driverAuthAPI.login({ mobile, password });
      const { token: newToken, driver: driverData } = response.data;

      // Save to storage
      await setDriverToken(newToken);
      await setDriverData(driverData);

      // Update state
      setToken(newToken);
      setDriver(driverData);
      setProfileVersion(Date.now().toString());

      return { success: true, message: "Login successful" };
    } catch (error: any) {
      const message = error?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  }, []);

  // ================= LOGOUT =================
  const logout = React.useCallback(async () => {
    try {
      await driverAuthAPI.logout();
    } catch (error) {
      console.error("Error during logout API call:", error);
    } finally {
      await clearDriverData();
      setToken(null);
      setDriver(null);
    }
  }, []);

  // Use a ref to keep track of the current driver for comparison without triggering re-render loops
  const driverRef = React.useRef<Driver | null>(null);
  React.useEffect(() => { driverRef.current = driver; }, [driver]);

  // ================= REFRESH PROFILE =================
  const refreshProfile = React.useCallback(async () => {
    try {
      console.log("[AuthContext] Refreshing profile...");
      const response = await driverAPI.getProfile();
      const driverData = response.data.driver || response.data;
      
      const currentDriver = driverRef.current;
      const oldImage = currentDriver?.profileImage;
      const newImage = driverData.profileImage;

      // Only update version if the image URL actually changed to prevent blinking
      if (newImage && oldImage && newImage !== oldImage) {
        console.log(`[AuthContext] Profile image CHANGED: updating version.`);
        setProfileVersion(Date.now().toString());
      }

      // Check if data is actually different to avoid infinite re-renders
      const hasChanged = !currentDriver || 
        currentDriver.profileImage !== driverData.profileImage ||
        currentDriver.isVerified !== driverData.isVerified ||
        currentDriver.verificationNote !== driverData.verificationNote ||
        JSON.stringify(currentDriver.documents) !== JSON.stringify(driverData.documents) ||
        currentDriver.isOnline !== driverData.isOnline ||
        currentDriver.isAvailable !== driverData.isAvailable ||
        currentDriver.rating !== driverData.rating ||
        currentDriver.pendingCommission !== driverData.pendingCommission ||
        currentDriver.unpaidRideCount !== driverData.unpaidRideCount ||
        currentDriver.vehicleModel !== driverData.vehicleModel ||
        currentDriver.vehicleNumber !== driverData.vehicleNumber ||
        currentDriver.vehicleType !== driverData.vehicleType ||
        currentDriver.vehicleColor !== driverData.vehicleColor ||
        JSON.stringify(currentDriver.stats) !== JSON.stringify(driverData.stats);

      if (hasChanged) {
        console.log("[AuthContext] Driver data changed, updating state.");
        setDriver(driverData);
        await setDriverData(driverData);
      } else {
        console.log("[AuthContext] Driver data identical, skipping state update.");
      }
    } catch (error) {
      console.error("Error refreshing driver profile:", error);
    }
  }, []); // NO DEPENDENCIES! Identity stays stable.

  return (
    <DriverAuthContext.Provider
      value={{
        driver,
        setDriver,
        token,
        isLoading,
        isAuthenticated: !!token && !!driver,
        login,
        logout,
        refreshProfile,
        profileVersion,
      }}
    >
      {children}
    </DriverAuthContext.Provider>
  );
};

export const useDriverAuth = (): DriverAuthContextType => {
  const context = useContext(DriverAuthContext);
  if (!context) {
    throw new Error("useDriverAuth must be used within a DriverAuthProvider");
  }
  return context;
};

export default DriverAuthContext;
