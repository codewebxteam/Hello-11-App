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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">User Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100 text-yellow-600">
              <UserIcon size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 uppercase">{user.name || "Unknown User"}</h3>
              <p className="text-sm text-gray-500 font-medium">#{user._id.toUpperCase()}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight mb-0.5">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900">{user.totalRides || 0}</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight mb-0.5">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{Number(user.totalSpent || 0).toLocaleString()}</p>
             </div>
          </div>

          {/* Details List */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
               <div className="flex items-start gap-4">
                  <div className="mt-1 text-gray-400"><Mail size={18} /></div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</p>
                     <p className="text-sm font-medium text-gray-900">{user.email || "Not specified"}</p>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="mt-1 text-gray-400"><Phone size={18} /></div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                     <p className="text-sm font-medium text-gray-900">{user.mobile || "Not specified"}</p>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="mt-1 text-gray-400"><Calendar size={18} /></div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Registration Date</p>
                     <p className="text-sm font-medium text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "Not available"}
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Account Active</span>
           </div>
           <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-blue-500" />
              Verified User
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
