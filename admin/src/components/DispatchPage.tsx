import React, { useMemo, useState, useEffect } from "react";
import { ListRestart, Truck, User, RefreshCw, Navigation, Activity, ShieldCheck, Clock, Star, Car } from "lucide-react";
import { useData } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

const DispatchPage: React.FC = () => {
  const { bookings, drivers, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 8;
  const [searchParams] = useSearchParams();
  const [pendingPage, setPendingPage] = useState(1);
  const [driverPage, setDriverPage] = useState(1);
  const error = contextError;
  const fetchData = refreshAll;

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

  useEffect(() => {
    setPendingPage(1);
    setDriverPage(1);
  }, [searchParams]);

  const pendingTotalPages = Math.max(1, Math.ceil(pendingBookings.length / PAGE_SIZE));
  const safePendingPage = Math.min(pendingPage, pendingTotalPages);
  const paginatedPending = useMemo(
    () => pendingBookings.slice((safePendingPage - 1) * PAGE_SIZE, safePendingPage * PAGE_SIZE),
    [pendingBookings, safePendingPage]
  );

  const driverTotalPages = Math.max(1, Math.ceil(availableDrivers.length / PAGE_SIZE));
  const safeDriverPage = Math.min(driverPage, driverTotalPages);
  const paginatedDrivers = useMemo(
    () => availableDrivers.slice((safeDriverPage - 1) * PAGE_SIZE, safeDriverPage * PAGE_SIZE),
    [availableDrivers, safeDriverPage]
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Activity className="text-yellow-500" size={32} /> Dispatch
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Realtime queue monitoring and manual matching</p>
        </div>
        <button 
          onClick={() => fetchData()} 
          disabled={refreshing}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-black text-white text-sm font-bold shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all active:scale-[0.98] ${refreshing ? 'opacity-70' : ''}`}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Refresh Queue'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-1">
          <ShieldCheck size={18} className="text-red-400" />
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <Navigation size={28} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Trips</p>
              <p className="text-3xl font-black text-gray-900 leading-none mt-1">{pendingBookings.length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={28} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Partners</p>
              <p className="text-3xl font-black text-gray-900 leading-none mt-1">{availableDrivers.length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Activity size={28} />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Queue Status</p>
              <p className="text-xl font-black text-gray-900 leading-none mt-1 uppercase tracking-tight">{pendingBookings.length === 0 ? "Optimized" : "Action Required"}</p>
           </div>
        </div>
      </div>

      {/* Main Content Sections (Stacked instead of 2-Column) */}
      <div className="space-y-8">
        
        {/* Available Drivers Section (Top) */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between border-b border-gray-50 pb-5">
              <h3 className="font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5 text-sm">
                 <Truck size={18} className="text-green-500" /> Reliable Partners (Online)
              </h3>
              <span className="text-[10px] font-bold text-gray-400">{availableDrivers.length} available</span>
           </div>

           {/* Horizontal Swipeable Ribbon for Partners */}
           <div className="flex items-center gap-4 overflow-x-auto pb-6 snap-x [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-yellow-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-yellow-500 transition-colors">
             {paginatedDrivers.map((d) => (
               <div key={d._id} className="min-w-[300px] max-w-[320px] p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-yellow-400 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group snap-start gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                     <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-yellow-400 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        <Car size={22} />
                     </div>
                     <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-gray-900 text-[13px] tracking-tight truncate">{d.name || "Unknown"}</p>
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-100 shrink-0"></div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{d.vehicleModel || d.vehicleType || "Partner"}</span>
                           <span className="text-[10px] text-gray-300 shrink-0">•</span>
                           <div className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                              <Star size={12} fill="currentColor" />
                              <span className="text-[10px] font-bold text-gray-700">{d.rating || '5.0'}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                  <button className="text-[11px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-colors px-4 py-2 rounded-lg shadow-sm shrink-0 whitespace-nowrap">
                      Dispatch
                  </button>
               </div>
             ))}
           </div>

           {!loading && availableDrivers.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                 <ShieldCheck className="text-gray-200 mx-auto mb-3" size={32} />
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No available help</p>
              </div>
           )}

           {availableDrivers.length > 0 && (
               <div className="pt-2">
                  <Pagination
                    page={safeDriverPage}
                    totalPages={driverTotalPages}
                    totalItems={availableDrivers.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setDriverPage}
                  />
               </div>
           )}
        </div>

        {/* Pending Journeys Section (Bottom) */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-5">
            <h3 className="font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5 text-sm">
               <ListRestart size={18} className="text-yellow-500" /> Pending Journeys
            </h3>
            <span className="text-[10px] font-bold text-gray-400">{pendingBookings.length} total</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedPending.map((b) => (
              <div key={b._id} className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-yellow-400 hover:shadow-md transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                          <User size={20} />
                       </div>
                       <div>
                          <p className="font-bold text-gray-900 tracking-tight">{b.user?.name || "Private User"}</p>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase tracking-widest">Pending Match</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{b.rideType || "standard"} ride</span>
                          </div>
                       </div>
                    </div>
                    <button className="text-[11px] font-bold text-white bg-black hover:bg-gray-800 transition-colors px-4 py-2 rounded-lg shadow-sm whitespace-nowrap">
                       Assign Manual
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group-hover:border-yellow-100 transition-colors">
                    <div className="flex flex-col items-center gap-1 justify-center shrink-0">
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm ring-1 ring-gray-200"></div>
                       <div className="w-0.5 h-4 bg-gray-200 rounded-full"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow-sm ring-1 ring-gray-200"></div>
                    </div>
                    <div className="flex flex-col gap-3 min-w-0 flex-1">
                       <span className="text-xs font-bold text-gray-700 truncate">{b.pickupLocation?.split(',')[0] || "Origin"}</span>
                       <span className="text-xs font-bold text-gray-700 truncate">{b.dropLocation?.split(',')[0] || "Destination"}</span>
                    </div>
                 </div>

                 <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> Requested: {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
              </div>
            ))}
          </div>

          {!loading && pendingBookings.length === 0 && (
             <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <Clock className="text-gray-200 mx-auto mb-3" size={40} />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Queue Clear</p>
             </div>
          )}
          
          {pendingBookings.length > 0 && (
             <div className="pt-2">
                <Pagination
                  page={safePendingPage}
                  totalPages={pendingTotalPages}
                  totalItems={pendingBookings.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPendingPage}
                />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatchPage;
