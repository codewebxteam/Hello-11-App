import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { adminAPI } from "../services/api";

type Stats = {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalBookings: number;
  ongoingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
};

type Booking = {
  paymentStatus?: string;
  rideType?: string;
  status: string;
  totalFare?: number;
  fare?: number;
  returnTripFare?: number;
  penaltyApplied?: number;
  tollFee?: number;
};

const emptyStats: Stats = {
  totalUsers: 0,
  totalDrivers: 0,
  activeDrivers: 0,
  totalBookings: 0,
  ongoingTrips: 0,
  completedTrips: 0,
  cancelledTrips: 0,
  totalEarnings: 0,
};

const getAmount = (b: Booking) =>
  Number(b.totalFare ?? ((b.fare || 0) + (b.returnTripFare || 0) + (b.penaltyApplied || 0) + (b.tollFee || 0)));

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [statsRes, bookingsRes] = await Promise.all([adminAPI.getStats(), adminAPI.getBookings()]);
      setStats(statsRes.data?.stats || emptyStats);
      setBookings(bookingsRes.data?.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const derived = useMemo(() => {
    const total = stats.totalBookings || 0;
    const completionRate = total > 0 ? ((stats.completedTrips / total) * 100).toFixed(1) : "0.0";
    const cancellationRate = total > 0 ? ((stats.cancelledTrips / total) * 100).toFixed(1) : "0.0";
    const avgTicket = stats.completedTrips > 0 ? Math.round(stats.totalEarnings / stats.completedTrips) : 0;
    const paidCount = bookings.filter((b) => (b.paymentStatus || "").toLowerCase() === "paid").length;
    const paymentSuccessRate = total > 0 ? ((paidCount / total) * 100).toFixed(1) : "0.0";
    const outstationCount = bookings.filter((b) => b.rideType === "outstation").length;
    const localCount = bookings.filter((b) => b.rideType !== "outstation").length;
    const revenueFromList = bookings.reduce((sum, b) => sum + getAmount(b), 0);
    return { completionRate, cancellationRate, avgTicket, paymentSuccessRate, outstationCount, localCount, revenueFromList };
  }, [bookings, stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm">{loading ? "Loading..." : "Realtime analytics from bookings"}</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">Completion Rate</p><p className="text-3xl font-black">{derived.completionRate}%</p></div>
        <div className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">Cancellation Rate</p><p className="text-3xl font-black">{derived.cancellationRate}%</p></div>
        <div className="bg-white p-5 rounded-xl border border-gray-100"><p className="text-sm text-gray-500">Avg Ticket</p><p className="text-3xl font-black">Rs {derived.avgTicket.toLocaleString()}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={16} /> Ride Mix</h3>
          <div className="mt-4 space-y-3 text-sm">
            <p>Local Rides: <span className="font-semibold">{derived.localCount}</span></p>
            <p>Outstation Rides: <span className="font-semibold">{derived.outstationCount}</span></p>
            <p>Paid Bookings Rate: <span className="font-semibold">{derived.paymentSuccessRate}%</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900">Revenue Snapshot</h3>
          <div className="mt-4 space-y-3 text-sm">
            <p>Stats Revenue: <span className="font-semibold">Rs {Math.round(stats.totalEarnings).toLocaleString()}</span></p>
            <p>Bookings Derived Revenue: <span className="font-semibold">Rs {Math.round(derived.revenueFromList).toLocaleString()}</span></p>
            <p>Completed Trips: <span className="font-semibold">{stats.completedTrips}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
