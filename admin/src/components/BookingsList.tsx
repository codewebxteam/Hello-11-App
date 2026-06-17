import React, { useEffect, useMemo, useState } from "react";
import { Search, Clock, User, Car, RefreshCw, Navigation, MapPin } from "lucide-react";
import { useData, type Booking } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";
import BookingDetailModal from "./BookingDetailModal";
import { getBookingTotalFare } from "../utils/fare";
import { adminAPI } from "../services/api"; 

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  started: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-indigo-100 text-indigo-700 border-indigo-200",
  arrived: "bg-cyan-100 text-cyan-700 border-cyan-200",
  waiting: "bg-purple-100 text-purple-700 border-purple-200",
  return_ride_started: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
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

  const handleForceCancel = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation(); 
    
    if (!window.confirm("Are you sure you want to force cancel this ride? This action cannot be undone.")) {
      return;
    }

    try {
      await adminAPI.cancelBooking(bookingId);
      alert("Ride cancelled successfully by Admin.");
      refreshAll(); 
    } catch (err: any) {
      console.error("Failed to force cancel:", err);
      const errorMessage = err.response?.data?.message || "Failed to cancel the ride. Please check API.";
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Booking Log</h1>
          <p className="text-slate-500 mt-1 font-medium">
            {loading ? "Loading records..." : `Managing ${filtered.length} booking records`}
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          disabled={refreshing}
          className={`flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-sm uppercase tracking-wider ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {refreshing ? (
            <>
              <RefreshCw size={18} className="animate-spin text-yellow-400" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="text-yellow-400" />
              Sync Bookings
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
          {error}
        </div>
      )}

      {/* Premium Search & Filter Bar */}
      <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Customer Name, Mobile, Route..."
              className="w-full pl-14 pr-6 py-4 bg-transparent focus:outline-none text-slate-900 font-medium placeholder-slate-400 transition-all rounded-full"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar border-t md:border-t-0 md:border-l border-slate-100 md:pl-4 items-center">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md shadow-yellow-500/20 scale-105"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {status === "all" ? "All" : status.replace('_', ' ')}
              </button>
            ))}
          </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {paginatedBookings.map((booking) => {
          const statusClass = STATUS_COLORS[booking.status] || "bg-slate-100 text-slate-700 border-slate-200";
          const isCancellable = !["completed", "cancelled"].includes(booking.status);

          return (
            <div 
                key={booking._id} 
                onClick={() => setSelectedBooking(booking)}
                className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Subtle accent line on left */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col lg:flex-row justify-between gap-6 pl-2">
                <div className="space-y-6 flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row items-start justify-between lg:items-center lg:gap-4 mb-2">
                    <h3 className="font-black text-slate-900 text-2xl md:text-3xl tracking-tight group-hover:text-yellow-600 transition-colors uppercase truncate">
                      Ride with {booking.user?.name || "Private User"}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${statusClass}`}>
                         {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 text-sm">
                    {/* Route Section */}
                    <div className="flex flex-col justify-center space-y-5">
                         <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 shadow-sm border border-emerald-100">
                               <MapPin size={20} />
                           </div>
                           <div className="flex flex-col">
                               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pickup</span>
                               <span className="font-bold text-slate-800 text-base md:text-lg line-clamp-2 leading-tight mt-0.5">{booking.pickupLocation || "N/A"}</span>
                           </div>
                         </div>
                         <div className="ml-5 w-0.5 h-6 bg-slate-200 -my-3"></div>
                         <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-500 shadow-sm border border-rose-100">
                               <MapPin size={20} />
                           </div>
                           <div className="flex flex-col">
                               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Dropoff</span>
                               <span className="font-bold text-slate-800 text-base md:text-lg line-clamp-2 leading-tight mt-0.5">{booking.dropLocation || "N/A"}</span>
                           </div>
                         </div>
                    </div>
                    
                    {/* People Section */}
                    <div className="flex flex-col gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-yellow-600 border border-slate-100">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-900 font-black text-base md:text-lg uppercase">{booking.user?.name || "Anonymous"}</span>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{booking.user?.mobile || "No Mobile"}</span>
                        </div>
                      </div>
                      <div className="w-full h-px bg-slate-200/60"></div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500 border border-slate-100">
                            <Car size={20} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-slate-800 font-black text-base md:text-lg uppercase">{booking.driver?.name || "Awaiting Partner"}</span>
                           <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{booking.driver?.vehicleNumber || "---"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 self-start px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-yellow-500" /> {new Date(booking.createdAt).toLocaleString()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-slate-600 flex items-center gap-1.5">
                        <Navigation size={14} className="text-blue-500" /> {booking.rideType || 'Standard'} Ride
                    </span>
                  </div>
                </div>

                <div className="flex lg:flex-col justify-between items-end gap-3 lg:min-w-[160px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Fare</p>
                    <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">₹{Math.round(getAmount(booking)).toLocaleString()}</p>
                    {(booking.tollFee || 0) > 0 && (
                        <span className="mt-2 text-[11px] font-black bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                            + Tolls Included
                        </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 mt-auto w-full">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                        View Details →
                    </button>
                    {isCancellable && (
                      <button 
                        onClick={(e) => handleForceCancel(e, booking._id)}
                        className="w-full text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 py-2.5 rounded-xl transition-all duration-300 active:scale-95"
                      >
                          Cancel Ride
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="bg-white p-16 rounded-[2rem] border border-slate-100 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Search size={32} className="text-slate-300" />
            </div>
            <div>
                <p className="font-black text-slate-900 text-xl tracking-tight">No journeys found</p>
                <p className="text-slate-400 font-medium mt-1">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        )}

        <div className="mt-4">
            <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            />
        </div>
      </div>

      <BookingDetailModal 
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
      />
    </div>
  );
};

export default BookingsList;