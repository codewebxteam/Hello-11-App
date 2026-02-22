import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
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

  // Bookings
  getBookings: () => api.get('/api/admin/bookings'),
  updateBookingStatus: (id: string, status: string) =>
    api.put(`/api/admin/bookings/${id}/status`, { status }),
};

export default api;
