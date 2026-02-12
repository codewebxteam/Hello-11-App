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
    ChevronLeft
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const menuItems = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/live-map', label: 'Live Map', icon: <MapPin size={20} /> },
        { path: '/users', label: 'Users', icon: <Users size={20} /> },
        { path: '/riders', label: 'Drivers', icon: <Truck size={20} /> },
        { path: '/bookings', label: 'Bookings', icon: <ClipboardList size={20} /> },
        { path: '/allotment', label: 'Dispatch', icon: <ListRestart size={20} /> },
        { path: '/ratings', label: 'Ratings', icon: <Star size={20} /> },
        { path: '/coupons', label: 'Coupons', icon: <Ticket size={20} /> },
        { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} />, badge: 'Soon' },
        { path: '/settings', label: 'Settings', icon: <Settings size={20} />, badge: 'Soon' },
    ];

    return (
        <div className={`${isOpen ? 'w-64' : 'w-20'} h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 transition-all duration-300 z-50`}>
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all z-50 focus:outline-none"
            >
                <ChevronLeft size={16} className={`transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
            </button>

            {/* Header - Fixed to h-16 to match DashboardLayout Header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100 overflow-hidden">
                <div className="flex items-center space-x-3 w-full">
                    <div className="w-10 h-10 min-w-[2.5rem] bg-yellow-400 rounded-xl flex items-center justify-center text-black font-extrabold shadow-sm text-sm">
                        H11
                    </div>

                    <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">Hello-11</h1>
                        <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap uppercase tracking-wider">Admin Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center ${isOpen ? 'px-4' : 'justify-center px-2'} py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-yellow-400 text-black font-semibold shadow-sm'
                                        : 'text-gray-600 hover:bg-yellow-50 hover:text-gray-900'
                                    }`
                                }
                                title={!isOpen ? item.label : ''}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className="flex items-center space-x-3">
                                            <span className={`${isActive ? 'text-black' : 'text-gray-500 group-hover:text-gray-900'} min-w-[20px]`}>
                                                {item.icon}
                                            </span>
                                            <span className={`whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {item.badge && isOpen && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${isActive ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-500'
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
        </div>
    );
};

export default Sidebar;
