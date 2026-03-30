import { useMemo, useState } from "react";
import { Car, CreditCard, Navigation, Users, Map, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useData } from "../context/DataContext";
import Pagination from "./Pagination";
import { useNavigate } from "react-router-dom";
import BookingDetailModal from "./BookingDetailModal";
import type { Booking } from "../context/DataContext";

const formatAmount = (value: number) => `Rs ${Math.round(value).toLocaleString()}`;

const getBookingAmount = (b: Booking) =>
  Number(b.totalFare ?? ((b.fare || 0) + (b.returnTripFare || 0) + (b.penaltyApplied || 0) + (b.tollFee || 0)));

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
      { title: "Total Bookings", value: stats.totalBookings, icon: Car, color: "bg-yellow-400 text-black shadow-yellow-100", link: "/bookings" },
      { title: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-green-100 text-green-700 shadow-green-50", link: "/users" },
      { title: "Active Drivers", value: stats.activeDrivers, icon: Navigation, color: "bg-blue-100 text-blue-700 shadow-blue-50", link: "/riders" },
      { title: "Total Earnings", value: formatAmount(stats.totalEarnings), icon: CreditCard, color: "bg-yellow-100 text-yellow-700 shadow-yellow-50", link: "/analytics" },
      { title: "Ongoing Trips", value: stats.ongoingTrips, icon: Map, color: "bg-purple-100 text-purple-700 shadow-purple-50", link: "/bookings?status=ongoing" },
      { title: "Cancelled Trips", value: stats.cancelledTrips, icon: XCircle, color: "bg-red-100 text-red-700 shadow-red-50", link: "/bookings?status=cancelled" },
    ],
    [stats]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1 font-medium">Realtime overview of your business.</p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={refreshing}
          className={`flex items-center gap-2 text-sm font-bold text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 ${refreshing ? 'opacity-70' : ''}`}
        >
          {refreshing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh Stats"
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.link)}
            className="group cursor-pointer bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center space-x-5 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`p-4 rounded-2xl ${card.color} shadow-lg transition-transform group-hover:scale-110`}>
              <card.icon size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 leading-none">{card.value}</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">{card.title}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
                <ArrowRight size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden shadow-gray-200/20">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Recent Journeys</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Updated just now</p>
          </div>
          <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg uppercase">{recentBookings.length} records</span>
        </div>
        <div className="p-4 space-y-2">
          {recentBookings.length === 0 && !loading && (
            <div className="py-12 text-center">
                 <p className="text-sm text-gray-400 font-bold italic">No activity detected yet.</p>
            </div>
          )}
          {paginatedRecentBookings.map((booking) => (
            <div 
                key={booking._id} 
                onClick={() => setSelectedBooking(booking)}
                className="group flex items-center justify-between p-4 rounded-2xl hover:bg-yellow-50 cursor-pointer transition-all active:scale-[0.99] border border-transparent hover:border-yellow-100"
            >
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-bold group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                      {booking.user?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-yellow-700 transition-colors">{booking.user?.name || "Anonymous"}</p>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
                      <span className="truncate max-w-[120px]">{booking.pickupLocation || "--"}</span>
                      <ArrowRight size={8} />
                      <span className="truncate max-w-[120px]">{booking.dropLocation || "--"}</span>
                    </div>
                  </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">{formatAmount(getBookingAmount(booking))}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                }`}>
                    {booking.status}
                </span>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-50">
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

      {/* Detail Modal */}
      <BookingDetailModal 
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
      />
    </div>
  );
};

export default DashboardHome;
