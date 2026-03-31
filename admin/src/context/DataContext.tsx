import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { adminAPI } from '../services/api';

export type Stats = {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalBookings: number;
  ongoingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
};

export type Booking = {
  _id: string;
  status: string;
  discount?: number;
  hasReturnTrip?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  rideType?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
  createdAt: string;
  rideStartedAt?: string;
  rideCompletedAt?: string;
  fare?: number;
  totalFare?: number;
  distance?: number;
  duration?: number;
  tollFee?: number;
  penaltyApplied?: number;
  returnTripFare?: number;
  otp?: string;
  rating?: number;
  feedback?: string;
  user?: {
    name?: string;
    mobile?: string;
    email?: string;
  };
  driver?: {
    _id?: string;
    name?: string;
    mobile?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    vehicleColor?: string;
    vehicleType?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
  };
};

export type UserItem = {
  _id: string;
  name?: string;
  mobile?: string;
  email?: string;
  createdAt?: string;
  totalRides?: number;
  totalSpent?: number;
};

export type DriverItem = {
  _id: string;
  name?: string;
  mobile?: string;
  createdAt?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  available?: boolean;
  online?: boolean;
  latitude?: number;
  longitude?: number;
  documents?: {
    license?: string;
    insurance?: string;
    registration?: string;
  };
};

interface DataContextType {
  stats: Stats;
  bookings: Booking[];
  users: UserItem[];
  drivers: DriverItem[];
  loading: boolean;
  refreshing: boolean;
  lastSync: string;
  error: string | null;
  refreshAll: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
}

const EMPTY_STATS: Stats = {
  totalUsers: 0,
  totalDrivers: 0,
  activeDrivers: 0,
  totalBookings: 0,
  ongoingTrips: 0,
  completedTrips: 0,
  cancelledTrips: 0,
  totalEarnings: 0,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState("-");
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data?.stats || EMPTY_STATS);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    try {
      const res = await adminAPI.getBookings();
      setBookings(res.data?.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
      try {
          const res = await adminAPI.getUsers();
          setUsers(res.data?.users || []);
      } catch (err) {
          console.error("Failed to fetch users", err);
      }
  }, []);

  const refreshDrivers = useCallback(async () => {
      try {
          const res = await adminAPI.getDrivers();
          setDrivers(res.data?.drivers || []);
      } catch (err) {
          console.error("Failed to fetch drivers", err);
      }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        refreshStats(),
        refreshBookings(),
        refreshUsers(),
        refreshDrivers()
      ]);
      setLastSync(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshStats, refreshBookings, refreshUsers, refreshDrivers]);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
        // Silently refresh in background
        refreshAll();
    }, 30000); 
    return () => clearInterval(interval);
  }, [refreshAll]);

  return (
    <DataContext.Provider value={{
      stats,
      bookings,
      users,
      drivers,
      loading,
      refreshing,
      lastSync,
      error,
      refreshAll,
      refreshStats,
      refreshBookings,
      refreshUsers,
      refreshDrivers
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
