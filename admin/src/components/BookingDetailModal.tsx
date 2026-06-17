import React from "react";
import {
    X, 
    User, 
    Truck, 
    CreditCard, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle,
    ArrowRight,
    Navigation,
    Info,
    ShieldCheck
} from "lucide-react";
import { getBookingTotalFare, getOneWayFare } from "../utils/fare";

type BookingItem = {
  _id: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  rideType?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropLocation?: string;
  createdAt: string;
  rideStartedAt?: string;
  rideCompletedAt?: string;
  fare?: number;
  totalFare?: number;
  distance?: number;
  duration?: number;
  tollFee?: number;
  penaltyApplied?: number;
  returnTripFare?: number;
  baseFare?: number;
  nightSurcharge?: number;
  rating?: number;
  feedback?: string;
  user?: {
    name?: string;
    mobile?: string;
    email?: string;
  };
  driver?: {
    name?: string;
    mobile?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
  };
};

interface Props {
  booking: BookingItem | null;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-rose-500/10 text-rose-400 border border-rose-500/20", icon: XCircle },
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", icon: Clock },
  started: { label: "Active", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20", icon: Navigation },
  accepted: { label: "Accepted", color: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", icon: Info },
};

const formatAmount = (val?: number) => `₹${Math.round(val || 0).toLocaleString()}`;

const BookingDetailModal: React.FC<Props> = ({ booking, onClose }) => {
  if (!booking) return null;

  const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: "bg-slate-800 text-slate-300 border border-slate-700", icon: AlertCircle };

  const totalFare = getBookingTotalFare(booking);
  const oneWayFare = getOneWayFare(booking);
  const nightSurcharge = Number(booking.nightSurcharge || 0);
  const baseFare = Number(booking.baseFare || Math.max(0, oneWayFare - nightSurcharge));

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#0A0F1C] w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-800/60 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-white tracking-tight">Booking Profile</h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
              {status.label}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-10 custom-scrollbar relative z-10">
          
          {/* Route Section */}
          <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Journey Timeline</p>
              <div className="relative pl-8 space-y-8">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-800"></div>
                  
                  <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] z-10">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</p>
                          <p className="text-sm font-bold text-slate-200 leading-snug mt-1">{booking.pickupLocation || "N/A"}</p>
                      </div>
                  </div>

                  <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)] z-10">
                          <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Drop Location</p>
                          <p className="text-sm font-bold text-slate-200 leading-snug mt-1">{booking.dropLocation || "N/A"}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* User and Driver Section */}
              <div className="space-y-8">
                  <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</p>
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-700/50 shadow-inner">
                             <User size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                              <p className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">{booking.user?.name || "Private User"}</p>
                              <p className="text-sm text-slate-400 font-bold tracking-wider mt-2">{booking.user?.mobile || "Contact N/A"}</p>
                          </div>
                      </div>
                  </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Driver Partner</p>
                      {booking.driver ? (
                          <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                  <Truck size={28} strokeWidth={2.5} />
                              </div>
                              <div>
                                  <p className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">{booking.driver.name}</p>
                                  <p className="text-sm text-slate-400 font-bold tracking-wider mt-2">{booking.driver.vehicleModel} • <span className="text-yellow-500">{booking.driver.vehicleNumber}</span></p>
                              </div>
                          </div>
                       ) : (
                          <div className="p-5 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                              <p className="text-sm text-slate-500 font-black uppercase text-center tracking-widest">Searching for Partner</p>
                          </div>
                       )}
                  </div>
              </div>

                {/* Fare Section */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fare Economics</p>
                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-widest">Base Fare</span>
                                <span className="font-black text-slate-200 text-lg">{formatAmount(baseFare)}</span>
                            </div>
                            {nightSurcharge > 0 && (
                                <div className="flex justify-between text-sm text-indigo-400">
                                    <span className="font-bold tracking-widest uppercase flex items-center gap-2"><ArrowRight size={14} /> Night Surge</span>
                                    <span className="font-black text-lg">+{formatAmount(nightSurcharge)}</span>
                                </div>
                            )}
                            {(booking.tollFee || 0) > 0 && (
                                <div className="flex justify-between items-center text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                    <span className="font-black tracking-widest uppercase flex items-center gap-2"><ArrowRight size={14} /> Toll Charges</span>
                                    <span className="font-black text-xl">+{formatAmount(booking.tollFee)}</span>
                                </div>
                            )}
                            {(booking.penaltyApplied || 0) > 0 && (
                                <div className="flex justify-between text-sm text-rose-400">
                                    <span className="font-bold tracking-widest uppercase flex items-center gap-2"><ArrowRight size={14} /> Surcharge</span>
                                    <span className="font-black text-lg">+{formatAmount(booking.penaltyApplied)}</span>
                                </div>
                            )}
                            {(booking.returnTripFare || 0) > 0 && (
                                <div className="flex justify-between text-sm text-purple-400">
                                    <span className="font-bold tracking-widest uppercase flex items-center gap-2"><ArrowRight size={14} /> Return Leg</span>
                                    <span className="font-black text-lg">+{formatAmount(booking.returnTripFare)}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t border-slate-800 flex justify-between items-end relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Due</p>
                                <div className="flex items-center gap-2">
                                     <CreditCard size={16} className="text-emerald-500" />
                                     <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{booking.paymentStatus || "UNPAID"} • {booking.paymentMethod || "CASH"}</span>
                                </div>
                            </div>
                            <p className="text-5xl font-black text-white tracking-tighter">{formatAmount(totalFare)}</p>
                        </div>
                    </div>
                </div>
           </div>

           {/* Feedback Section */}
           {(booking.rating || booking.feedback) && (
              <div className="mt-10 pt-10 border-t border-slate-800/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Customer Feedback</p>
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star}
                                    className={`w-5 h-5 ${star <= (booking.rating || 0) ? 'text-yellow-400' : 'text-slate-700'}`} 
                                    fill={star <= (booking.rating || 0) ? 'currentColor' : 'none'} 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                              ))}
                          </div>
                          <span className="text-sm font-black text-yellow-400">{booking.rating?.toFixed(1)} / 5.0</span>
                      </div>
                      {booking.feedback ? (
                          <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                              "{booking.feedback}"
                          </p>
                      ) : (
                          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest italic">
                              No written description provided.
                          </p>
                      )}
                  </div>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Clock size={14} className="text-slate-400" />
                {new Date(booking.createdAt).toLocaleDateString()} • {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-blue-500" />
                Verified
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
