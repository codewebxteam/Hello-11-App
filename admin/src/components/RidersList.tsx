import React, { useMemo, useState, useEffect } from "react";
import { Search, Car, RefreshCw, Star, User, Info } from "lucide-react";
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
    
    return drivers.filter((d) => {
      const status = d.online ? (d.available ? "Active" : "Busy") : "Offline";
      
      // Status Filter
      if (statusFilter !== "All" && status !== statusFilter && !(statusFilter === "Online" && (status === "Active" || status === "Busy"))) {
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
    <div className="space-y-6 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Driver Management</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            {loading ? "Syncing..." : `Monitoring ${filteredDrivers.length} verified partners`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           {/* status Filters */}
           <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              {["All", "Online", "Offline", "Busy"].map((f) => (
                 <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                    {f}
                 </button>
              ))}
           </div>

           <button
             onClick={() => fetchDrivers()}
             disabled={refreshing}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg shadow-gray-200 hover:scale-[1.02] transition-all active:scale-[0.98] ${refreshing ? 'opacity-70' : ''}`}
           >
             <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
             {refreshing ? 'Refreshing...' : 'Refresh'}
           </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
          <Info size={18} />
          {error}
        </div>
      )}

      {/* search input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, identifier, vehicle, or mobile number..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-400 shadow-sm transition-all text-sm font-medium"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedDrivers.map((driver) => {
          const status = driver.online ? (driver.available ? "Active" : "Busy") : "Offline";
          return (
            <div
              key={driver._id}
              onClick={() => handleDriverClick(driver)}
              className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-start md:items-center space-x-5 flex-1 min-w-0">
                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex-shrink-0 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform">
                  <Car size={28} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-yellow-600 transition-colors uppercase truncate">{driver.name || "Unknown Partner"}</h3>
                    <div className="flex gap-2">
                       <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded font-mono font-black uppercase tracking-widest whitespace-nowrap">
                         ID: {driver._id.slice(-6).toUpperCase()}
                       </span>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest whitespace-nowrap ${
                          status === "Active" ? "bg-green-100 text-green-700" : 
                          status === "Busy" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"
                       }`}>
                          {status}
                       </span>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest whitespace-nowrap ${
                          driver.isVerified ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                       }`}>
                          {driver.isVerified ? "Verified" : "Pending"}
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center text-xs text-gray-400 font-bold gap-x-5 gap-y-1 mt-1.5 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><Star size={12} className="text-yellow-400" fill="currentColor" /> {driver.rating || '0.0'}</span>
                    <span className="flex items-center gap-1.5"><Car size={12} /> {driver.vehicleModel}</span>
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100 font-mono text-[10px]">{driver.vehicleNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10 border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-10">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-gray-900 font-black justify-end text-lg leading-none">
                    <span>{driver.totalTrips || 0}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Trips</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-900 font-black justify-end text-lg leading-none">
                    <span className="text-xs text-green-500 font-bold">₹</span>
                    <span>{Number(driver.totalEarnings || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Earnings</p>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filteredDrivers.length === 0 && (
          <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <User className="text-gray-200 mb-2" size={40} />
            <p className="text-gray-500 font-bold">No drivers match your criteria</p>
          </div>
        )}

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filteredDrivers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
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
