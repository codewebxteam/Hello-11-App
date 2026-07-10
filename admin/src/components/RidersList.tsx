import React, { useMemo, useState, useEffect } from "react";
import { Search, Car, RefreshCw, Star, Navigation } from "lucide-react";
import { useData, type DriverItem } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";
import DriverDetailModal from "./DriverDetailModal";

const RidersList: React.FC = () => {
  const { drivers, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const error = contextError;
  const fetchDrivers = refreshAll;

  // Modal State
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDriverClick = (driver: DriverItem) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const filteredDrivers = useMemo(() => {
    const terms = [(searchParams.get("q") || "").trim().toLowerCase(), search.trim().toLowerCase()]
      .filter(Boolean)
      .flatMap((s) => s.split(/\s+/).filter(Boolean));
    
    let result = drivers.filter((d) => {
      const status = d.online ? (d.available ? "Active" : "Busy") : "Offline";
      
      // Status Filter
      if (statusFilter !== "All" && statusFilter !== "High Dues") {
          if (statusFilter === "Online" && !d.online) return false;
          if (statusFilter === "Offline" && d.online) return false;
          if (statusFilter === "Busy" && (status !== "Busy")) return false;
      }

      const haystack = [d.name, d.mobile, d.vehicleModel, d.vehicleNumber, d._id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });

    if (statusFilter === "High Dues") {
        result.sort((a, b) => (Number(b.pendingCommission) || 0) - (Number(a.pendingCommission) || 0));
    }

    return result;
  }, [search, searchParams, drivers, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, searchParams, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedDrivers = useMemo(
    () => filteredDrivers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredDrivers, safePage]
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Driver Fleet</h1>
          <p className="text-slate-500 mt-1 font-medium">
            {loading ? "Syncing..." : `Monitoring ${filteredDrivers.length} verified partners`}
          </p>
        </div>
        
        <button
            onClick={() => fetchDrivers()}
            disabled={refreshing}
            className={`flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-sm uppercase tracking-wider ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {refreshing ? (
            <>
                <RefreshCw size={18} className="animate-spin text-blue-400" />
                Refreshing...
            </>
            ) : (
            <>
                <RefreshCw size={18} className="text-blue-400" />
                Sync Drivers
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
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, identifier, vehicle, or mobile..."
              className="w-full pl-14 pr-6 py-4 bg-transparent focus:outline-none text-slate-900 font-medium placeholder-slate-400 transition-all rounded-full"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar border-t md:border-t-0 md:border-l border-slate-100 md:pl-4 items-center">
              {["All", "Online", "Offline", "Busy", "High Dues"].map((f) => (
                 <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${statusFilter === f ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                 >
                    {f}
                 </button>
              ))}
          </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-5">
        {paginatedDrivers.map((driver) => {
          const status = driver.online ? (driver.available ? "Active" : "Busy") : "Offline";
          return (
            <div
              key={driver._id}
              onClick={() => handleDriverClick(driver)}
              className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Subtle accent line on left */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-2">
                <div className="flex items-start md:items-center space-x-6 flex-1 min-w-0">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-400 shadow-lg group-hover:scale-105 transition-transform group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Navigation size={28} strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase truncate">{driver.name || "Unknown Partner"}</h3>
                      <div className="flex gap-2">
                         <span className="bg-slate-100 text-slate-500 text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest whitespace-nowrap">
                           ID: {driver._id.slice(-6)}
                         </span>
                         <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest whitespace-nowrap border ${
                            status === "Active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                            status === "Busy" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-slate-100 text-slate-500 border-slate-200"
                         }`}>
                            {status}
                         </span>
                         <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest whitespace-nowrap border ${
                            driver.isVerified ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                         }`}>
                            {driver.isVerified ? "Verified" : "Pending"}
                         </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center text-xs text-slate-500 font-bold gap-x-5 gap-y-2 uppercase tracking-wide bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit">
                      <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-400" fill="currentColor" /> {driver.rating || '0.0'}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <span className="flex items-center gap-1.5"><Car size={14} /> {driver.vehicleModel}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <span className="text-slate-700">{driver.vehicleNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 lg:gap-10 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-10">
                  <div className="text-center md:text-right">
                    <div className="flex items-center gap-1.5 text-slate-900 font-black justify-center md:justify-end text-2xl leading-none">
                      <span>{driver.totalTrips || 0}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Total Trips</p>
                  </div>

                  <div className="text-center md:text-right min-w-[80px]">
                    <div className="flex items-center gap-1 text-rose-500 font-black justify-center md:justify-end text-2xl leading-none">
                      <span>₹{Number(driver.pendingCommission || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Pending</p>
                  </div>

                  <div className="text-center md:text-right">
                    <div className="flex items-center gap-1 text-emerald-500 font-black justify-center md:justify-end text-2xl leading-none">
                      <span>₹{Number(driver.totalEarnings || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Earnings</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filteredDrivers.length === 0 && (
          <div className="bg-white p-16 rounded-[2rem] border border-slate-100 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Navigation size={32} className="text-slate-300" />
            </div>
            <div>
                <p className="font-black text-slate-900 text-xl tracking-tight">No drivers match your criteria</p>
                <p className="text-slate-400 font-medium mt-1">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        )}

        <div className="mt-4">
            <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredDrivers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            />
        </div>
      </div>

      <DriverDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        driver={selectedDriver} 
      />
    </div>
  );
};

export default RidersList;
