import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    // Helper to get title based on path
    const getTitle = (path: string) => {
        switch (path) {
            case '/': return 'Dashboard';
            case '/users': return 'Users';
            case '/riders': return 'Drivers';
            case '/bookings': return 'Bookings';
            case '/live-map': return 'Live Map';
            case '/allotment': return 'Dispatch';
            case '/ratings': return 'Ratings';
            case '/coupons': return 'Coupons';
            case '/analytics': return 'Analytics';
            case '/settings': return 'Settings';
            default: return path.replace('/', '').charAt(0).toUpperCase() + path.slice(2);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Top Header */}
                <header className="bg-white h-16 flex items-center justify-between px-8 border-b border-gray-200 sticky top-0 z-10 transition-shadow">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-900">{getTitle(location.pathname)}</h2>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:border-yellow-400 focus:bg-white focus:outline-none rounded-lg text-sm w-64 transition-all placeholder-gray-400"
                            />
                        </div>

                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group">
                            <Bell size={20} className="group-hover:text-gray-700" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">Admin</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-lg shadow-sm border border-yellow-200">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
