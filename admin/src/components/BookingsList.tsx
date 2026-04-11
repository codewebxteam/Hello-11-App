import React, { useEffect, useMemo, useState } from "react";
import { Search, Clock, User, Car, RefreshCw } from "lucide-react";
import { useData, type Booking } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";
import BookingDetailModal from "./BookingDetailModal";
import { getBookingTotalFare } from "../utils/fare";

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

const getAmount = (b: Booking) => getBookingTotalFare(b);

const BookingsList: React.FC = () => {
  const { bookings, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const error = contextError;
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const fetchBookings = refreshAll;

  // Handle status filter from URL if present
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
        setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const statuses = useMemo(() => {
    const unique = Array.from(new Set(bookings.map((b) => b.status)));
    return ["all", ...unique];
  }, [bookings]);

  const filtered = useMemo(() => {
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const searchTerms = [query, search.trim().toLowerCase()]
      .filter(Boolean)
      .flatMap((s) => s.split(/\s+/).filter(Boolean));
      
    return bookings.filter((b) => {
      // Apply status filter (ongoing is a special case from dashboard)
      const isOngoing = statusFilter === "ongoing" && ["started", "accepted", "arrived", "waiting"].includes(b.status);
      const statusOk = statusFilter === "all" || b.status === statusFilter || isOngoing;
      
      if (!statusOk) return false;
      if (searchTerms.length === 0) return true;
      
      const haystack = [b._id, b.user?.name, b.user?.mobile, b.pickupLocation, b.dropLocation, b.driver?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchTerms.every((t) => haystack.includes(t));
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {loading ? "Loading records..." : `Managing ${filtered.length} booking records`}
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          disabled={refreshing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-100 hover:shadow-xl transition-all active:scale-95 text-sm uppercase tracking-wider ${refreshing ? 'opacity-70' : ''}`}
        >
          {refreshing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh List"
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          {error}
        </div>
      )}

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, Customer Name, Mobile, Route..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-400 shadow-sm placeholder-gray-400 font-medium transition-all"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              statusFilter === status
                ? "bg-black border-black text-white shadow-lg"
                : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {status === "all" ? "All Journeys" : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paginatedBookings.map((booking) => {
          const statusClass = STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-700";
          return (
            <div 
                key={booking._id} 
                onClick={() => setSelectedBooking(booking)}
                className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-200/50 transition-all cursor-pointer hover:-translate-y-1"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="space-y-5 flex-1 min-w-0">
                  <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                    <h3 className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-yellow-600 transition-colors uppercase truncate">
                      Ride with {booking.user?.name || "Private User"}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${statusClass}`}>
                         {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="flex flex-col justify-center space-y-3">
                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                           <span className="font-medium text-gray-600 line-clamp-1 text-xs">{booking.pickupLocation || "N/A"}</span>
                         </div>
                         <div className="flex items-start gap-3">
                           <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                           <span className="font-medium text-gray-600 line-clamp-1 text-xs">{booking.dropLocation || "N/A"}</span>
                         </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-yellow-600">
                            <User size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-900 font-bold text-xs uppercase">{booking.user?.name || "Anonymous"}</span>
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tight">{booking.user?.mobile || "No Mobile"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400">
                            <Car size={14} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-gray-700 font-bold text-xs uppercase">{booking.driver?.name || "Awaiting Partner"}</span>
                           <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tight">{booking.driver?.vehicleNumber || "---"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-500">{booking.rideType || 'Standard'} Ride</span>
                  </div>
                </div>

                <div className="flex lg:flex-col justify-between items-end gap-2 lg:min-w-[140px] border-t lg:border-t-0 lg:border-l border-gray-50 pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fare</p>
                    <p className="text-xl font-bold text-gray-900 tracking-tight">₹{Math.round(getAmount(booking)).toLocaleString()}</p>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
                      View Profile
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center space-y-3">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-900 text-lg">No journeys found</p>
            <p className="text-gray-400 font-medium">Try adjusting your filters or search terms.</p>
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

      {/* Detail Modal */}
      <BookingDetailModal 
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
      />
    </div>
  );
};

export default BookingsList;

