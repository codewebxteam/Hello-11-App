import React, { useMemo, useState, useEffect } from "react";
import { Star, RefreshCw, Filter, TrendingUp, IndianRupee, Car, ShieldAlert, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useData } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

type FilterTier = "All" | "Top" | "Good" | "Needs Review";
type SortOption = "rating_desc" | "rating_asc" | "trips_desc" | "earnings_desc";

const RatingsPage: React.FC = () => {
  const { drivers, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filterTier, setFilterTier] = useState<FilterTier>("All");
  const [sortBy, setSortBy] = useState<SortOption>("rating_desc");
  
  const error = contextError;
  const fetchData = refreshAll;

  const sortedAndFiltered = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
        
      const filtered = drivers.filter((d) => {
        // Text Search
        if (terms.length > 0) {
           const haystack = [d._id, d.name].filter(Boolean).join(" ").toLowerCase();
           if (!terms.every((t) => haystack.includes(t))) return false;
        }

        // Tier Filter
        const rating = Number(d.rating || 0);
        let tier: FilterTier = "Needs Review";
        if (rating >= 4.8) tier = "Top";
        else if (rating >= 4.0) tier = "Good";

        if (filterTier !== "All" && tier !== filterTier) return false;
        
        return true;
      });

      return [...filtered].sort((a, b) => {
         if (sortBy === "rating_desc") return Number(b.rating || 0) - Number(a.rating || 0);
         if (sortBy === "rating_asc") return Number(a.rating || 0) - Number(b.rating || 0);
         if (sortBy === "trips_desc") return Number(b.totalTrips || 0) - Number(a.totalTrips || 0);
         if (sortBy === "earnings_desc") return Number(b.totalEarnings || 0) - Number(a.totalEarnings || 0);
         return 0;
      });
    },
    [drivers, searchParams, filterTier, sortBy]
  );

  useEffect(() => {
    setPage(1);
  }, [searchParams, filterTier, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFiltered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedDrivers = useMemo(
    () => sortedAndFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedAndFiltered, safePage]
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Star className="text-yellow-500" size={32} fill="currentColor" /> Fleet Ratings
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Monitor partner performance, tiers, and lifetime metrics</p>
        </div>
        <button 
          onClick={() => fetchData()} 
          disabled={refreshing}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-black text-white text-sm font-bold shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all active:scale-[0.98] ${refreshing ? 'opacity-70' : ''}`}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="text-red-400" />
          {error}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         {/* Tier Toggles */}
         <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1.5"><Filter size={14} /> Tiers:</span>
            {[
               { id: "All", label: "All Partners", icon: null },
               { id: "Top", label: "Top (4.8+)", icon: <Award size={14} /> },
               { id: "Good", label: "Good (4.0+)", icon: <Star size={14} /> },
               { id: "Needs Review", label: "Review (<4.0)", icon: <ShieldAlert size={14} /> }
            ].map((tier) => (
                <button
                   key={tier.id}
                   onClick={() => setFilterTier(tier.id as FilterTier)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filterTier === tier.id 
                         ? 'bg-gray-900 text-white shadow-md' 
                         : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                   }`}
                >
                   {tier.icon} {tier.label}
                </button>
            ))}
         </div>

         {/* Sorting Dropdown */}
         <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap"><TrendingUp size={14} /> Sort By:</span>
            <select 
               value={sortBy} 
               onChange={(e) => setSortBy(e.target.value as SortOption)}
               className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-yellow-400 outline-none transition-all cursor-pointer"
            >
               <option value="rating_desc">Highest Rating First</option>
               <option value="rating_asc">Lowest Rating First</option>
               <option value="trips_desc">Most Lifetime Trips</option>
               <option value="earnings_desc">Highest Earnings</option>
            </select>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 bg-gray-50/50">
          <span className="col-span-3">Partner Identity</span>
          <span className="col-span-2 text-center">Current Rating</span>
          <span className="col-span-2 text-center">Lifetime Trips</span>
          <span className="col-span-3 text-right pr-4">Total Earnings (INR)</span>
          <span className="col-span-2">Performance Tier</span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50">
           {paginatedDrivers.map((d) => {
             const rating = Number(d.rating || 0);
             const tier = rating >= 4.8 ? "Top" : rating >= 4 ? "Good" : "Needs Review";

             return (
               <div key={d._id} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 px-8 py-6 items-center hover:bg-gray-50/50 transition-colors group">
                 {/* Identity Column */}
                 <div className="col-span-1 md:col-span-3 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-900 text-yellow-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                       {rating >= 4.8 ? <Award size={24} /> : <Car size={24} />}
                    </div>
                    <div className="truncate">
                       <p className="font-bold text-gray-900 text-sm tracking-tight truncate">{d.name || "Private Partner"}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">{d.vehicleModel || d.vehicleType || "Not Specified"}</p>
                    </div>
                 </div>

                 {/* Rating Column */}
                 <div className="col-span-1 md:col-span-2 flex items-center md:justify-center">
                    <div className="flex items-baseline gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                       <Star size={14} className="text-yellow-500" fill="currentColor" />
                       <span className="font-black text-yellow-700 text-sm">{rating.toFixed(1)}</span>
                    </div>
                 </div>

                 {/* Trips Column */}
                 <div className="col-span-1 md:col-span-2 flex items-center md:justify-center gap-2">
                    <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Trips:</span>
                    <span className="font-bold text-gray-700">{d.totalTrips || 0}</span>
                 </div>

                 {/* Earnings Column */}
                 <div className="col-span-1 md:col-span-3 flex items-center md:justify-end pr-4 gap-2">
                     <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Earnings:</span>
                     <div className="flex items-center gap-1 font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                        <IndianRupee size={14} />
                        {Math.round(Number(d.totalEarnings || 0)).toLocaleString()}
                     </div>
                 </div>

                 {/* Tier Badge Column */}
                 <div className="col-span-1 md:col-span-2 flex items-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                       tier === 'Top' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                       tier === 'Good' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                       'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                       {tier === 'Top' ? <ArrowUpRight size={12} /> : tier === 'Good' ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}
                       {tier}
                    </span>
                 </div>
               </div>
             );
           })}

           {!loading && sortedAndFiltered.length === 0 && (
              <div className="px-8 py-24 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Filter className="text-gray-300" size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">No Partners Found</h3>
                 <p className="text-gray-500 mt-2 max-w-md font-medium">There are no partners matching your filter combination. Try selecting a different tier or clearing your search.</p>
                 {filterTier !== 'All' && (
                     <button onClick={() => setFilterTier('All')} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest">
                         Clear Filters
                     </button>
                 )}
              </div>
           )}
        </div>

        {/* Footer Pagination */}
        {sortedAndFiltered.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/30">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={sortedAndFiltered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default RatingsPage;
