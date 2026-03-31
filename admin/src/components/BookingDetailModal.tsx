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
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  started: { label: "Active", color: "bg-blue-100 text-blue-700", icon: Navigation },
  accepted: { label: "Accepted", color: "bg-blue-50 text-blue-600", icon: Info },
};

const formatAmount = (val?: number) => `Rs ${Math.round(val || 0).toLocaleString()}`;

const BookingDetailModal: React.FC<Props> = ({ booking, onClose }) => {
  if (!booking) return null;

  const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: "bg-gray-100 text-gray-700", icon: AlertCircle };

  const totalFare = booking.totalFare ?? ((booking.fare || 0) + (booking.returnTripFare || 0) + (booking.penaltyApplied || 0) + (booking.tollFee || 0));

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Booking Profile</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
              {status.label}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-10">
          
          {/* Route Section */}
          <div className="space-y-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Journey Timeline</p>
              <div className="relative pl-8 space-y-8">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-gray-100"></div>
                  
                  <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-green-500 shadow-sm z-10">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup Location</p>
                          <p className="text-sm font-semibold text-gray-900 leading-snug mt-0.5">{booking.pickupLocation || "N/A"}</p>
                      </div>
                  </div>

                  <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-red-500 shadow-sm z-10">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Drop Location</p>
                          <p className="text-sm font-semibold text-gray-900 leading-snug mt-0.5">{booking.dropLocation || "N/A"}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* User and Driver Section */}
              <div className="space-y-8">
                  <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 border border-yellow-100">
                             <User size={24} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-gray-900 uppercase">{booking.user?.name || "Private User"}</p>
                              <p className="text-xs text-gray-500 font-medium">{booking.user?.mobile || "Contact N/A"}</p>
                          </div>
                      </div>
                  </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver Partner</p>
                      {booking.driver ? (
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-yellow-400">
                                  <Truck size={24} />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-900 uppercase">{booking.driver.name}</p>
                                  <p className="text-xs text-gray-500 font-medium">{booking.driver.vehicleModel} • {booking.driver.vehicleNumber}</p>
                              </div>
                          </div>
                       ) : (
                          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <p className="text-xs text-gray-400 font-bold uppercase text-center">Searching for Driver</p>
                          </div>
                       )}
                  </div>
              </div>

                {/* Fare Section */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fare Economics</p>
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-medium">Base Fare</span>
                                <span className="font-bold text-gray-900">{formatAmount(booking.fare)}</span>
                            </div>
                            {(booking.tollFee || 0) > 0 && (
                                <div className="flex justify-between text-xs text-blue-600">
                                    <span className="font-medium tracking-tight flex items-center gap-1"><ArrowRight size={12} /> Toll & Parking</span>
                                    <span className="font-bold">+{formatAmount(booking.tollFee)}</span>
                                </div>
                            )}
                            {(booking.penaltyApplied || 0) > 0 && (
                                <div className="flex justify-between text-xs text-red-600">
                                    <span className="font-medium tracking-tight flex items-center gap-1"><ArrowRight size={12} /> Surcharge</span>
                                    <span className="font-bold">+{formatAmount(booking.penaltyApplied)}</span>
                                </div>
                            )}
                            {(booking.returnTripFare || 0) > 0 && (
                                <div className="flex justify-between text-xs text-purple-600">
                                    <span className="font-medium tracking-tight flex items-center gap-1"><ArrowRight size={12} /> Return Leg</span>
                                    <span className="font-bold">+{formatAmount(booking.returnTripFare)}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                <div className="flex items-center gap-1.5">
                                     <CreditCard size={12} className="text-gray-400" />
                                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{booking.paymentMethod || "CASH"}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 tracking-tighter">{formatAmount(totalFare)}</p>
                        </div>
                    </div>
                </div>
           </div>

           {/* Feedback Section */}
           {(booking.rating || booking.feedback) && (
              <div className="mt-10 pt-10 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Customer Feedback</p>
                  <div className="bg-yellow-50/50 rounded-2xl border border-yellow-100 p-6">
                      <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star}
                                    className={`w-5 h-5 ${star <= (booking.rating || 0) ? 'text-yellow-500' : 'text-gray-200'}`} 
                                    fill={star <= (booking.rating || 0) ? 'currentColor' : 'none'} 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                              ))}
                          </div>
                          <span className="text-sm font-black text-yellow-700 ml-1">{booking.rating?.toFixed(1)} / 5.0</span>
                      </div>
                      {booking.feedback ? (
                          <p className="text-gray-700 text-sm font-medium leading-relaxed italic">
                              "{booking.feedback}"
                          </p>
                      ) : (
                          <p className="text-gray-400 text-xs font-bold uppercase italic">
                              No written description provided.
                          </p>
                      )}
                  </div>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Clock size={14} />
                {new Date(booking.createdAt).toLocaleDateString()} • {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-blue-500" />
                {booking.paymentStatus || 'UNPAID'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
