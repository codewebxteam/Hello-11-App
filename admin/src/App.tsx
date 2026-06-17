import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import UsersList from './components/UsersList';
import RidersList from './components/RidersList';
import BookingsList from './components/BookingsList';
import LiveMapPage from './components/LiveMapPage';
import DispatchPage from './components/DispatchPage';
import RatingsPage from './components/RatingsPage';
import CouponsPage from './components/CouponsPage';
import AnalyticsPage from './components/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import FinanceReport from './components/FinanceReport';
import { adminAPI } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await adminAPI.login({ email, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4 relative overflow-hidden selection:bg-yellow-400 selection:text-black">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="w-full max-w-5xl bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative z-10 animate-in zoom-in-95 duration-700">
          
          {/* Left Side - Branding */}
          <div className="md:w-5/12 bg-gradient-to-br from-slate-900 to-black p-10 flex flex-col justify-between relative overflow-hidden border-r border-white/5">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-400/20 blur-[80px] rounded-full"></div>
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                <span className="text-3xl font-black text-black tracking-tighter">H11</span>
                </div>
                <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
                  Command<br/>Center.
                </h2>
                <p className="text-slate-400 font-medium text-lg">
                  Advanced management console for the Hello-11 mobility network.
                </p>
            </div>
            
            <div className="relative z-10 mt-12 md:mt-0">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-slate-300 font-bold text-xs uppercase tracking-widest">System Secure</span>
                </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="md:w-7/12 p-10 sm:p-14 md:p-20 flex flex-col justify-center bg-slate-950/50">
            <div className="max-w-md w-full mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-slate-400 font-medium">Authenticate to access the admin portal.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-sm font-bold mb-8 border border-rose-500/20 flex items-start gap-3">
                        <div className="mt-0.5">⚠️</div>
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all focus:bg-slate-900 font-medium"
                            placeholder="admin@hello11.in"
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center pl-1 pr-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Security Key</label>
                            <a href="#" className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors">Forgot?</a>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all focus:bg-slate-900 font-medium tracking-widest"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 mt-8 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? "Authenticating..." : "Authorize Access"}
                    </button>
                </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersList />} />
        <Route path="riders" element={<RidersList />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="live-map" element={<LiveMapPage />} />
        <Route path="allotment" element={<DispatchPage />} />
        <Route path="ratings" element={<RatingsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="finance" element={<FinanceReport />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;