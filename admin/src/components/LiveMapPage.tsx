import React, { useMemo, useState, useEffect } from "react";
import { 
    MapPin, 
    Navigation, 
    RefreshCw, 
    Info, 
    User, 
    Car,
    Phone,
    Map as MapIcon,
    AlertCircle
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

const ACTIVE_STATUSES = ["accepted", "driver_assigned", "arrived", "started", "waiting", "return_ride_started"];

const LiveMapPage: React.FC = () => {
  const { bookings, loading, refreshing, lastSync, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const error = contextError;

  const liveBookings = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
      return bookings.filter((b) => {
        if (!ACTIVE_STATUSES.includes(b.status)) return false;
        if (terms.length === 0) return true;
        const haystack = [b._id, b.status, b.user?.name, b.driver?.name, b.pickupLocation, b.dropLocation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    },
    [bookings, searchParams]
  );

  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const totalPages = Math.max(1, Math.ceil(liveBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedLiveBookings = useMemo(
    () => liveBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [liveBookings, safePage]
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Live Operations</h1>
          <div className="flex items-center gap-3 mt-1">
             <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                {liveBookings.length} Active Trips
             </span>
             <p className="text-gray-400 text-xs">Last sync: {lastSync}</p>
          </div>
        </div>
        <button 
            onClick={() => refreshAll()} 
            disabled={refreshing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg shadow-gray-200 hover:scale-[1.02] transition-all active:scale-[0.98] ${refreshing ? 'opacity-70' : ''}`}
        >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Map'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {paginatedLiveBookings.map((b) => {
          const lat = Number(b.driver?.latitude || b.pickupLatitude || 0);
          const lon = Number(b.driver?.longitude || b.pickupLongitude || 0);
          const isTracking = trackingId === b._id;

          return (
            <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
               {/* Top Bar: IDs and Status */}
               <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-4">
                     <span className="text-xs font-mono font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">#{b._id.slice(-8).toUpperCase()}</span>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        b.status === 'started' ? 'bg-blue-100 text-blue-700' : 
                        b.status === 'arrived' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                     }`}>
                        {b.status.replace('_', ' ')}
                     </span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-400 font-medium">OTP:</span>
                     <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-xs font-bold font-mono tracking-widest">{b.otp || '----'}</span>
                  </div>
               </div>

               <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* info Grid */}
                     <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* User & Driver */}
                        <div className="space-y-4">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                 <User size={10} /> Passenger Details
                              </p>
                              <p className="font-bold text-gray-900">{b.user?.name || "Premium User"}</p>
                              <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                 <Phone size={10} /> {b.user?.mobile || "N/A"}
                              </p>
                           </div>
                           <div className="pt-2 border-t border-gray-50">
                              <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                 <Car size={10} /> Driver Assigned
                              </p>
                              <p className="font-bold text-gray-900">{b.driver?.name || "Finding Driver..."}</p>
                              <p className="text-xs text-gray-500 font-medium">{b.driver?.vehicleModel} • {b.driver?.vehicleNumber}</p>
                           </div>
                        </div>

                        {/* Location Detail */}
                        <div className="space-y-4 border-l border-gray-50 pl-8">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                 <MapPin size={10} className="text-green-500" /> Start Point
                              </p>
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">{b.pickupLocation || "Loading location..."}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                 <Navigation size={10} className="text-red-500" /> Destination
                              </p>
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">{b.dropLocation || "Fetching destination..."}</p>
                           </div>
                        </div>
                     </div>

                     {/* Stats Sidebar */}
                     <div className="lg:col-span-4 bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between">
                        <div className="space-y-3">
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Trip Type:</span>
                              <span className="font-bold text-gray-900 capitalize">{b.rideType || 'Normal'}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Distance:</span>
                              <span className="font-bold text-gray-900">{b.distance || '0'} km</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Estimated Fare:</span>
                              <span className="font-bold text-gray-900 text-sm">Rs {b.totalFare || b.fare || '0'}</span>
                           </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                           <button 
                              onClick={() => setTrackingId(isTracking ? null : b._id)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                 isTracking ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-100' : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-900'
                              }`}
                           >
                              <MapIcon size={14} />
                              {isTracking ? 'Close Tracking' : 'Track Driver Live'}
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* tracking Drawer */}
                  {isTracking && (
                     <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gray-900 text-white">
                           <div className="flex items-center gap-6">
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Latitude</p>
                                 <p className="font-mono font-bold text-yellow-400">{b.driver?.latitude?.toFixed(6) || lat.toFixed(6) || 'N/A'}</p>
                              </div>
                              <div className="w-px h-8 bg-gray-800"></div>
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Longitude</p>
                                 <p className="font-mono font-bold text-yellow-400">{b.driver?.longitude?.toFixed(6) || lon.toFixed(6) || 'N/A'}</p>
                              </div>
                           </div>
                           <a 
                              href={`https://www.google.com/maps?q=${b.driver?.latitude || lat},${b.driver?.longitude || lon}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-yellow-400 transition-all flex items-center gap-2"
                           >
                              <MapIcon size={14} /> View on Map
                           </a>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          );
        })}

        {!loading && liveBookings.length === 0 && (
           <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <Info className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-900 font-bold text-xl">No Active Rides</p>
              <p className="text-gray-500 mt-2 max-w-xs">There are no operational rides in progress at the moment.</p>
           </div>
        )}

        <div className="pt-6">
           <Pagination
             page={safePage}
             totalPages={totalPages}
             totalItems={liveBookings.length}
             pageSize={PAGE_SIZE}
             onPageChange={setPage}
           />
        </div>
      </div>
    </div>
  );
};

export default LiveMapPage;
