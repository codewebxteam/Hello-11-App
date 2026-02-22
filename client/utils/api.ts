import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/apiConfig";
import { getToken } from "./storage";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      if (status === 401) {
        // Token expired or invalid - could trigger logout
        console.warn("Unauthorized - token may be expired");
      }
      return Promise.reject(data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ message: "Network error. Please check your connection." });
    }
    return Promise.reject({ message: "Something went wrong." });
  }
);

// ================= AUTH API =================
export const authAPI = {
  signup: (data: { name: string; mobile: string; password: string }) =>
    api.post(API_ENDPOINTS.SIGNUP, data),

  signin: (data: { mobile: string; password: string }) =>
    api.post(API_ENDPOINTS.SIGNIN, data),

  forgotPassword: (data: { mobile: string }) =>
    api.post(API_ENDPOINTS.FORGOT_PASSWORD, data),

  resetPassword: (data: { mobile: string; otp: string; newPassword: string }) =>
    api.post(API_ENDPOINTS.RESET_PASSWORD, data),
};

// ================= USER API =================
export const userAPI = {
  getProfile: () => api.get(API_ENDPOINTS.PROFILE),

  updateProfile: (data: { name?: string; email?: string; gender?: string }) =>
    api.put(API_ENDPOINTS.UPDATE_PROFILE, data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put(API_ENDPOINTS.CHANGE_PASSWORD, data),

  getHistory: () => api.get(API_ENDPOINTS.USER_HISTORY),

  rateDriver: (data: { bookingId: string; rating: number; feedback?: string }) =>
    api.post("/api/users/rate-driver", data),
};

// ================= BOOKING API =================
export const bookingAPI = {
  createBooking: (data: {
    pickupLocation: string;
    dropLocation: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    dropLatitude?: number;
    dropLongitude?: number;
    rideType?: string;
    bookingType?: string;
    scheduledDate?: string;
    fare?: number;
    baseFare?: number;
    distance?: number;
    duration?: number;
    vehicleType?: string;
  }) => api.post(API_ENDPOINTS.CREATE_BOOKING, data),

  getBookings: () => api.get(API_ENDPOINTS.GET_BOOKINGS),

  getScheduledBookings: () => api.get('/api/bookings/scheduled'),

  getScheduledHistory: () => api.get('/api/bookings/scheduled/history'),

  getBookingById: (id: string) => api.get(API_ENDPOINTS.GET_BOOKING_BY_ID(id)),

  getBookingStatus: (id: string) => api.get(API_ENDPOINTS.BOOKING_STATUS(id)),

  cancelBooking: (id: string) => api.put(API_ENDPOINTS.CANCEL_BOOKING(id)),

  startRide: (id: string, otp: string) =>
    api.put(API_ENDPOINTS.START_RIDE(id), { otp }),

  completeRide: (id: string, data: { fare: number; distance: number }) =>
    api.put(API_ENDPOINTS.COMPLETE_RIDE(id), data),

  acceptReturnOffer: (id: string) =>
    api.put(API_ENDPOINTS.ACCEPT_RETURN(id)),

  verifyPayment: (id: string, paymentMethod: string) =>
    api.put(API_ENDPOINTS.VERIFY_PAYMENT(id), { paymentMethod }),
};

// ================= DRIVER API =================
export const driverAPI = {
  getNearbyDrivers: (latitude?: number, longitude?: number, serviceType?: string) =>
    api.get(API_ENDPOINTS.NEARBY_DRIVERS, { params: { latitude, longitude, serviceType } }),

  getDriverById: (id: string) => api.get(API_ENDPOINTS.GET_DRIVER(id)),

  updateLocation: (data: { latitude: number; longitude: number }) =>
    api.put(API_ENDPOINTS.UPDATE_DRIVER_LOCATION, data),

  toggleAvailability: () => api.put(API_ENDPOINTS.TOGGLE_AVAILABILITY),
};

// ================= LOCATION API (LocationIQ) =================
export const locationAPI = {
  // Forward geocoding: Convert address to coordinates
  geocode: (address: string) =>
    api.get(API_ENDPOINTS.GEOCODE, { params: { address } }),

  // Reverse geocoding: Convert coordinates to address
  reverseGeocode: (lat: number, lon: number) =>
    api.get(API_ENDPOINTS.REVERSE_GEOCODE, { params: { lat, lon } }),

  // Get directions between two points
  getDirections: (lat1: number, lon1: number, lat2: number, lon2: number) =>
    api.get(API_ENDPOINTS.DIRECTIONS, { params: { lat1, lon1, lat2, lon2 } }),

  // Get autocomplete suggestions
  getAutocomplete: (query: string) =>
    api.get(API_ENDPOINTS.AUTOCOMPLETE, { params: { query } }),

  // Check API status
  getStatus: () => api.get(API_ENDPOINTS.LOCATION_STATUS),

  // Calculate distance and get recommendation
  calculateDistanceAndRecommend: (lat1: number, lon1: number, lat2: number, lon2: number) =>
    api.post(API_ENDPOINTS.DISTANCE_RECOMMEND, { lat1, lon1, lat2, lon2 }),
};

// ================= CHAT API =================
export const chatAPI = {
  getHistory: (bookingId: string) => api.get(API_ENDPOINTS.GET_CHAT_HISTORY(bookingId)),
  sendMessage: (data: { bookingId: string; sender: string; message: string }) =>
    api.post('/api/chat/send', data),
};

// ================= FARE API =================
export const fareAPI = {
  getOutstationRates: () => api.get(API_ENDPOINTS.GET_OUTSTATION_RATES),
  calculateEstimate: (data: { distanceKm: number; cabType: string; bookingType: string }) =>
    api.post(API_ENDPOINTS.CALCULATE_FARE, data),
};

// ================= NOTIFICATION API =================
export const notificationAPI = {
  getNotifications: () => api.get(API_ENDPOINTS.NOTIFICATIONS),
  markAsRead: (id: string) => api.patch(API_ENDPOINTS.MARK_NOTIFICATION_READ(id)),
  markAllRead: () => api.patch(API_ENDPOINTS.MARK_ALL_READ),
  clearAll: () => api.delete(API_ENDPOINTS.CLEAR_NOTIFICATIONS),
};

export default api;
