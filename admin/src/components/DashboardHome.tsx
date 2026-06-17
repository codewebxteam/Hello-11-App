import { useMemo, useState } from "react";
import { Car, CreditCard, Navigation, Users, ArrowRight, RefreshCw, Activity, MapPin } from "lucide-react";
import { useData } from "../context/DataContext";
import Pagination from "./Pagination";
import { useNavigate } from "react-router-dom";
import BookingDetailModal from "./BookingDetailModal";
import type { Booking } from "../context/DataContext";
import { getBookingTotalFare } from "../utils/fare";

const formatAmount = (value: number) => `₹${Math.round(value).toLocaleString()}`;

const getBookingAmount = (b: Booking) => getBookingTotalFare(b);

const DashboardHome: React.FC = () => {
  const { stats, bookings: recentBookings, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const error = contextError;
  const loadDashboard = refreshAll;

  const totalPages = Math.max(1, Math.ceil(recentBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecentBookings = useMemo(
    () => recentBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [recentBookings, safePage]
  );

  const cards = useMemo(
    () => [
      { title: "Total Bookings", value: stats.totalBookings, icon: Car, bg: "from-blue-50 to-white", iconBg: "bg-blue-500", text: "text-blue-600", link: "/bookings", shadow: "shadow-blue-500/20" },
      { title: "Admin Revenue", value: formatAmount(stats.totalAdminCommission || 0), icon: Activity, bg: "from-emerald-50 to-white", iconBg: "bg-emerald-500", text: "text-emerald-600", link: "/analytics", shadow: "shadow-emerald-500/20" },
      { title: "Commission Pending", value: formatAmount(stats.totalPendingCommission || 0), icon: CreditCard, bg: "from-rose-50 to-white", iconBg: "bg-rose-500", text: "text-rose-600", link: "/riders", shadow: "shadow-rose-500/20" },
      { title: "Gross Earnings", value: formatAmount(stats.totalEarnings), icon: Wallet, bg: "from-yellow-50 to-white", iconBg: "bg-yellow-500", text: "text-yellow-600", link: "/analytics", shadow: "shadow-yellow-500/20" },
      { title: "Active Drivers", value: stats.activeDrivers, icon: Navigation, bg: "from-indigo-50 to-white", iconBg: "bg-indigo-500", text: "text-indigo-600", link: "/riders", shadow: "shadow-indigo-500/20" },
      { title: "Total Users", value: stats.totalUsers, icon: Users, bg: "from-purple-50 to-white", iconBg: "bg-purple-500", text: "text-purple-600", link: "/users", shadow: "shadow-purple-500/20" },
    ],
    [stats]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-base text-slate-500 mt-2 font-bold tracking-wide">Real-time pulse of your Hello-11 business.</p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={refreshing}
          className={`group flex items-center gap-2 text-sm font-bold text-slate-700 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-100 ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {refreshing ? (
            <>
              <RefreshCw size={16} className="animate-spin text-yellow-500" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="text-slate-400 group-hover:text-yellow-500 transition-colors" />
              Sync Data
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {cards.map((card, i) => (
          <div
            key={card.title}
            onClick={() => navigate(card.link)}
            className={`group cursor-pointer bg-gradient-to-br ${card.bg} p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden relative`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -right-8 -top-8 w-40 h-40 ${card.iconBg} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`}></div>
            
            <div className="flex items-center justify-between relative z-10">
                <div className={`p-4 rounded-2xl ${card.iconBg} text-white shadow-lg ${card.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ArrowRight size={20} className={card.text} />
                </div>
            </div>
            
            <div className="mt-8 relative z-10">
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{card.value}</h3>
              <p className="text-sm font-black text-slate-500 mt-2 uppercase tracking-[0.2em]">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Recent Journeys</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time feed</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{recentBookings.length} Total</span>
          </div>
        </div>
        
        <div className="p-2 md:p-4">
          {recentBookings.length === 0 && !loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                     <Activity size={24} className="text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-bold text-lg">No activity yet</p>
                 <p className="text-sm text-slate-400 mt-1">Bookings will appear here in real-time.</p>
            </div>
          )}
          
          <div className="space-y-1">
              {paginatedRecentBookings.map((booking) => (
                <div 
                    key={booking._id} 
                    onClick={() => setSelectedBooking(booking)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.99] border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-5 mb-4 sm:mb-0">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-yellow-400 group-hover:text-black group-hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all duration-300 flex-shrink-0">
                          {booking.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-lg md:text-2xl text-slate-900 group-hover:text-yellow-600 transition-colors truncate">{booking.user?.name || "Private User"}</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                          <MapPin size={14} className="text-emerald-500" />
                          <span className="truncate max-w-[120px]">{booking.pickupLocation || "--"}</span>
                          <ArrowRight size={10} className="text-slate-300 flex-shrink-0 mx-1" />
                          <MapPin size={14} className="text-rose-500" />
                          <span className="truncate max-w-[120px]">{booking.dropLocation || "--"}</span>
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                    <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 text-2xl md:text-3xl tracking-tighter">{formatAmount(getBookingAmount(booking))}</p>
                        {(booking.tollFee || 0) > 0 && (
                           <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">+ Toll</span>
                        )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mt-2 ${
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {booking.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          
          <div className="pt-4 mt-2 border-t border-slate-100">
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

      <BookingDetailModal 
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
      />
    </div>
  );
};

// Simple Wallet icon polyfill since Wallet isn't imported from lucide-react in original
const Wallet = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
);

export default DashboardHome;
