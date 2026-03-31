import React from "react";
import { X, Car, Phone, Calendar, History, Wallet, Star, FileText, ExternalLink } from "lucide-react";
import { useData, type DriverItem } from "../context/DataContext";
import { adminAPI } from "../services/api";

interface DriverDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverItem | null;
}

const DriverDetailModal: React.FC<DriverDetailModalProps> = ({ isOpen, onClose, driver }) => {
  const { bookings, refreshDrivers } = useData();
  const [verifying, setVerifying] = React.useState(false);
  const [showRejectInput, setShowRejectInput] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [selectedDoc, setSelectedDoc] = React.useState<{ url: string, name: string } | null>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
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
             <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                driver.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
             }`}>
                {driver.isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
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
                  <div className="w-24 h-24 bg-gray-900 rounded-3xl mx-auto flex items-center justify-center text-yellow-400 shadow-lg mb-4 overflow-hidden">
                     <div className="w-full h-full flex items-center justify-center text-3xl font-black uppercase">
                        {driver.name?.charAt(0) || "U"}
                     </div>
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

               {/* Documents List */}
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
                                 <div className="flex gap-1">
                                    <span className="text-[9px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded uppercase">Uploaded</span>
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

               {/* Document Previews */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Verification Gallery</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['license', 'insurance', 'registration'].map((field) => {
                      const url = driver.documents?.[field as keyof NonNullable<DriverItem['documents']>];
                      if (!url) return null;
                      const isDocPDF = isPDF(url);
                      return (
                        <div key={field} className="space-y-2">
                          <p className="text-[9px] font-black text-gray-500 uppercase ml-1 tracking-widest">{field}</p>
                          <div 
                            onClick={() => setSelectedDoc({ url, name: field })}
                            className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group relative cursor-zoom-in"
                          >
                            {isDocPDF ? (
                              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-blue-50/30">
                                <FileText className="text-blue-500 mb-2" size={48} />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">View PDF Document</span>
                              </div>
                            ) : (
                              <img 
                                src={url} 
                                alt={field}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                               <div className="bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-white">
                                  <ExternalLink className="text-black" size={14} />
                                  <span className="text-[10px] font-black text-black uppercase tracking-widest">Quick View</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!driver.documents || Object.values(driver.documents).every(v => !v)) && (
                      <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                        <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">No Documents Uploaded Yet</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Ride History */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Ride History</p>
                     <span className="text-[10px] font-bold text-gray-400">{driverBookings.length} Trips Total</span>
                  </div>
                  
                  <div className="space-y-3">
                     {driverBookings.slice(0, 5).map(ride => (
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
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
           {showRejectInput ? (
             <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Provide Rejection Reason</p>
                   <button onClick={() => setShowRejectInput(false)} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase">Cancel</button>
                </div>
                <textarea 
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   placeholder="Example: Driving License photo is blurry or expired..."
                   className="w-full p-4 bg-white border border-red-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all min-h-[80px]"
                />
                <div className="flex justify-end gap-3">
                   <button
                     onClick={() => handleVerify(false, note)}
                     disabled={verifying || !note.trim()}
                     className="px-8 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-[3px] rounded-xl shadow-lg shadow-red-200 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {verifying ? 'Processing...' : 'Confirm Rejection'}
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                   <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-500 font-medium">Joined {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : "-"}</span>
                   </div>
                </div>
                
                <div className="flex gap-3">
                   {driver.isVerified ? (
                     <button
                       onClick={() => setShowRejectInput(true)}
                       disabled={verifying}
                       className="px-6 py-2 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-100 transition-all disabled:opacity-50"
                     >
                       Revoke Verification
                     </button>
                   ) : (
                     <>
                        <button
                          onClick={() => setShowRejectInput(true)}
                          disabled={verifying}
                          className="px-6 py-2 hover:bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(true)}
                          disabled={verifying}
                          className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-[4px] rounded-xl shadow-lg shadow-gray-200 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedDoc(null)}
        >
          <div 
            className="relative w-full max-w-5xl h-full flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                     <FileText size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Preview</p>
                     <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{selectedDoc.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <a 
                    href={selectedDoc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-blue-600 transition-all border border-transparent hover:border-gray-200"
                    title="Open in New Tab"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="p-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-all shadow-lg"
                  >
                    <X size={20} />
                  </button>
               </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 bg-gray-100/50 flex items-center justify-center overflow-hidden">
               {isPDF(selectedDoc.url) ? (
                 <iframe 
                   src={selectedDoc.url} 
                   className="w-full h-full border-none"
                   title="PDF Viewer"
                 />
               ) : (
                 <img 
                   src={selectedDoc.url} 
                   alt={selectedDoc.name}
                   className="max-w-full max-h-full object-contain shadow-2xl"
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
