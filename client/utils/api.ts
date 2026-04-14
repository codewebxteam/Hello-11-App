import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/apiConfig";
import { getToken, removeToken, clearStorage } from "./storage";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store for logout callback (will be set by AuthContext)
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

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
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        console.warn(`Unauthorized (401) from ${error.config?.url}. Logging out.`);
        
        // Clear stored auth data
        await clearStorage();
        
        // Call logout callback if set
        if (logoutCallback) {
          logoutCallback();
        }
      } else {
        console.log(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status}`, data);
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

  updateProfile: (data: { name?: string; email?: string; gender?: string; pushToken?: string }) =>
    api.put(API_ENDPOINTS.UPDATE_PROFILE, data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put(API_ENDPOINTS.CHANGE_PASSWORD, data),

  getHistory: (page = 1, limit = 10, filters?: { bookingType?: string; scheduleView?: string; rideType?: string; status?: string; paymentStatus?: string; startDate?: string; endDate?: string }) => 
    api.get(API_ENDPOINTS.USER_HISTORY, { 
      params: { 
        page, 
        limit,
        ...(filters?.bookingType && { bookingType: filters.bookingType }),
        ...(filters?.scheduleView && { scheduleView: filters.scheduleView }),
        ...(filters?.rideType && { rideType: filters.rideType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
      } 
    }),

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

  getScheduledHistory: (page = 1, limit = 10, filters?: { rideType?: string; status?: string; paymentStatus?: string; startDate?: string; endDate?: string }) => 
    api.get('/api/bookings/scheduled/history', { 
      params: { 
        page, 
        limit,
        ...(filters?.rideType && { rideType: filters.rideType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
      } 
    }),

  getBookingById: (id: string) => api.get(API_ENDPOINTS.GET_BOOKING_BY_ID(id), { params: { compact: 1 } }),

  getBookingStatus: (id: string) => api.get(API_ENDPOINTS.BOOKING_STATUS(id)),

  cancelBooking: (id: string) => api.put(API_ENDPOINTS.CANCEL_BOOKING(id)),

  startRide: (id: string, otp: string) =>
    api.put(API_ENDPOINTS.START_RIDE(id), { otp }),

  completeRide: (id: string, data: { fare: number; distance: number }) =>
    api.put(API_ENDPOINTS.COMPLETE_RIDE(id), data),

  acceptReturnOffer: (id: string) =>
    api.put(API_ENDPOINTS.ACCEPT_RETURN(id)),

  confirmReturnStart: (id: string) =>
    api.put(`/api/bookings/${id}/confirm-return-start`),

  verifyPayment: (id: string, paymentMethod: string, isFirstLeg?: boolean) =>
    api.put(API_ENDPOINTS.VERIFY_PAYMENT(id), { paymentMethod, isFirstLeg }),

  updatePaymentChoice: (id: string, paymentChoice: 'leg_by_leg' | 'total_at_end') =>
    api.put(`/api/bookings/${id}/update-payment-choice`, { paymentChoice }),

  getActiveBooking: () => api.get('/api/bookings/active'),
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

  // Get autocomplete suggestions (India-restricted with wider proximity bias)
  getAutocomplete: (query: string, lat?: number, lon?: number) =>
    api.get(API_ENDPOINTS.AUTOCOMPLETE, { params: { query, lat, lon } }),

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
  calculateTripFare: (data: {
    distance: number;
    carType: "5seater" | "7seater";
    service: "cab" | "rental";
    tripType?: "one-way" | "round-trip";
    bookingTime?: string;
  }) => api.post(API_ENDPOINTS.CALCULATE_TRIP_FARE, data),
};

// ================= NOTIFICATION API =================
export const notificationAPI = {
  getNotifications: () => api.get(API_ENDPOINTS.NOTIFICATIONS),
  markAsRead: (id: string) => api.patch(API_ENDPOINTS.MARK_NOTIFICATION_READ(id)),
  markAllRead: () => api.patch(API_ENDPOINTS.MARK_ALL_READ),
  clearAll: () => api.delete(API_ENDPOINTS.CLEAR_NOTIFICATIONS),
};

export default api;
