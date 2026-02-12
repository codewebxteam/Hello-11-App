import React from 'react';
import { Car, Users, Navigation, CreditCard, Clock, CheckCircle, ArrowRight, Map, MapPin } from 'lucide-react';

const DashboardHome: React.FC = () => {
    // Mock Data for Hello-11 Ride App
    const stats = [
        { title: 'Total Rides', value: '1,245', icon: Car, color: 'bg-yellow-400', iconColor: 'text-black' },
        { title: 'Total Users', value: '8,500', icon: Users, color: 'bg-green-100', iconColor: 'text-green-600' },
        { title: 'Active Drivers', value: '142', icon: Navigation, color: 'bg-blue-100', iconColor: 'text-blue-600' },
        { title: 'Total Earnings', value: '₹4,50,200', icon: CreditCard, color: 'bg-yellow-100', iconColor: 'text-yellow-700' },
        { title: 'Ongoing Trips', value: '24', icon: Map, color: 'bg-purple-100', iconColor: 'text-purple-600' },
        { title: 'Pending Approvals', value: '15', icon: Clock, color: 'bg-red-50', iconColor: 'text-red-500' },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your ride-hailing platform.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
                        Live Status: Online 🟢
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow group">
                        <div className={`p-4 rounded-full ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} className={stat.iconColor} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section: Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                        <p className="text-sm text-gray-500">Manage drivers and rides efficiently</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="bg-white p-6 rounded-xl border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-yellow-100 text-yellow-800 rounded-full group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900 block">Verify Drivers</span>
                                    <span className="text-xs text-gray-500">15 pending requests</span>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-gray-400 group-hover:text-black" />
                        </button>

                        <button className="bg-white p-6 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-200 transition-colors">
                                    <Map size={20} />
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900 block">Live Map</span>
                                    <span className="text-xs text-gray-500">Track 24 active rides</span>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-gray-400 group-hover:text-blue-600" />
                        </button>
                    </div>

                    {/* Recent Bookings Table (Simplified) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                            <button className="text-sm text-yellow-600 font-medium hover:underline">View All</button>
                        </div>
                        <div className="p-4 space-y-4">
                            {[
                                { id: 'RIDE-8821', user: 'Rahul K.', from: 'Lucknow Station', to: 'Charbagh', status: 'Completed', amount: '₹120' },
                                { id: 'RIDE-8822', user: 'Amit S.', from: 'Indira Nagar', to: 'Hazratganj', status: 'In Progress', amount: '₹85' },
                                { id: 'RIDE-8823', user: 'Priya M.', from: 'Gomti Nagar', to: 'Airport', status: 'Pending', amount: '₹350' },
                            ].map((ride, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                                            <Car size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{ride.user}</p>
                                            <p className="text-xs text-gray-500">{ride.from} → {ride.to}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{ride.amount}</p>
                                        <p className={`text-xs font-medium ${ride.status === 'Completed' ? 'text-green-600' :
                                            ride.status === 'In Progress' ? 'text-blue-600' : 'text-orange-500'
                                            }`}>{ride.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity & Zones */}
                <div className="space-y-6">
                    {/* Activity Feed */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Live Activity</h2>
                            <p className="text-sm text-gray-500">Real-time platform updates</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="relative">
                                <div className="absolute left-[15px] top-3 bottom-0 w-0.5 bg-gray-100"></div>

                                <div className="space-y-8 relative">
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <div key={i} className="flex items-start space-x-3 relative">
                                            <div className="relative z-10">
                                                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-full ring-4 ring-white">
                                                    <Clock size={14} />
                                                </div>
                                            </div>
                                            <div className="pt-1">
                                                <p className="text-sm font-medium text-gray-800 leading-tight">
                                                    {i === 0 ? 'New driver registration: Vikram S.' :
                                                        i === 1 ? 'Ride #8822 started' :
                                                            i === 2 ? 'High demand in Gomti Nagar' : 'Payment received ₹350'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">{i * 5 + 2} mins ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popular Zones */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-sm text-white">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-yellow-400" />
                            Top Zones
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span>Gomti Nagar</span>
                                <span className="font-bold text-yellow-400">45 Rides</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full w-[80%] rounded-full"></div>
                            </div>

                            <div className="flex justify-between items-center text-sm mt-2">
                                <span>Hazratganj</span>
                                <span className="font-bold text-yellow-400">32 Rides</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full w-[60%] rounded-full"></div>
                            </div>

                            <div className="flex justify-between items-center text-sm mt-2">
                                <span>Indira Nagar</span>
                                <span className="font-bold text-yellow-400">18 Rides</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full w-[35%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
