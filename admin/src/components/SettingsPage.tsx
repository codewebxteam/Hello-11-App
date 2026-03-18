import React, { useCallback, useEffect, useState } from "react";
import { Settings, Server } from "lucide-react";
import { adminAPI } from "../services/api";

type Stats = {
  totalUsers: number;
  totalDrivers: number;
  totalBookings: number;
};

const SettingsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalDrivers: 0, totalBookings: 0 });
  const [lastSync, setLastSync] = useState<string>("-");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await adminAPI.getStats();
      setStats({
        totalUsers: res.data?.stats?.totalUsers || 0,
        totalDrivers: res.data?.stats?.totalDrivers || 0,
        totalBookings: res.data?.stats?.totalBookings || 0,
      });
      setLastSync(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings diagnostics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">{loading ? "Loading..." : "Realtime system diagnostics"}</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Server size={16} /> Backend Connection</h3>
          <p className="text-sm text-gray-600 mt-3 break-all">{backendUrl}</p>
          <p className="text-xs text-gray-500 mt-2">Last Sync: {lastSync}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Settings size={16} /> Database Snapshot</h3>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p>Total Users: <span className="font-semibold">{stats.totalUsers}</span></p>
            <p>Total Drivers: <span className="font-semibold">{stats.totalDrivers}</span></p>
            <p>Total Bookings: <span className="font-semibold">{stats.totalBookings}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
