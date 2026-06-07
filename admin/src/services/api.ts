import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================= ADMIN API =================
export const adminAPI = {
  // Auth
  login: (credentials: any) => api.post('/api/admin/login', credentials),

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
  
  // --- Admin Cancel Ride ---
  cancelBooking: (id: string) => api.post(`/api/admin/bookings/${id}/cancel`),

  // Financials
  getFinancials: () => api.get('/api/admin/financials'),
};

export default api;