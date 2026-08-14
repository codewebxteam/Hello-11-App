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
      setUsers(res.data?.users || []);
      setTotalUsers(res.data?.pagination?.totalUsers || 0);
      setTotalPages(res.data?.pagination?.totalPages || 1);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user)}
              className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Subtle accent line on top */}
              <div className="absolute left-0 top-0 right-0 h-1.5 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] flex-shrink-0">
                  <User size={28} strokeWidth={2.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors uppercase truncate">{user.name || "Unknown User"}</h3>
                    <button 
                      onClick={(e) => handleDeleteUser(e, user._id)}
                      className="text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-colors shadow-sm"
                      title="Delete User"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-[9px] px-2.5 py-1 rounded-md font-black tracking-widest uppercase inline-block mb-2">
                      ID: {user._id.slice(-6)}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400"><Phone size={14} /></div>
                      <span className="truncate">{user.mobile || "No Mobile Number"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400"><Mail size={14} /></div>
                      <span className="truncate">{user.email || "No Email Provided"}</span>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div className="text-center bg-white border border-slate-100 rounded-2xl p-3 shadow-sm group-hover:border-purple-100 transition-colors">
                  <div className="flex items-center justify-center gap-1.5 text-purple-600 font-black text-xl mb-1">
                    <Car size={18} strokeWidth={2.5} />
                    <span>{user.totalRides || 0}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Rides</p>
                </div>

                <div className="text-center bg-white border border-slate-100 rounded-2xl p-3 shadow-sm group-hover:border-emerald-100 transition-colors">
                  <div className="flex items-center justify-center gap-1 text-emerald-600 font-black text-xl mb-1">
                    <span>₹{Number(user.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Spent</p>
                </div>
              </div>
            </div>
          ))}

          {!loading && users.length === 0 && (
            <div className="col-span-full bg-white p-16 rounded-[2rem] border border-slate-100 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <User size={32} className="text-slate-300" />
              </div>
              <div>
                  <p className="font-black text-slate-900 text-xl tracking-tight">No users found</p>
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
