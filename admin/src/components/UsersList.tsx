import React, { useMemo, useState, useEffect } from "react";
import { Search, User, Car, IndianRupee, RefreshCw } from "lucide-react";
import { useData, type UserItem } from "../context/DataContext";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";
import UserDetailModal from "./UserDetailModal";

const UsersList: React.FC = () => {
  const { users, loading, refreshing, error: contextError, refreshAll } = useData();
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const error = contextError;
  const fetchUsers = refreshAll;

  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUserClick = (user: UserItem) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    const terms = [(searchParams.get("q") || "").trim().toLowerCase(), search.trim().toLowerCase()]
      .filter(Boolean)
      .flatMap((s) => s.split(/\s+/).filter(Boolean));
    if (terms.length === 0) return users;
    return users.filter((u) => {
      const haystack = [u.name, u.mobile, u.email, u._id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [search, searchParams, users]);

  useEffect(() => {
    setPage(1);
  }, [search, searchParams]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "Loading..." : `${filteredUsers.length} users`}
          </p>
        </div>
        <button
          onClick={() => fetchUsers()}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900 ${refreshing ? 'opacity-70' : ''}`}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email, ID..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm placeholder-gray-400"
        />
      </div>

      <div className="space-y-4">
        {paginatedUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => handleUserClick(user)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start md:items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                <User size={24} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors uppercase">{user.name || "Unknown User"}</h3>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono font-medium">
                    {user._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 gap-4 mt-1">
                  <span>{user.mobile || "-"}</span>
                  <span className="hidden sm:inline">{user.email || "-"}</span>
                  <span className="hidden lg:inline">
                    Joined{" "}
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 pl-16 md:pl-0">
              <div className="text-center md:text-right">
                <div className="flex items-center gap-1 text-yellow-600 font-bold justify-end">
                  <Car size={16} />
                  <span>{user.totalRides || 0}</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rides</p>
              </div>

              <div className="text-center md:text-right">
                <div className="flex items-center gap-1 text-green-600 font-bold justify-end">
                  <IndianRupee size={16} />
                  <span>{Number(user.totalSpent || 0).toLocaleString()}</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spent</p>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredUsers.length === 0 && (
          <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <User className="text-gray-200 mb-2" size={40} />
            <p className="text-gray-500 font-bold">No users found</p>
          </div>
        )}

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          pageSize={PAGE_SIZE}
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
