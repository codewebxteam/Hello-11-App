import React from "react";
import { X, Car, Phone, Calendar, History, Wallet, Star, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { useData, type DriverItem } from "../context/DataContext";

interface DriverDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverItem | null;
}

const DriverDetailModal: React.FC<DriverDetailModalProps> = ({ isOpen, onClose, driver }) => {
  const { bookings } = useData();

  if (!isOpen || !driver) return null;

  const driverBookings = bookings
    .filter(b => b.driver?._id === driver._id || b.driver?.name === driver.name)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const status = driver.online ? (driver.available ? "Active" : "Busy") : "Offline";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-gray-900">Driver Profile</h2>
             <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                status === 'Active' ? 'bg-green-100 text-green-700' : 
                status === 'Busy' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
             }`}>
                {status}
             </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Info & Documents */}
            <div className="lg:col-span-4 space-y-8">
               {/* Basic Info */}
               <div className="text-center">
                  <div className="w-24 h-24 bg-gray-900 rounded-3xl mx-auto flex items-center justify-center text-yellow-400 shadow-lg mb-4">
                     <Car size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 uppercase">{driver.name || "Unknown"}</h3>
                  <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-tight">#{driver._id.slice(-8).toUpperCase()}</p>
                  
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-yellow-500">
                     <Star size={16} fill="currentColor" />
                     <span className="font-bold text-gray-900">{driver.rating || '0.0'}</span>
                     <span className="text-gray-400 text-xs font-medium">Rating</span>
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Phone size={16} /></div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-semibold text-gray-900">{driver.mobile || "-"}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Car size={16} /></div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vehicle</p>
                        <p className="text-sm font-semibold text-gray-900">{driver.vehicleModel || "-"}</p>
                        <p className="text-xs text-gray-500">{driver.vehicleNumber || "-"}</p>
                     </div>
                  </div>
               </div>

               {/* Documents */}
               <div className="space-y-4 pt-6 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance Docs</p>
                  <div className="space-y-2">
                     {['License', 'Insurance', 'Registration'].map((doc) => {
                        const docKey = doc.toLowerCase() as keyof NonNullable<DriverItem['documents']>;
                        const url = driver.documents?.[docKey];
                        return (
                           <div key={doc} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group transition-all">
                              <div className="flex items-center gap-3">
                                 <FileText size={18} className={url ? "text-blue-500" : "text-gray-300"} />
                                 <span className="text-sm font-semibold text-gray-700">{doc}</span>
                              </div>
                              {url ? (
                                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                       href={url} 
                                       target="_blank" 
                                       rel="noreferrer" 
                                       className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-colors shadow-sm border border-transparent hover:border-gray-100"
                                    >
                                       <ExternalLink size={14} />
                                    </a>
                                 </div>
                              ) : (
                                 <span className="text-[10px] font-bold text-gray-400 uppercase">Pending</span>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Right Column: Rides & Stats */}
            <div className="lg:col-span-8 space-y-8">
               {/* Quick Metrics */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                     <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <History size={12} /> Total Trips
                     </p>
                     <p className="text-3xl font-bold text-gray-900">{driver.totalTrips || 0}</p>
                  </div>
                  <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100">
                     <p className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <Wallet size={12} /> Lifetime Earnings
                     </p>
                     <p className="text-3xl font-bold text-gray-900">₹{Number(driver.totalEarnings || 0).toLocaleString()}</p>
                  </div>
               </div>

               {/* Ride History */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Ride History</p>
                     <span className="text-[10px] font-bold text-gray-400">{driverBookings.length} Trips Total</span>
                  </div>
                  
                  <div className="space-y-3">
                     {driverBookings.slice(0, 10).map(ride => (
                        <div key={ride._id} className="p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors flex items-center justify-between gap-4">
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                 <span className="text-xs font-bold text-gray-900">#{ride._id.slice(-6).toUpperCase()}</span>
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                    ride.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                    ride.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                 }`}>
                                    {ride.status}
                                 </span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <p className="text-xs text-gray-500 truncate">{ride.pickupLocation}</p>
                                 <span className="text-gray-300">→</span>
                                 <p className="text-xs text-gray-500 truncate">{ride.dropLocation}</p>
                              </div>
                           </div>
                           <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-gray-900">₹{ride.fare || 0}</p>
                              <p className="text-[10px] font-medium text-gray-400">{new Date(ride.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                     ))}
                     {driverBookings.length === 0 && (
                        <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                           <p className="text-sm font-medium text-gray-400">No rides completed yet.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
           <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                 <Calendar size={14} className="text-gray-400" />
                 <span className="text-gray-500 font-medium">Joined {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : "-"}</span>
              </div>
           </div>
           <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-blue-500" />
              Verified Partner
           </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDetailModal;
