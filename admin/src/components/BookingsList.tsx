import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, CheckCircle, Clock, User, Car } from "lucide-react";
import { adminAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

type BookingItem = {
  _id: string;
  status: string;
  paymentStatus?: string;
  pickupLocation?: string;
  dropLocation?: string;
  createdAt: string;
  fare?: number;
  totalFare?: number;
  returnTripFare?: number;
  penaltyApplied?: number;
  tollFee?: number;
  user?: {
    name?: string;
    mobile?: string;
  };
  driver?: {
    name?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
  };
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  started: "bg-blue-100 text-blue-700",
  accepted: "bg-blue-100 text-blue-700",
  arrived: "bg-blue-100 text-blue-700",
  waiting: "bg-purple-100 text-purple-700",
  return_ride_started: "bg-purple-100 text-purple-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAY_COLORS: Record<string, string> = {
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
};

const getAmount = (b: BookingItem) =>
  Number(b.totalFare ?? ((b.fare || 0) + (b.returnTripFare || 0) + (b.penaltyApplied || 0) + (b.tollFee || 0)));

const BookingsList: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setError("");
      const response = await adminAPI.getBookings();
      setBookings(response.data?.bookings || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load bookings.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const statuses = useMemo(() => {
    const unique = Array.from(new Set(bookings.map((b) => b.status)));
    return ["all", ...unique];
  }, [bookings]);

  const filtered = useMemo(() => {
    const terms = [(searchParams.get("q") || "").trim().toLowerCase(), search.trim().toLowerCase()]
      .filter(Boolean)
      .flatMap((s) => s.split(/\s+/).filter(Boolean));
    return bookings.filter((b) => {
      const statusOk = statusFilter === "all" || b.status === statusFilter;
      if (!statusOk) return false;
      if (terms.length === 0) return true;
      const haystack = [b._id, b.user?.name, b.user?.mobile, b.pickupLocation, b.dropLocation, b.driver?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [bookings, search, searchParams, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, searchParams, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBookings = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "Loading..." : `${filtered.length} bookings`}
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking ID, customer, phone, route..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm placeholder-gray-400"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg border text-sm whitespace-nowrap ${
              statusFilter === status
                ? "bg-yellow-100 border-yellow-300 text-gray-900"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {status === "all" ? "All Status" : status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {paginatedBookings.map((booking) => {
          const statusClass = STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-700";
          const paymentStatus = booking.paymentStatus || "pending";
          const payClass = PAY_COLORS[paymentStatus] || "bg-gray-100 text-gray-700 border-gray-200";
          return (
            <div key={booking._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                    <h3 className="font-bold text-gray-900 text-lg">{booking._id}</h3>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 ${statusClass}`}>
                        <CheckCircle size={12} /> {booking.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-bold border ${payClass}`}>
                        {paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="font-medium text-gray-900">{booking.pickupLocation || "-"}</span>
                        </div>
                        <div className="w-0.5 h-3 bg-gray-300 ml-0.5"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="font-medium text-gray-900">{booking.dropLocation || "-"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-medium">{booking.user?.name || "Unknown User"}</span>
                        <span className="text-gray-400 text-xs">({booking.user?.mobile || "-"})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-gray-400" />
                        <span className="text-gray-700">
                          {booking.driver?.vehicleModel || "Vehicle N/A"}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-xs">
                          Driver: {booking.driver?.name || "Not Assigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      <Clock size={12} /> {new Date(booking.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex lg:flex-col justify-between items-end gap-4 lg:min-w-[140px]">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">Rs {Math.round(getAmount(booking)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-sm text-gray-500">
            No bookings found.
          </div>
        )}

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default BookingsList;
