import axios from "axios";
import { Platform } from "react-native";

// Driver app API base URL configuration
export const getBaseUrl = (): string => {
  // Check for production API URL from environment variable
  const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL;

  if (PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }

  // Development mode - use local network IP for physical device support
  if (__DEV__) {
    // Based on Metro log: exp://192.168.1.14:8081
    return "http://192.168.1.14:5001";
  }

  // Fallback (should be set via environment variable in production)
  return "http://localhost:5001";
};

export const API_BASE_URL = getBaseUrl();

// API Endpoints - matching backend routes
export const API_ENDPOINTS = {
  // Auth (Public)
  DRIVER_REGISTER: "/api/drivers/register",
  DRIVER_LOGIN: "/api/drivers/login",

  // Nearby drivers (Public)
  NEARBY_DRIVERS: "/api/drivers/nearby",
  GET_DRIVER: (id: string) => `/api/drivers/${id}`,

  // Protected routes
  DRIVER_PROFILE: "/api/drivers/profile",
  UPDATE_PROFILE: "/api/drivers/profile",
  UPDATE_VEHICLE: "/api/drivers/vehicle",
  UPDATE_DOCUMENTS: "/api/drivers/documents",
  UPDATE_LOCATION: "/api/drivers/location",
  REQUEST_PAYOUT: "/api/drivers/payout",
  UPDATE_PROFILE_IMAGE: "/api/drivers/profile-image",
  FORGOT_PASSWORD: "/api/drivers/forgot-password",
  RESET_PASSWORD: "/api/drivers/reset-password",
  GET_EARNINGS: "/api/drivers/earnings",
  TOGGLE_AVAILABILITY: "/api/drivers/availability",
  TOGGLE_ONLINE: "/api/drivers/online",

  // Bookings
  AVAILABLE_BOOKINGS: "/api/drivers/bookings/available",
  CURRENT_BOOKING: "/api/drivers/bookings/current",
  BOOKINGS_HISTORY: "/api/drivers/bookings/history",
  ACCEPT_BOOKING: (id: string) => `/api/drivers/bookings/${id}/accept`,
  REJECT_BOOKING: (id: string) => `/api/drivers/bookings/${id}/reject`,
  UPDATE_BOOKING_STATUS: (id: string) => `/api/drivers/bookings/${id}/status`,
  CANCEL_BOOKING: (id: string) => `/api/drivers/bookings/${id}/cancel`,
  VERIFY_OTP: (id: string) => `/api/drivers/bookings/${id}/verify-otp`,
  COMPLETE_RIDE: (id: string) => `/api/drivers/bookings/${id}/complete`,
  GET_BOOKING_BY_ID: (id: string) => `/api/drivers/bookings/${id}/details`,
  BOOKING_STATUS: (id: string) => `/api/bookings/${id}/status`,
  START_WAITING: (id: string) => `/api/bookings/${id}/start-waiting`,

  // Chat
  GET_CHAT_HISTORY: (bookingId: string) => `/api/chat/${bookingId}`,
  SEND_CHAT_MESSAGE: "/api/chat/send",

  // Earnings & Stats
  EARNINGS: "/api/drivers/earnings",
  REVIEWS: "/api/drivers/reviews",
  DASHBOARD: "/api/drivers/dashboard",

  // Location (Photon/OSRM via Backend)
  GEOCODE: "/api/location/geocode",
  REVERSE_GEOCODE: "/api/location/reverse",
  DIRECTIONS: "/api/location/directions",
  AUTOCOMPLETE: "/api/location/autocomplete",
  LOCATION_STATUS: "/api/location/status",

  // Account
  CHANGE_PASSWORD: "/api/drivers/password",
  LOGOUT: "/api/drivers/logout",
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const { getDriverToken } = await require("./storage");
      const token = await getDriverToken();
      if (token) {
        config.headers.Authorization = "Bearer " + token;
      }
    } catch (error) {
      console.log("Error getting driver token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized - driver token may be expired");
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ================= DRIVER AUTH API =================
export const driverAuthAPI = {
  register: (data: {
    name: string;
    mobile: string;
    password: string;
    vehicleModel: string;
    vehicleNumber: string;
    vehicleType?: string;
    serviceType?: string;
  }) => api.post(API_ENDPOINTS.DRIVER_REGISTER, data),

  login: (data: { mobile: string; password: string }) =>
    api.post(API_ENDPOINTS.DRIVER_LOGIN, data),

  logout: () => api.post(API_ENDPOINTS.LOGOUT),
};

// ================= DRIVER API =================
export const driverAPI = {
  // Public
  getNearbyDrivers: () => api.get(API_ENDPOINTS.NEARBY_DRIVERS),
  getDriverById: (id: string) => api.get(API_ENDPOINTS.GET_DRIVER(id)),

  // Profile
  getProfile: () => api.get(API_ENDPOINTS.DRIVER_PROFILE),
  updateProfile: (data: { name?: string; mobile?: string; experienceYears?: number }) =>
    api.put(API_ENDPOINTS.UPDATE_PROFILE, data),
  updateVehicle: (data: { vehicleModel?: string; vehicleNumber?: string; vehicleColor?: string; vehicleType?: string; serviceType?: string }) =>
    api.put(API_ENDPOINTS.UPDATE_VEHICLE, data),
  updateDocuments: (data: { license?: string; insurance?: string; registration?: string }) =>
    api.put(API_ENDPOINTS.UPDATE_DOCUMENTS, data),
  requestPayout: (amount: number) =>
    api.post(API_ENDPOINTS.REQUEST_PAYOUT, { amount }),
  updateProfileImage: (profileImage: string) =>
    api.put(API_ENDPOINTS.UPDATE_PROFILE_IMAGE, { profileImage }),
  forgotPassword: (mobile: string) =>
    api.post(API_ENDPOINTS.FORGOT_PASSWORD, { mobile }),
  resetPassword: (data: any) =>
    api.post(API_ENDPOINTS.RESET_PASSWORD, data),
  updateLocation: (coords: { latitude: number; longitude: number }) =>
    api.put(API_ENDPOINTS.UPDATE_LOCATION, coords),
  toggleAvailability: () => api.put(API_ENDPOINTS.TOGGLE_AVAILABILITY),
  toggleOnline: () => api.put(API_ENDPOINTS.TOGGLE_ONLINE),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put(API_ENDPOINTS.CHANGE_PASSWORD, data),

  // Bookings
  getAvailableBookings: () => api.get(API_ENDPOINTS.AVAILABLE_BOOKINGS),
  getCurrentBooking: () => api.get(API_ENDPOINTS.CURRENT_BOOKING),
  getBookingsHistory: () => api.get(API_ENDPOINTS.BOOKINGS_HISTORY),
  getBookingById: (id: string) => api.get(API_ENDPOINTS.GET_BOOKING_BY_ID(id)),
  acceptBooking: (bookingId: string) =>
    api.post(API_ENDPOINTS.ACCEPT_BOOKING(bookingId)),
  rejectBooking: (bookingId: string) =>
    api.post(API_ENDPOINTS.REJECT_BOOKING(bookingId)),
  updateBookingStatus: (bookingId: string, status: string) =>
    api.put(API_ENDPOINTS.UPDATE_BOOKING_STATUS(bookingId), { status }),
  cancelBooking: (bookingId: string, reason: string) =>
    api.post(API_ENDPOINTS.CANCEL_BOOKING(bookingId), { reason }),
  verifyOtp: (bookingId: string, otp: string) =>
    api.post(API_ENDPOINTS.VERIFY_OTP(bookingId), { otp }),
  completeRide: (bookingId: string, data: { fare: number; distance: number }) =>
    api.post(API_ENDPOINTS.COMPLETE_RIDE(bookingId), data),
  startWaiting: (bookingId: string) =>
    api.put(API_ENDPOINTS.START_WAITING(bookingId)),
  getBookingStatus: (bookingId: string) =>
    api.get(API_ENDPOINTS.BOOKING_STATUS(bookingId)),

  // Chat
  getChatHistory: (bookingId: string) => api.get(API_ENDPOINTS.GET_CHAT_HISTORY(bookingId)),
  sendChatMessage: (data: { bookingId: string; sender: string; message: string }) =>
    api.post(API_ENDPOINTS.SEND_CHAT_MESSAGE, data),

  // Earnings & Stats
  getEarnings: (period?: string) => api.get(`${API_ENDPOINTS.GET_EARNINGS}${period ? '?period=' + period : ''}`),
  getReviews: () => api.get(API_ENDPOINTS.REVIEWS),
  getDashboard: () => api.get(API_ENDPOINTS.DASHBOARD),
};

// ================= LOCATION API =================
export const locationAPI = {
  geocode: (address: string) =>
    api.get(API_ENDPOINTS.GEOCODE, { params: { address } }),

  reverseGeocode: (lat: number, lon: number) =>
    api.get(API_ENDPOINTS.REVERSE_GEOCODE, { params: { lat, lon } }),

  getDirections: (lat1: number, lon1: number, lat2: number, lon2: number) =>
    api.get(API_ENDPOINTS.DIRECTIONS, { params: { lat1, lon1, lat2, lon2 } }),

  getAutocomplete: (query: string) =>
    api.get(API_ENDPOINTS.AUTOCOMPLETE, { params: { query } }),

  getStatus: () => api.get(API_ENDPOINTS.LOCATION_STATUS),
};

export default api;
