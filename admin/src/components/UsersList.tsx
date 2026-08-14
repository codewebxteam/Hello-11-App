import React, { useState, useEffect, useCallback } from "react";
import { Search, User, Car, RefreshCw, Mail, Phone, Trash2 } from "lucide-react";
import { type UserItem } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";
import UserDetailModal from "./UserDetailModal";
import { adminAPI } from "../services/api";

const UsersList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = (searchParams.get("q") || "").trim();

  // Local State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync search input if URL params change
  useEffect(() => {
    const q = (searchParams.get("q") || "").trim();
    setSearch(q);
  }, [searchParams]);

  // Debounce search input changes (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users function
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await adminAPI.getUsers({
        page,
        limit: pageSize,
        search: debouncedSearch
      });
      
      const fetchedUsers = res.data?.users || [];
      
      // Backward-compatible verification:
      // If the backend has pagination metadata, use it directly.
      // Otherwise, fallback to client-side slicing/pagination.
      if (res.data?.pagination) {
        setUsers(fetchedUsers);
        setTotalUsers(res.data.pagination.totalUsers || 0);
        setTotalPages(res.data.pagination.totalPages || 1);
      } else {
        setTotalUsers(fetchedUsers.length);
        setTotalPages(Math.max(1, Math.ceil(fetchedUsers.length / pageSize)));
        
        // Paginate locally
        const start = (page - 1) * pageSize;
        const end = page * pageSize;
        setUsers(fetchedUsers.slice(start, end));
      }
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      setError(err.response?.data?.message || "Failed to load users from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, debouncedSearch]);

  // Fetch users on initialization and criteria changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = (user: UserItem) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent modal opening
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await adminAPI.deleteUser(id);
        fetchUsers(true);
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Base</h1>
          <p className="text-slate-500 mt-1 font-medium">
            {loading && !refreshing ? "Loading records..." : `Managing ${totalUsers} total users`}
          </p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing || loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-sm uppercase tracking-wider ${refreshing || loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {refreshing ? (
            <>
              <RefreshCw size={18} className="animate-spin text-purple-400" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="text-purple-400" />
              Sync Users
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
          {error}
        </div>
      )}

      {/* Premium Search & Page Size Filter Bar */}
      <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, ID..."
              className="w-full pl-14 pr-6 py-4 bg-transparent focus:outline-none text-slate-900 font-medium placeholder-slate-400 transition-all rounded-full"
            />
          </div>
          
          <div className="flex items-center gap-3 px-6 py-2 border-t md:border-t-0 md:border-l border-slate-100 w-full md:w-auto shrink-0 justify-between md:justify-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer uppercase tracking-wider"
            >
              <option value={10}>10 Users</option>
              <option value={25}>25 Users</option>
              <option value={50}>50 Users</option>
              <option value={100}>100 Users</option>
            </select>
          </div>
      </div>

      {loading && !refreshing ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm space-y-4">
          <RefreshCw size={40} className="animate-spin text-purple-600" />
          <p className="text-slate-400 font-bold text-sm tracking-wider uppercase">Fetching page data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">User Details</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Total Rides</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Total Spent</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Joined Date</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* User Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-inner group-hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] shrink-0">
                          <User size={18} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 group-hover:text-purple-600 transition-colors uppercase truncate text-sm">
                            {user.name || "Unknown User"}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                            ID: {user._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          {user.mobile || "N/A"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          {user.email || "N/A"}
                        </p>
                      </div>
                    </td>

                    {/* Total Rides */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-full font-black text-xs border border-purple-100">
                        <Car size={12} strokeWidth={2.5} />
                        {user.totalRides || 0}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-xs border border-emerald-100">
                        ₹{Number(user.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteUser(e, user._id)}
                        className="text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && users.length === 0 && (
            <div className="bg-white p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <User size={28} className="text-slate-300" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg tracking-tight">No users found</p>
                <p className="text-slate-400 font-medium mt-1">Try adjusting your search terms.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalUsers}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      <UserDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={selectedUser} 
      />
    </div>
  );
};

export default UsersList;
