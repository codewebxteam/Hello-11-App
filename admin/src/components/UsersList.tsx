import React, { useState } from 'react';
import { Search, Filter, User, Car, IndianRupee } from 'lucide-react';

const UsersList: React.FC = () => {
    // Mock Data
    const [users] = useState([
        { id: 'USR001', name: 'Rahul Sharma', phone: '+91 98765 00001', joined: '12 Feb', rides: 15, spent: 4500 },
        { id: 'USR002', name: 'Priya Patel', phone: '+91 98765 00002', joined: '10 Feb', rides: 8, spent: 2100 },
        { id: 'USR003', name: 'Amit Singh', phone: '+91 98765 00003', joined: '5 Feb', rides: 22, spent: 8900 },
        { id: 'USR004', name: 'Sneha Gupta', phone: '+91 98765 00004', joined: '1 Feb', rides: 45, spent: 15600 },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-500 mt-1 text-sm">{users.length} registered users</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, email, or referral code..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm placeholder-gray-400"
                    />
                </div>
                <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-colors">
                    <Filter size={18} />
                    <span>Sort by Name</span>
                </button>
            </div>

            {/* Users List */}
            <div className="space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                        <div className="flex items-start md:items-center space-x-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700">
                                    <User size={24} />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono font-medium">{user.id}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 gap-4 mt-1">
                                    <span className="flex items-center gap-1">
                                        📞 {user.phone}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        📅 Joined {user.joined}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 pl-16 md:pl-0">
                            <div className="text-center md:text-right">
                                <div className="flex items-center gap-1 text-yellow-600 font-medium justify-end">
                                    <Car size={16} />
                                    <span>{user.rides}</span>
                                </div>
                                <p className="text-xs text-gray-500">Rides</p>
                            </div>

                            <div className="text-center md:text-right">
                                <div className="flex items-center gap-1 text-green-600 font-medium justify-end">
                                    <IndianRupee size={16} />
                                    <span>{user.spent.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-gray-500">Total Spent</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UsersList;
