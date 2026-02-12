import React, { useState } from 'react';
import { Search, Filter, Eye, CheckCircle, Clock, User, Car } from 'lucide-react';

const BookingsList: React.FC = () => {
    // Mock Data for Hello-11 Ride App
    const [bookings] = useState([
        {
            id: 'RIDE-2922',
            user: 'Rahul Sharma',
            phone: '+91 98765 00001',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            pickup: 'Lucknow Station, Charbagh',
            dropoff: 'Hazratganj Main Market',
            vehicle: 'Swift Dzire (Sedan)',
            driver: 'Rajesh Kumar',
            time: '10:30 AM',
            date: '12 Feb, 10:30 am',
            amount: 350
        },
        {
            id: 'RIDE-2923',
            user: 'Priya Patel',
            phone: '+91 98765 00002',
            status: 'ONGOING',
            paymentStatus: 'PENDING',
            pickup: 'Indira Nagar, Sec 12',
            dropoff: 'Airport Terminal 2',
            vehicle: 'WagonR (Mini)',
            driver: 'Vikram Singh',
            time: '02:15 PM',
            date: '12 Feb, 02:15 pm',
            amount: 550
        },
        {
            id: 'RIDE-2924',
            user: 'Amit Singh',
            phone: '+91 98765 00003',
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            pickup: 'Gomti Nagar, Patrakarpuram',
            dropoff: 'Lulu Mall',
            vehicle: 'Honda Amaze (Sedan)',
            driver: 'Amit Verma',
            time: '04:45 PM',
            date: '11 Feb, 04:45 pm',
            amount: 200
        },
        {
            id: 'RIDE-2925',
            user: 'Sneha Gupta',
            phone: '+91 98765 00004',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            pickup: 'Alambagh Bus Stand',
            dropoff: 'Hazaratganj',
            vehicle: 'Alto 800 (Mini)',
            driver: 'Suresh Yadav',
            time: '09:00 AM',
            date: '11 Feb, 09:00 am',
            amount: 180
        }
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-gray-500 mt-1 text-sm">{bookings.length} total bookings</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by booking ID, customer name, phone..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm placeholder-gray-400"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 overflow-x-auto pb-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-yellow-50 hover:text-gray-900 whitespace-nowrap transition-colors">
                    <Filter size={16} /> All Status
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-yellow-50 hover:text-gray-900 whitespace-nowrap transition-colors">
                    <Filter size={16} /> All Vehicles
                </button>
                <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-yellow-50 hover:text-gray-900 whitespace-nowrap transition-colors">
                    Sort by Date
                </button>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
                {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                            {/* Left Side: Basic Info */}
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                                    <h3 className="font-bold text-gray-900 text-lg">{booking.id}</h3>
                                    <div className="flex gap-2">
                                        <span className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            <CheckCircle size={12} /> {booking.status}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded font-bold border ${booking.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                                            booking.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                'bg-orange-100 text-orange-700 border-orange-200'
                                            }`}>
                                            {booking.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="font-medium text-gray-900">{booking.pickup}</span>
                                            </div>
                                            <div className="w-0.5 h-3 bg-gray-300 ml-0.5"></div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span className="font-medium text-gray-900">{booking.dropoff}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            <span className="text-gray-900 font-medium">{booking.user}</span>
                                            <span className="text-gray-400 text-xs">({booking.phone})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Car size={16} className="text-gray-400" />
                                            <span className="text-gray-700">{booking.vehicle}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-gray-500 text-xs">Driver: {booking.driver}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                        <Clock size={12} /> {booking.time}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Actions & Price */}
                            <div className="flex lg:flex-col justify-between items-end gap-4 lg:min-w-[140px]">
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-900">₹{booking.amount}</p>
                                    <p className="text-xs text-gray-400">{booking.date}</p>
                                </div>
                                <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                                    <Eye size={16} /> details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingsList;
