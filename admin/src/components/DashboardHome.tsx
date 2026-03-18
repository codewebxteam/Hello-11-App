import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Car, CreditCard, Navigation, Users, Map, XCircle } from "lucide-react";
import { adminAPI } from "../services/api";
import Pagination from "./Pagination";

type DashboardStats = {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalBookings: number;
  ongoingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
};

type BookingItem = {
  _id: string;
  status: string;
  createdAt: string;
  pickupLocation?: string;
  dropLocation?: string;
  fare?: number;
  totalFare?: number;
  returnTripFare?: number;
  penaltyApplied?: number;
  tollFee?: number;
  user?: {
    name?: string;
  };
};

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalDrivers: 0,
  activeDrivers: 0,
  totalBookings: 0,
  ongoingTrips: 0,
  completedTrips: 0,
  cancelledTrips: 0,
  totalEarnings: 0,
};

const formatAmount = (value: number) => `Rs ${Math.round(value).toLocaleString()}`;

const getBookingAmount = (b: BookingItem) =>
  Number(b.totalFare ?? ((b.fare || 0) + (b.returnTripFare || 0) + (b.penaltyApplied || 0) + (b.tollFee || 0)));

const DashboardHome: React.FC = () => {
  const PAGE_SIZE = 10;
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const [statsRes, bookingsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getBookings(),
      ]);
      setStats(statsRes.data?.stats || EMPTY_STATS);
      setRecentBookings(bookingsRes.data?.bookings || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load realtime dashboard data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const totalPages = Math.max(1, Math.ceil(recentBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecentBookings = useMemo(
    () => recentBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [recentBookings, safePage]
  );

  const cards = useMemo(
    () => [
      { title: "Total Bookings", value: stats.totalBookings, icon: Car, color: "bg-yellow-400 text-black" },
      { title: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-green-100 text-green-700" },
      { title: "Active Drivers", value: stats.activeDrivers, icon: Navigation, color: "bg-blue-100 text-blue-700" },
      { title: "Total Earnings", value: formatAmount(stats.totalEarnings), icon: CreditCard, color: "bg-yellow-100 text-yellow-700" },
      { title: "Ongoing Trips", value: stats.ongoingTrips, icon: Map, color: "bg-purple-100 text-purple-700" },
      { title: "Cancelled Trips", value: stats.cancelledTrips, icon: XCircle, color: "bg-red-100 text-red-700" },
    ],
    [stats]
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Realtime overview from database.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="text-sm font-semibold text-gray-900 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4"
          >
            <div className={`p-4 rounded-full ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm text-gray-500">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Recent Bookings (Realtime)</h3>
          <span className="text-xs text-gray-500">{recentBookings.length} records</span>
        </div>
        <div className="p-4 space-y-4">
          {recentBookings.length === 0 && !loading && (
            <p className="text-sm text-gray-500">No booking data found.</p>
          )}
          {paginatedRecentBookings.map((booking) => (
            <div key={booking._id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-gray-900">{booking.user?.name || "Unknown User"}</p>
                <p className="text-xs text-gray-500">
                  {booking.pickupLocation || "--"} to {booking.dropLocation || "--"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatAmount(getBookingAmount(booking))}</p>
                <p className="text-xs text-gray-500 uppercase">{booking.status}</p>
              </div>
            </div>
          ))}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={recentBookings.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
