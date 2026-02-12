import React, { useState } from 'react';
import { Search, Filter, Car, IndianRupee } from 'lucide-react';

const RidersList: React.FC = () => {
    // Mock Data
    const [riders] = useState([
        { id: 'DRV001', name: 'Rajesh Kumar', phone: '+91 98765 43210', joined: '10 Feb', trips: 145, earnings: 12400, car: 'Swift Dzire (White)', plate: 'UP32 AB 1234' },
        { id: 'DRV002', name: 'Vikram Singh', phone: '+91 98765 43211', joined: '8 Feb', trips: 42, earnings: 4500, car: 'WagonR (Silver)', plate: 'UP32 CD 5678' },
        { id: 'DRV003', name: 'Amit Verma', phone: '+91 98765 43212', joined: '5 Feb', trips: 89, earnings: 8900, car: 'Honda Amaze (Red)', plate: 'UP32 EF 9012' },
        { id: 'DRV004', name: 'Suresh Yadav', phone: '+91 98765 43213', joined: '1 Feb', trips: 12, earnings: 1200, car: 'Alto 800 (White)', plate: 'UP32 GH 3456' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
                    <p className="text-gray-500 mt-1 text-sm">{riders.length} active drivers</p>
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

            {/* Riders List */}
            <div className="space-y-4">
                {riders.map((rider) => (
                    <div key={rider.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                        <div className="flex items-start md:items-center space-x-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-yellow-400">
                                    <Car size={24} />
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg font-bold text-gray-900">{rider.name}</h3>
                                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-mono font-medium">{rider.id}</span>
                                </div>
                                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1 mt-1">
                                    <span className="flex items-center gap-1 text-xs">
                                        🚗 <span className="font-medium text-gray-700">{rider.car}</span>
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wide border border-gray-200">{rider.plate}</span>
                                    </span>
                                    <span className="flex items-center gap-1 text-xs">
                                        📞 {rider.phone}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs">
                                        📅 Joined {rider.joined}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 pl-16 md:pl-0 mt-4 md:mt-0">
                            <div className="text-center md:text-right">
                                <div className="flex items-center gap-1 text-yellow-600 font-medium justify-end">
                                    <Car size={16} />
                                    <span>{rider.trips}</span>
                                </div>
                                <p className="text-xs text-gray-500">Trips</p>
                            </div>

                            <div className="text-center md:text-right">
                                <div className="flex items-center gap-1 text-green-600 font-medium justify-end">
                                    <IndianRupee size={16} />
                                    <span>{rider.earnings.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-gray-500">Total Earnings</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RidersList;
