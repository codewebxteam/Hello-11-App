import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ListRestart, Truck, User } from "lucide-react";
import { adminAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";

type BookingItem = {
  _id: string;
  status: string;
  pickupLocation?: string;
  dropLocation?: string;
  rideType?: string;
  user?: { name?: string };
  driver?: { name?: string };
};

type DriverItem = {
  _id: string;
  name?: string;
  available?: boolean;
  online?: boolean;
  vehicleType?: string;
};

const DispatchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [bookingsRes, driversRes] = await Promise.all([adminAPI.getBookings(), adminAPI.getDrivers()]);
      setBookings(bookingsRes.data?.bookings || []);
      setDrivers(driversRes.data?.drivers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dispatch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pendingBookings = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
      return bookings.filter((b) => {
        if (!["pending", "driver_assigned"].includes(b.status) || !!b.driver) return false;
        if (terms.length === 0) return true;
        const haystack = [b._id, b.status, b.rideType, b.user?.name, b.pickupLocation, b.dropLocation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    },
    [bookings, searchParams]
  );
  const availableDrivers = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
      return drivers.filter((d) => {
        if (!(d.online && d.available)) return false;
        if (terms.length === 0) return true;
        const haystack = [d._id, d.name, d.vehicleType].filter(Boolean).join(" ").toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    },
    [drivers, searchParams]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispatch</h1>
          <p className="text-gray-500 mt-1 text-sm">{loading ? "Loading..." : "Realtime dispatch queue"}</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <p className="text-3xl font-black text-gray-900">{pendingBookings.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Available Drivers</p>
          <p className="text-3xl font-black text-gray-900">{availableDrivers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Auto-Match Health</p>
          <p className="text-3xl font-black text-gray-900">{pendingBookings.length === 0 ? "Good" : "Queue"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><ListRestart size={16} /> Pending Bookings</h3>
          <div className="mt-4 space-y-3">
            {pendingBookings.map((b) => (
              <div key={b._id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="font-semibold text-sm text-gray-900">{b.user?.name || "User"} • {b.rideType || "normal"}</p>
                <p className="text-xs text-gray-600">{b.pickupLocation || "-"} to {b.dropLocation || "-"}</p>
                <p className="text-[11px] text-gray-500 uppercase mt-1">Status: {b.status}</p>
              </div>
            ))}
            {!loading && pendingBookings.length === 0 && <p className="text-sm text-gray-500">No pending bookings.</p>}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Truck size={16} /> Available Drivers</h3>
          <div className="mt-4 space-y-3">
            {availableDrivers.map((d) => (
              <div key={d._id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <User size={14} /> {d.name || "Driver"}
                </p>
                <p className="text-xs text-gray-600">Vehicle: {d.vehicleType || "5seater"}</p>
              </div>
            ))}
            {!loading && availableDrivers.length === 0 && <p className="text-sm text-gray-500">No drivers available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchPage;
