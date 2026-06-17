import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    Users,
    Truck,
    ClipboardList,
    Settings,
    Ticket,
    Star,
    BarChart3,
    ListRestart,
    ChevronLeft,
    Wallet
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

type MenuItem = {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const menuItems: MenuItem[] = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={26} /> },
        { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={26} /> },
        { path: '/finance', label: 'Finance', icon: <Wallet size={26} /> },
        { path: '/live-map', label: 'Live Map', icon: <MapPin size={26} /> },
        { path: '/users', label: 'Users', icon: <Users size={26} /> },
        { path: '/riders', label: 'Drivers', icon: <Truck size={26} /> },
        { path: '/bookings', label: 'Bookings', icon: <ClipboardList size={26} /> },
        { path: '/allotment', label: 'Dispatch', icon: <ListRestart size={26} /> },
        { path: '/ratings', label: 'Ratings', icon: <Star size={26} /> },
        { path: '/coupons', label: 'Coupons', icon: <Ticket size={26} /> },
        { path: '/settings', label: 'Settings', icon: <Settings size={26} /> },
    ];

    return (
        <div className={`${isOpen ? 'w-64' : 'w-20'} h-full bg-[#0A0F1C] border-r border-slate-800 flex flex-col transition-all duration-300 z-50 shadow-2xl relative`}>
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 bg-slate-900 border border-slate-700 text-slate-400 hover:text-yellow-400 p-1.5 rounded-full shadow-lg hover:shadow-yellow-400/20 transition-all z-50 focus:outline-none"
            >
                <ChevronLeft size={16} className={`transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
            </button>

            {/* Header */}
            <div className="h-20 flex items-center px-4 border-b border-slate-800/50 overflow-hidden">
                <div className="flex items-center space-x-4 w-full pl-1">
                    <div className="w-12 h-12 min-w-[3rem] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(250,204,21,0.3)] text-base">
                        H11
                    </div>

                    <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        <h1 className="text-2xl font-black text-white leading-tight whitespace-nowrap tracking-tight">Hello-11</h1>
                        <p className="text-[11px] text-yellow-500 font-bold whitespace-nowrap uppercase tracking-[0.2em] mt-1">Admin Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden custom-scrollbar">
                <ul className="space-y-1.5 px-3">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center ${isOpen ? 'px-4' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold shadow-[0_4px_20px_-4px_rgba(250,204,21,0.4)]'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-medium'
                                    }`
                                }
                                title={!isOpen ? item.label : ''}
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* Animated Background active state */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        )}
                                        
                                        <div className="flex items-center space-x-4 relative z-10">
                                            <span className={`${isActive ? 'text-black' : 'text-slate-500 group-hover:text-yellow-400 transition-colors'} min-w-[26px]`}>
                                                {item.icon}
                                            </span>
                                            <span className={`whitespace-nowrap transition-all duration-300 tracking-wide font-bold text-lg ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        
                                        {item.badge && isOpen && (
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-auto relative z-10 ${isActive ? 'bg-black text-yellow-400' : 'bg-slate-800 text-slate-300'
                                                }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            
            {/* Bottom Section */}
            <div className={`p-4 border-t border-slate-800/50 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 overflow-hidden h-0 p-0'}`}>
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/10 rounded-bl-full"></div>
                    <p className="text-xs font-bold text-white mb-1">Hello-11 System</p>
                    <p className="text-[10px] text-slate-400">All systems operational</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
