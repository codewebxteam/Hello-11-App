import React, { useMemo } from "react";
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    Truck, 
    ClipboardList, 
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieChartIcon,
    Calendar,
    RefreshCw
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";
import { useData } from "../context/DataContext";
import type { Booking } from "../context/DataContext";
import { getBookingTotalFare } from "../utils/fare";

const COLORS = ['#FACC15', '#000000', '#71717A', '#E2E8F0', '#FDE047'];

const getAmount = (b: Booking) => getBookingTotalFare(b);

const AnalyticsPage: React.FC = () => {
  const { stats, bookings, refreshing, error: contextError, refreshAll } = useData();
  const error = contextError;
  const fetchData = refreshAll;

  const processedData = useMemo(() => {
    // 1. Daily Trends
    const dailyMap = new Map();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => dailyMap.set(date, { date, bookings: 0, revenue: 0 }));

    bookings.forEach(b => {
      const date = b.createdAt ? b.createdAt.split('T')[0] : null;
      if (date && dailyMap.has(date)) {
        const current = dailyMap.get(date);
        current.bookings += 1;
        if (b.status === 'completed') {
            current.revenue += getAmount(b);
        }
      }
    });

    const dailyTrends = Array.from(dailyMap.values());

    // 2. Ride Type Distribution
    const outstation = bookings.filter(b => b.rideType === 'outstation').length;
    const normal = bookings.filter(b => b.rideType !== 'outstation').length;
    const rideTypeData = [
        { name: 'Normal', value: normal },
        { name: 'Outstation', value: outstation }
    ];

    // 3. Status Breakdown
    const statusCounts: Record<string, number> = {};
    bookings.forEach(b => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusCounts[status]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Derived stats
    const total = stats.totalBookings || 0;
    const completionRate = total > 0 ? ((stats.completedTrips / total) * 100).toFixed(1) : "0.0";
    const cancellationRate = total > 0 ? ((stats.cancelledTrips / total) * 100).toFixed(1) : "0.0";
    const avgTicket = stats.completedTrips > 0 ? Math.round(stats.totalEarnings / stats.completedTrips) : 0;

    return { dailyTrends, rideTypeData, statusData, completionRate, cancellationRate, avgTicket };
  }, [bookings, stats]);


  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <TrendingUp className="text-yellow-500" />
            Performance Insights
          </h1>
          <p className="text-gray-500 mt-1">Real-time business intelligence and booking analytics</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-2 text-sm text-gray-600 shadow-sm">
                <Calendar size={16} />
                <span>Last 7 Days</span>
            </div>
            <button 
                onClick={() => fetchData()} 
                disabled={refreshing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg shadow-gray-200 hover:scale-[1.02] transition-all active:scale-[0.98] ${refreshing ? 'opacity-70' : ''}`}
            >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          {error}
        </div>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
            title="Success Rate" 
            value={`${processedData.completionRate}%`} 
            icon={<ClipboardList className="text-yellow-600" />} 
            trend="+2.5%" 
            trendUp={true}
            color="bg-yellow-50"
        />
        <MetricCard 
            title="Avg. Ticket Size" 
            value={`₹${processedData.avgTicket.toLocaleString()}`} 
            icon={<DollarSign className="text-green-600" />} 
            trend="+120" 
            trendUp={true}
            color="bg-green-50"
        />
        <MetricCard 
            title="Cancel Rate" 
            value={`${processedData.cancellationRate}%`} 
            icon={<BarChart3 className="text-red-600" />} 
            trend="-0.8%" 
            trendUp={false}
            color="bg-red-50"
        />
        <MetricCard 
            title="Total Users" 
            value={stats.totalUsers.toLocaleString()} 
            icon={<Users className="text-blue-600" />} 
            trend="+84" 
            trendUp={true}
            color="bg-blue-50"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Volume - Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-6 px-1">Booking Volume Trend</h3>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processedData.dailyTrends}>
                        <defs>
                            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FACC15" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            tickFormatter={(val: string) => new Date(val).toLocaleDateString('en-IN', { weekday: 'short' })}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                            itemStyle={{ color: '#000' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="bookings" 
                            stroke="#EAB308" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorBookings)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Status Distribution - Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                Status Distribution
                <PieChartIcon size={18} className="text-gray-400" />
            </h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={processedData.statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {processedData.statusData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
                {processedData.statusData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bars */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Performance (INR)</h3>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData.dailyTrends}>
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            tickFormatter={(val: string) => new Date(val).toLocaleDateString('en-IN', { weekday: 'short' })}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="revenue" fill="#000000" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Ride Mix and Comparison */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Service Area Distribution</h3>
            <div className="flex flex-1 flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={processedData.rideTypeData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label
                            >
                                {processedData.rideTypeData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-6">
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Truck size={20} className="text-yellow-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">Driver Efficiency</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Drivers</p>
                                <p className="text-xl font-bold text-gray-900">{stats.activeDrivers}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Participation</p>
                                <p className="text-xl font-bold text-gray-900">{stats.totalDrivers > 0 ? ((stats.activeDrivers / stats.totalDrivers) * 100).toFixed(0) : 0}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-black border border-gray-800 text-white">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Lifetime Revenue</p>
                        <p className="text-2xl font-bold text-white">₹{Math.round(stats.totalEarnings).toLocaleString()}</p>
                        <div className="mt-4 flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                            <ArrowUpRight size={14} />
                            Verified Transactions
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    trendUp: boolean;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendUp, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl ${color}`}>
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold py-1 px-2 rounded-lg ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend}
            </div>
        </div>
        <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    </div>
);

export default AnalyticsPage;
