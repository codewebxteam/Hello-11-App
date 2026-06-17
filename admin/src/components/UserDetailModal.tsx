import React from "react";
import { X, User as UserIcon, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import type { UserItem } from "../context/DataContext";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#0A0F1C] w-full max-w-lg rounded-[2rem] shadow-2xl border border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800/50 relative z-10">
          <h2 className="text-xl font-black text-white tracking-tight">User Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-8 relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700/50 text-slate-300 shadow-inner">
              <UserIcon size={40} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">{user.name || "Unknown User"}</h3>
              <p className="text-base text-yellow-500 font-bold tracking-widest mt-2">ID: {user._id.toUpperCase().slice(-8)}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-5 mb-10">
             <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[20px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Total Rides</p>
                <p className="text-4xl md:text-5xl font-black text-white relative z-10 tracking-tight">{user.totalRides || 0}</p>
             </div>
             <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[20px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Total Spent</p>
                <p className="text-4xl md:text-5xl font-black text-emerald-400 relative z-10 tracking-tight">₹{Number(user.totalSpent || 0).toLocaleString()}</p>
             </div>
          </div>

          {/* Details List */}
          <div className="space-y-6">
             <div className="grid grid-cols-1 gap-6">
               <div className="flex items-center gap-5 p-5 rounded-2xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800/50">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800 shadow-sm"><Mail size={20} /></div>
                  <div>
                     <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Email Address</p>
                     <p className="text-lg font-bold text-slate-200">{user.email || "Not specified"}</p>
                  </div>
               </div>

               <div className="flex items-center gap-5 p-5 rounded-2xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800/50">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800 shadow-sm"><Phone size={20} /></div>
                  <div>
                     <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Phone Number</p>
                     <p className="text-lg font-bold text-slate-200">{user.mobile || "Not specified"}</p>
                  </div>
               </div>

               <div className="flex items-center gap-5 p-5 rounded-2xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800/50">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800 shadow-sm"><Calendar size={20} /></div>
                  <div>
                     <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Registration Date</p>
                     <p className="text-lg font-bold text-slate-200">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "Not available"}
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Active</span>
           </div>
           <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <ShieldCheck size={14} className="text-blue-500" />
              Verified User
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
