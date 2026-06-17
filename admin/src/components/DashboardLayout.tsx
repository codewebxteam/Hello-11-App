import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, LogOut, Menu, Bell } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateGlobalSearch = (value: string) => {
        const next = new URLSearchParams(searchParams);
        value.trim() ? next.set("q", value) : next.delete("q");
        setSearchParams(next, { replace: true });
    };

    const getTitle = (path: string) => {
        const titles: Record<string, string> = { 
            '/': 'Dashboard Overview', 
            '/users': 'User Management', 
            '/riders': 'Driver Partners', 
            '/bookings': 'Ride Bookings',
            '/analytics': 'Analytics & Insights',
            '/finance': 'Financial Reports',
            '/live-map': 'Live Tracking',
            '/allotment': 'Dispatch Center',
            '/ratings': 'Customer Ratings',
            '/coupons': 'Promo & Coupons',
            '/settings': 'System Settings'
        };
        return titles[path] || path.replace('/', '').charAt(0).toUpperCase() + path.slice(2);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-yellow-400 selection:text-black">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-[60] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0`}>
                <Sidebar isOpen={true} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-in fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Top Header - Glassmorphism */}
                <header className="bg-white/80 backdrop-blur-xl h-20 flex items-center justify-between px-6 md:px-10 border-b border-slate-200/60 sticky top-0 z-40">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="md:hidden p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
                        >
                            <Menu size={28} />
                        </button>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">{getTitle(location.pathname)}</h2>
                            <p className="hidden md:block text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Management System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" size={22} />
                            <input 
                                type="text" 
                                onChange={(e) => updateGlobalSearch(e.target.value)} 
                                placeholder="Search everything..." 
                                className="pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-full text-base w-72 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-400 focus:bg-white transition-all shadow-sm font-medium placeholder-slate-400" 
                            />
                        </div>

                        {/* Notification Bell */}
                        <button className="relative p-3 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95">
                            <Bell size={24} />
                            <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                                className="flex items-center gap-3 p-1 pr-4 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100 active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-black flex items-center justify-center font-bold shadow-inner text-yellow-400 text-lg">
                                    A
                                </div>
                                <span className="hidden md:block text-base font-bold text-slate-700">Admin</span>
                            </button>
                            
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-4 transform origin-top-right">
                                    <div className="px-5 py-3 border-b border-slate-100 mb-1">
                                        <p className="text-sm font-black text-slate-900">Admin User</p>
                                        <p className="text-xs font-medium text-slate-500 truncate">admin@hello11.in</p>
                                    </div>
                                    <div className="px-2">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-sm font-bold flex items-center gap-3 transition-colors">
                                            <LogOut size={16} /> Secure Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;