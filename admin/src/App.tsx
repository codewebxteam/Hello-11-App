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

  // Check agar admin pehle se login hai (Token localStorage mein hai)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Login Handle karne ka function
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

  // Logout Handle karne ka function
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  // Agar login nahi hai, toh ye secure Login Screen dikhao
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-yellow-200">
              <span className="text-2xl font-black text-black">H11</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to manage Hello-11</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-4 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none"
                placeholder="hello11kld@gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl bg-black text-white font-bold tracking-wide shadow-lg hover:bg-gray-900 transition-all mt-6 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? "Verifying..." : "Secure Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Agar login successful ho gaya, toh aapka original Router aur Routes dikhayenge
  return (
    <>
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
      
    
    </>
  );
}

export default App;