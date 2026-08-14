import React from "react";
import { X, Car, Phone, Calendar, History, Wallet, Star, FileText, ExternalLink, CreditCard } from "lucide-react";
import { useData, type DriverItem } from "../context/DataContext";
import { adminAPI } from "../services/api";
import { getBookingTotalFare } from "../utils/fare";

interface DriverDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverItem | null;
}

const DriverDetailModal: React.FC<DriverDetailModalProps> = ({ isOpen, onClose, driver: initialDriver }) => {
  const { bookings, drivers, refreshDrivers } = useData();
  const [verifying, setVerifying] = React.useState(false);
  const [showRejectInput, setShowRejectInput] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [selectedDoc, setSelectedDoc] = React.useState<{ url: string, name: string } | null>(null);

  // States for inline dues confirmation
  const [showClearDuesConfirm, setShowClearDuesConfirm] = React.useState(false);
  const [clearingDues, setClearingDues] = React.useState(false);
  const [duesStatusMsg, setDuesStatusMsg] = React.useState<string | null>(null);

  // Keep the driver object updated with the global context to avoid stale UI updates
  const driver = React.useMemo(() => {
    if (!initialDriver) return null;
    return drivers.find(d => d._id === initialDriver._id) || initialDriver;
  }, [initialDriver, drivers]);

  const handleVerify = async (isVerified: boolean, verificationNote?: string) => {
    if (!driver) return;
    setVerifying(true);
    try {
      await adminAPI.verifyDriver(driver._id, isVerified, verificationNote);
      await refreshDrivers();
      onClose();
      // Reset state
      setShowRejectInput(false);
      setNote("");
    } catch (err) {
      console.error("Verification failed", err);
      alert("Failed to update verification status");
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen || !driver) return null;

  const isPDF = (url: string) => url.toLowerCase().includes('.pdf') || url.includes('application/pdf');

  const driverBookings = bookings
    .filter(b => b.driver?._id === driver._id || b.driver?.name === driver.name)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const status = driver.online ? (driver.available ? "Active" : "Busy") : "Offline";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#0A0F1C] w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl border border-slate-800/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex flex-wrap items-center gap-4">
             <h2 className="text-xl font-black text-white tracking-tight">Driver Profile</h2>
             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                status === 'Busy' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
             }`}>
                {status}
             </span>
             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                driver.isVerified ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
             }`}>
                {driver.isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
             </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-8 custom-scrollbar relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Info & Documents */}
            <div className="lg:col-span-4 space-y-8">
               {/* Basic Info */}
               <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-5 overflow-hidden">
                     <div className="w-full h-full flex items-center justify-center text-4xl font-black uppercase tracking-tighter">
                        {driver.name?.charAt(0) || "U"}
                     </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">{driver.name || "Unknown"}</h3>
                  <p className="text-base font-bold text-slate-500 mt-2 uppercase tracking-widest">#{driver._id.slice(-8).toUpperCase()}</p>
                  
                  <div className="flex items-center justify-center gap-2 mt-5">
                     <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2 text-yellow-400 shadow-sm">
                        <Star size={18} fill="currentColor" />
                        <span className="font-black text-lg">{driver.rating || '0.0'}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-6 pt-8 border-t border-slate-800/50">
                  <div className="flex items-center gap-5">
                     <div className="p-4 bg-slate-900 rounded-2xl text-slate-400 border border-slate-800 shadow-sm"><Phone size={24} /></div>
                     <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Phone</p>
                        <p className="text-lg font-bold text-slate-200 mt-1">{driver.mobile || "-"}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-5">
                     <div className="p-4 bg-slate-900 rounded-2xl text-slate-400 border border-slate-800 shadow-sm"><Car size={24} /></div>
                     <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Vehicle</p>
                        <p className="text-lg font-bold text-slate-200 mt-1">{driver.vehicleModel || "-"}</p>
                        <p className="text-base font-black text-yellow-500 mt-1 uppercase tracking-wider">{driver.vehicleNumber || "-"}</p>
                     </div>
                  </div>
               </div>

               {/* Documents List */}
               <div className="space-y-4 pt-6 border-t border-slate-800/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance Docs</p>
                  <div className="space-y-3">
                     {['License', 'Insurance', 'Registration'].map((doc) => {
                        const docKey = doc.toLowerCase() as keyof NonNullable<DriverItem['documents']>;
                        const url = driver.documents?.[docKey];
                        return (
                           <div key={doc} className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-all">
                              <div className="flex items-center gap-3">
                                 <FileText size={18} className={url ? "text-blue-400" : "text-slate-600"} />
                                 <span className="text-sm font-bold text-slate-300 tracking-wide">{doc}</span>
                              </div>
                              {url ? (
                                 <div className="flex gap-1">
                                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md uppercase tracking-widest">Uploaded</span>
                                 </div>
                              ) : (
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-700 px-2 py-1 rounded-md">Pending</span>
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 relative overflow-hidden group shadow-sm">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[20px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                     <p className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
                        <History size={16} /> Total Trips
                     </p>
                     <p className="text-5xl font-black text-white relative z-10 tracking-tight">{driver.totalTrips || 0}</p>
                  </div>
                   <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 relative overflow-hidden group shadow-sm">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[20px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
                         <Wallet size={16} /> Lifetime Earnings
                      </p>
                      <p className="text-4xl font-black text-emerald-400 relative z-10 tracking-tight">₹{Number(driver.totalEarnings || 0).toLocaleString()}</p>
                   </div>
                </div>

                {/* Commission Details Card */}
                <div className="p-8 md:p-10 bg-rose-500/5 rounded-[2.5rem] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                   <div className="relative z-10">
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                         <CreditCard size={18} /> Pending Commission
                      </p>
                      <p className="text-5xl md:text-6xl font-black text-rose-400 tracking-tighter">₹{Number(driver.pendingCommission || 0).toLocaleString()}</p>
                      <p className="text-sm font-bold text-slate-400 uppercase mt-3 tracking-widest">{driver.unpaidRideCount || 0} Unpaid Rides</p>
                      {duesStatusMsg && (
                          <p className="text-xs font-black text-emerald-400 uppercase mt-3 tracking-wider animate-pulse">{duesStatusMsg}</p>
                       )}
                   </div>
                    {(driver.pendingCommission || 0) > 0 && (
                       <div className="relative z-10 shrink-0">
                          {showClearDuesConfirm ? (
                             <div className="flex flex-col gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest text-center">Confirm clearing ₹{Number(driver.pendingCommission || 0).toLocaleString()}?</p>
                                <div className="flex gap-2 justify-center">
                                   <button
                                      disabled={clearingDues}
                                      onClick={async (e) => {
                                         e.stopPropagation();
                                         setClearingDues(true);
                                         try {
                                            await adminAPI.resetCommission(driver._id);
                                            await refreshDrivers();
                                            setDuesStatusMsg("Dues cleared successfully!");
                                            setShowClearDuesConfirm(false);
                                            setTimeout(() => setDuesStatusMsg(null), 3000);
                                         } catch (err) {
                                            console.error(err);
                                            setDuesStatusMsg("Failed to clear dues");
                                            setTimeout(() => setDuesStatusMsg(null), 3000);
                                         } finally {
                                            setClearingDues(false);
                                         }
                                      }}
                                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                                   >
                                      {clearingDues ? "Clearing..." : "Yes, Clear"}
                                   </button>
                                   <button
                                      disabled={clearingDues}
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setShowClearDuesConfirm(false);
                                      }}
                                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-95"
                                   >
                                      Cancel
                                   </button>
                                </div>
                             </div>
                          ) : (
                             <button 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   setShowClearDuesConfirm(true);
                                }}
                                className="px-6 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[2px] rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                             >
                                Clear Dues Manually
                             </button>
                          )}
                       </div>
                    )}
                </div>

               {/* Document Previews */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Document Verification Gallery</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {['license', 'insurance', 'registration'].map((field) => {
                      const url = driver.documents?.[field as keyof NonNullable<DriverItem['documents']>];
                      if (!url) return null;
                      const isDocPDF = isPDF(url);
                      return (
                        <div key={field} className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{field}</p>
                          <div 
                            onClick={() => setSelectedDoc({ url, name: field })}
                            className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 group relative cursor-zoom-in"
                          >
                            {isDocPDF ? (
                              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-blue-500/5">
                                <FileText className="text-blue-500 mb-3" size={56} strokeWidth={1.5} />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">View PDF Document</span>
                              </div>
                            ) : (
                              <img 
                                src={url} 
                                alt={field}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                              />
                            )}
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/60 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                               <div className="bg-white/10 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl border border-white/20 backdrop-blur-md">
                                  <ExternalLink className="text-white" size={14} />
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Quick View</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!driver.documents || Object.values(driver.documents).every(v => !v)) && (
                      <div className="col-span-full py-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                        <FileText className="mx-auto text-slate-700 mb-3" size={40} strokeWidth={1.5} />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">No Documents Uploaded Yet</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Ride History */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Ride History</p>
                     <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{driverBookings.length} Trips Total</span>
                  </div>
                  
                  <div className="space-y-3">
                     {driverBookings.slice(0, 5).map(ride => (
                        <div key={ride._id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex items-center justify-between gap-4 group">
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                 <span className="text-xs font-black text-slate-300 tracking-widest">#{ride._id.slice(-6).toUpperCase()}</span>
                                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                    ride.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                    ride.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                 }`}>
                                    {ride.status}
                                 </span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <p className="text-xs font-bold text-slate-500 truncate max-w-[120px] sm:max-w-[200px]">{ride.pickupLocation}</p>
                                 <span className="text-slate-700">→</span>
                                 <p className="text-xs font-bold text-slate-500 truncate max-w-[120px] sm:max-w-[200px]">{ride.dropLocation}</p>
                              </div>
                           </div>
                           <div className="text-right flex-shrink-0">
                              <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">₹{Math.round(getBookingTotalFare(ride)).toLocaleString()}</p>
                              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mt-1">{new Date(ride.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-900 border-t border-slate-800/80 flex-shrink-0 relative z-10">
           {showRejectInput ? (
             <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Provide Rejection Reason</p>
                   <button onClick={() => setShowRejectInput(false)} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                </div>
                <textarea 
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   placeholder="Example: Driving License photo is blurry or expired..."
                   className="w-full p-4 bg-slate-950 border border-rose-500/30 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all min-h-[80px]"
                />
                <div className="flex justify-end gap-3">
                   <button
                     onClick={() => handleVerify(false, note)}
                     disabled={verifying || !note.trim()}
                     className="px-8 py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-[3px] rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {verifying ? 'Processing...' : 'Confirm Rejection'}
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                   <div className="flex items-center gap-2 text-slate-400 font-bold tracking-widest uppercase">
                      <Calendar size={14} className="text-slate-500" />
                      <span>Joined {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : "-"}</span>
                   </div>
                </div>
                
                <div className="flex gap-3">
                   {driver.isVerified ? (
                     <button
                       onClick={() => setShowRejectInput(true)}
                       disabled={verifying}
                       className="px-6 py-2.5 bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-widest rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                     >
                       Revoke Verification
                     </button>
                   ) : (
                     <>
                        <button
                          onClick={() => setShowRejectInput(true)}
                          disabled={verifying}
                          className="px-6 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(true)}
                          disabled={verifying}
                          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-black uppercase tracking-[3px] rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {verifying ? 'Processing...' : 'Approve & Verify'}
                        </button>
                     </>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Document Preview Overlay */}
      {selectedDoc && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-10 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedDoc(null)}
        >
          <div 
            className="relative w-full max-w-5xl h-full flex flex-col bg-[#0A0F1C] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0A0F1C]/80 backdrop-blur-md relative z-10">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                     <FileText size={20} strokeWidth={2} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Document Preview</p>
                     <p className="text-sm font-black text-white uppercase tracking-tight">{selectedDoc.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <a 
                    href={selectedDoc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-400 transition-all border border-transparent hover:border-slate-700"
                    title="Open in New Tab"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all border border-rose-500/20 hover:border-rose-500/30"
                  >
                    <X size={20} />
                  </button>
               </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden relative">
               {/* Subtle background glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

               {isPDF(selectedDoc.url) ? (
                 <iframe 
                   src={selectedDoc.url} 
                   className="w-full h-full border-none relative z-10"
                   title="PDF Viewer"
                 />
               ) : (
                 <img 
                   src={selectedDoc.url} 
                   alt={selectedDoc.name}
                   className="max-w-full max-h-[90%] object-contain drop-shadow-2xl relative z-10"
                 />
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDetailModal;

