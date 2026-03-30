import React, { useMemo, useState, useEffect } from "react";
import { Ticket, RefreshCw, Filter, TrendingUp, IndianRupee, User, Calendar, Tag, CornerDownRight, Percent } from "lucide-react";
import { useData } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

type FilterOffer = "All" | "Discounts" | "Return Offers";
type SortOption = "date_desc" | "date_asc" | "fare_desc" | "fare_asc";

const CouponsPage: React.FC = () => {
  const { bookings, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filterOffer, setFilterOffer] = useState<FilterOffer>("All");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  const error = contextError;
  const fetchData = refreshAll;

  // Filter & Sort Logic
  const processedData = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
        
      const filtered = bookings.filter((b) => {
        // Base Requirement: Must have discount OR return trip
        const hasDiscount = Number(b.discount || 0) > 0;
        const hasReturn = !!b.hasReturnTrip;
        
        if (!hasDiscount && !hasReturn) return false;

        // Interactive Filter
        if (filterOffer === "Discounts" && !hasDiscount) return false;
        if (filterOffer === "Return Offers" && !hasReturn) return false;

        // Global Text Search
        if (terms.length > 0) {
           const haystack = [b._id, b.status, b.user?.name].filter(Boolean).join(" ").toLowerCase();
           if (!terms.every((t) => haystack.includes(t))) return false;
        }

        return true;
      });

      return [...filtered].sort((a, b) => {
         const fareA = Number(a.fare || 0);
         const fareB = Number(b.fare || 0);
         const dateA = new Date(a.createdAt).getTime();
         const dateB = new Date(b.createdAt).getTime();

         if (sortBy === "date_desc") return dateB - dateA;
         if (sortBy === "date_asc") return dateA - dateB;
         if (sortBy === "fare_desc") return fareB - fareA;
         if (sortBy === "fare_asc") return fareA - fareB;
         
         return 0;
      });
    },
    [bookings, searchParams, filterOffer, sortBy]
  );

  useEffect(() => {
    setPage(1);
  }, [searchParams, filterOffer, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedData = useMemo(
    () => processedData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [processedData, safePage]
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Ticket className="text-yellow-500" size={32} /> Coupons & Discounts
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Analyze special offers, discounts, and return trip incentives</p>
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
          <Filter size={18} className="text-red-400" />
          {error}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         {/* Deal Toggles */}
         <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1.5"><Tag size={14} /> Offer Type:</span>
            {[
               { id: "All", label: "All Offers", icon: null },
               { id: "Discounts", label: "Direct Discounts", icon: <Percent size={14} /> },
               { id: "Return Offers", label: "Return Trips", icon: <CornerDownRight size={14} /> }
            ].map((offer) => (
                <button
                   key={offer.id}
                   onClick={() => setFilterOffer(offer.id as FilterOffer)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filterOffer === offer.id 
                         ? 'bg-gray-900 text-white shadow-md' 
                         : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                   }`}
                >
                   {offer.icon} {offer.label}
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
               <option value="date_desc">Newest First</option>
               <option value="date_asc">Oldest First</option>
               <option value="fare_desc">Highest Base Fare</option>
               <option value="fare_asc">Lowest Base Fare</option>
            </select>
         </div>
      </div>

      {/* Main Table Layout */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 bg-gray-50/50">
          <span className="col-span-4">Booking Passenger</span>
          <span className="col-span-3 text-center">Applied Incentive</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-3 text-right pr-4">Fare Breakdown (INR)</span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50">
           {paginatedData.map((b) => {
             const hasDiscount = Number(b.discount || 0) > 0;
             const isReturnOffer = !!b.hasReturnTrip;
             const date = new Date(b.createdAt);

             return (
               <div key={b._id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 px-8 py-6 items-center hover:bg-gray-50/50 transition-colors group">
                 {/* Identity Column */}
                 <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-gray-100 text-gray-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:border-yellow-300 group-hover:text-yellow-600 transition-colors">
                       <User size={24} />
                    </div>
                    <div className="truncate">
                       <p className="font-bold text-gray-900 text-sm tracking-tight truncate">{b.user?.name || "Private Guest"}</p>
                       <div className="flex items-center gap-1 mt-1 text-gray-500">
                           <Calendar size={12} />
                           <p className="text-[10px] font-bold uppercase tracking-widest">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                 </div>

                 {/* Incentive Badge Column */}
                 <div className="col-span-1 lg:col-span-3 flex flex-col md:flex-row items-start lg:items-center lg:justify-center gap-2">
                    {hasDiscount && (
                       <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Percent size={14} /> {b.discount}% OFF
                       </span>
                    )}
                    {isReturnOffer && (
                       <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CornerDownRight size={14} /> Return Hook
                       </span>
                    )}
                    {!hasDiscount && !isReturnOffer && (
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Applied</span>
                    )}
                 </div>

                 {/* Status Column */}
                 <div className="col-span-1 lg:col-span-2 flex items-center lg:justify-center">
                     <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                         b.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                         ['cancelled', 'failed'].includes(b.status) ? 'bg-red-50 text-red-700 border-red-200' :
                         'bg-gray-100 text-gray-700 border-gray-200'
                     }`}>
                         {b.status.replace('_', ' ')}
                     </span>
                 </div>

                 {/* Financial Breakdowns */}
                 <div className="col-span-1 lg:col-span-3 flex flex-col items-start lg:items-end pr-4 gap-1.5">
                     {/* Base Fare */}
                     <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                        <span className="lg:hidden text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Fare</span>
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                           <IndianRupee size={12} className="text-gray-400" />
                           {Math.round(Number(b.fare || 0)).toLocaleString()}
                        </div>
                     </div>
                     {/* Return Fare if applicable */}
                     {isReturnOffer && Number(b.returnTripFare) > 0 && (
                        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded uppercase tracking-widest group-hover:bg-emerald-100">Plus Return Fare</span>
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                             <IndianRupee size={10} />
                             {Math.round(Number(b.returnTripFare || 0)).toLocaleString()}
                          </div>
                        </div>
                     )}
                 </div>
               </div>
             );
           })}

           {!loading && processedData.length === 0 && (
              <div className="px-8 py-24 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Filter className="text-gray-300" size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">No Discounts Found</h3>
                 <p className="text-gray-500 mt-2 max-w-md font-medium">There are no discounted rides matching your filter combination. Try selecting a different offer type or clearing your search.</p>
                 {filterOffer !== 'All' && (
                     <button onClick={() => setFilterOffer('All')} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest">
                         Clear Filters
                     </button>
                 )}
              </div>
           )}
        </div>

        {/* Footer Pagination */}
        {processedData.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/30">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={processedData.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;
