import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, LogOut, User, Menu } from 'lucide-react'; // Menu icon add kiya

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // Dropdown ke liye
    const globalQuery = searchParams.get("q") || "";

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload(); // Redirect to login
    };

    // Mobile pe auto-close sidebar
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
        const titles: any = { '/': 'Dashboard', '/users': 'Users', '/riders': 'Drivers', '/bookings': 'Bookings' };
        return titles[path] || path.replace('/', '').charAt(0).toUpperCase() + path.slice(2);
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar mobile pe absolute, desktop pe fixed */}
            <div className={`fixed inset-y-0 z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0`}>
                <Sidebar isOpen={true} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>

            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Top Header */}
                <header className="bg-white h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><Menu /></button>
                        <h2 className="text-lg md:text-xl font-bold">{getTitle(location.pathname)}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" onChange={(e) => updateGlobalSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm w-48" />
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-bold shadow-sm">
                                A
                            </button>
                            
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-bold">Admin</p>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-bold flex items-center gap-2">
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6"><Outlet /></main>
            </div>
        </div>
    );
};

export default DashboardLayout;