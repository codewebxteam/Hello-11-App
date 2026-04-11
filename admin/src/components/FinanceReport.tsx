import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  ArrowUpRight, 
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { getAdminCommission, getBookingTotalFare, getOneWayFare } from '../utils/fare';

const FinanceReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'commissions'>('transactions');
  const [error, setError] = useState<string | null>(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getFinancials();
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch finance data:', err);
      setError('Failed to load financial records. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  const { transactions = [], rideCommissions = [] } = data || {};

  // Simple aggregation for stats
  const totalReceived = transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const totalExpected = rideCommissions.reduce((sum: number, ride: any) => sum + getAdminCommission(ride), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Reports</h1>
          <p className="text-gray-500 mt-1 font-medium">A to Z overview of commissions and driver payments</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm uppercase tracking-wider"
        >
          {refreshing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Total Received</p>
            <h3 className="text-2xl font-black text-gray-900">₹{totalReceived.toLocaleString()}</h3>
            <p className="text-green-500 text-[10px] font-bold mt-1 flex items-center gap-1">
              <TrendingUp size={10} /> +12% from last month
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Lifetime Revenue</p>
            <h3 className="text-2xl font-black text-gray-900">₹{totalExpected.toLocaleString()}</h3>
            <p className="text-blue-500 text-[10px] font-bold mt-1">Expected from all rides</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600">
            <ArrowUpRight size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Commission Rate</p>
            <h3 className="text-2xl font-black text-gray-900">10-15%</h3>
            <p className="text-gray-400 text-[10px] font-bold mt-1">Average platform fee</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-100 flex w-full sm:w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'transactions' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Driver Payments
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'commissions' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Ride Breakdown
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'transactions' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length > 0 ? (
                  transactions.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                             <User size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{tx.driver?.name || "Deleted Driver"}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase font-mono">{tx.driver?.mobile || "---"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-black text-gray-900">₹{tx.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase tracking-tight">{tx.method}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-bold">No payment records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ride</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fare Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver Split</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rideCommissions.length > 0 ? (
                  rideCommissions.map((ride: any) => (
                    <tr key={ride._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <MapPin size={10} className="text-green-500" />
                             <p className="text-[11px] font-medium text-gray-600 truncate max-w-[150px]">{ride.pickupLocation}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <MapPin size={10} className="text-red-500" />
                             <p className="text-[11px] font-bold text-gray-900 truncate max-w-[150px]">{ride.dropLocation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{ride.driver?.name || "Unknown Driver"}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              {ride.driver?._id ? `ID: ${String(ride.driver._id).slice(-6)}` : "No Driver"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-black text-gray-900">₹{getBookingTotalFare(ride).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Base: Rs {getOneWayFare(ride).toLocaleString()} {(Number(ride.returnTripFare || 0) > 0 || Number(ride.tollFee || 0) > 0 || Number(ride.penaltyApplied || 0) > 0) ? '+ Extras: Rs ' + (Number(ride.returnTripFare || 0) + Number(ride.tollFee || 0) + Number(ride.penaltyApplied || 0)).toLocaleString() : ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-yellow-600">
                          <p className="text-sm font-black">₹{getAdminCommission(ride).toLocaleString()}</p>
                          <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Admin Fee</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-blue-600">
                           <p className="text-sm font-black">₹{Number(ride.driverEarnings ?? (getBookingTotalFare(ride) - getAdminCommission(ride))).toLocaleString()}</p>
                           <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">to driver</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-600">{new Date(ride.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-bold">No ride commission data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceReport;







