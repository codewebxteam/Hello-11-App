import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agar aapke paas interceptor nahi hai token attach karne ka, toh ye zaroor add karein:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================= ADMIN API =================
export const adminAPI = {
  // Dashboard
  getStats: () => api.get('/api/admin/stats'),

  // Users
  getUsers: () => api.get('/api/admin/users'),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

  // Drivers
  getDrivers: () => api.get('/api/admin/drivers'),
  deleteDriver: (id: string) => api.delete(`/api/admin/drivers/${id}`),
  verifyDriver: (id: string, isVerified: boolean, verificationNote?: string) => 
    api.put(`/api/admin/drivers/${id}/verify`, { isVerified, verificationNote }),
  resetCommission: (id: string) =>
    api.put(`/api/admin/drivers/${id}/reset-commission`),

  // Bookings
  getBookings: () => api.get('/api/admin/bookings'),
  updateBookingStatus: (id: string, status: string) =>
    api.put(`/api/admin/bookings/${id}/status`, { status }),
  
  // --- NAYA ROUTE: Admin Cancel Ride Ke Liye ---
  cancelBooking: (id: string) => api.post(`/api/admin/bookings/${id}/cancel`),

  // Financials
  getFinancials: () => api.get('/api/admin/financials'),
};

export default api;