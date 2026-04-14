import axios from "axios";
import Constants from 'expo-constants';


// Driver app API base URL configuration
export const getBaseUrl = (): string => {
  // 1. Check if an explicit URL is provided in .env (Priority)
  const EXPLICIT_API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (EXPLICIT_API_URL) return EXPLICIT_API_URL;

  // 2. Dynamic Detection for Development
  // Works for both Emulator (localhost) and Physical Device (Local IP)
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':').shift();

  if (localhost) {
    return `http://${localhost}:5001`;
  }

  // 3. Fallback for all other cases
  return "http://127.0.0.1:5001";
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
  UPDATE_TOLL_FEE: (id: string) => `/api/drivers/bookings/${id}/toll`,
  CANCEL_BOOKING: (id: string) => `/api/drivers/bookings/${id}/cancel`,
  VERIFY_OTP: (id: string) => `/api/drivers/bookings/${id}/verify-otp`,
  COMPLETE_RIDE: (id: string) => `/api/drivers/bookings/${id}/complete`,
  GET_BOOKING_BY_ID: (id: string) => `/api/drivers/bookings/${id}/details`,
  BOOKING_STATUS: (id: string) => `/api/bookings/${id}/status`,
  START_WAITING: (id: string) => `/api/bookings/${id}/start-waiting`,
  VERIFY_PAYMENT: (id: string) => `/api/bookings/${id}/verify-payment`,
  UPDATE_PAYMENT_CHOICE: (id: string) => `/api/bookings/${id}/update-payment-choice`,
  REQUEST_PAYMENT: (id: string) => `/api/bookings/${id}/request-payment`,

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

  // Commission Payments
  CREATE_PAYMENT_ORDER: "/api/payments/create-order",
  VERIFY_PAYMENT_VERIFY: "/api/payments/verify-payment",
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
    vehicleType?: string; // "5seater" | "7seater"
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
  updateVehicle: (data: { vehicleModel?: string; vehicleNumber?: string; vehicleColor?: string; vehicleType?: string; serviceType?: string; pushToken?: string }) => // vehicleType: "5seater" | "7seater"
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
  getBookingsHistory: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    rideType?: string;
    bookingType?: string;
    scheduleView?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) => api.get(API_ENDPOINTS.BOOKINGS_HISTORY, { params }),
  getBookingById: (id: string) => api.get(API_ENDPOINTS.GET_BOOKING_BY_ID(id), { params: { compact: 1 } }),
  acceptBooking: (bookingId: string) =>
    api.post(API_ENDPOINTS.ACCEPT_BOOKING(bookingId)),
  rejectBooking: (bookingId: string) =>
    api.post(API_ENDPOINTS.REJECT_BOOKING(bookingId)),
  updateBookingStatus: (bookingId: string, status: string) =>
    api.put(API_ENDPOINTS.UPDATE_BOOKING_STATUS(bookingId), { status }),
  updateTollFee: (bookingId: string, tollFee: number) =>
    api.put(API_ENDPOINTS.UPDATE_TOLL_FEE(bookingId), { tollFee }),
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
  verifyPayment: (bookingId: string, data: { paymentMethod: string; isFirstLeg?: boolean }) =>
    api.put(API_ENDPOINTS.VERIFY_PAYMENT(bookingId), data),
  updatePaymentChoice: (bookingId: string, paymentChoice: 'leg_by_leg' | 'total_at_end') =>
    api.put(API_ENDPOINTS.UPDATE_PAYMENT_CHOICE(bookingId), { paymentChoice }),
  requestPayment: (bookingId: string, data: { amount: number; isPartial: boolean; breakdown: any }) =>
    api.post(API_ENDPOINTS.REQUEST_PAYMENT(bookingId), data),

  // Chat
  getChatHistory: (bookingId: string) => api.get(API_ENDPOINTS.GET_CHAT_HISTORY(bookingId)),
  sendChatMessage: (data: { bookingId: string; sender: string; message: string }) =>
    api.post(API_ENDPOINTS.SEND_CHAT_MESSAGE, data),

  // Earnings & Stats
  getEarnings: (
    period?: string,
    startDate?: string,
    endDate?: string,
    pagination?: {
      txPage?: number;
      txLimit?: number;
      commPage?: number;
      commLimit?: number;
    }
  ) => {
    const params: Record<string, string | number> = {};
    if (period) params.period = period;
    if (startDate) params.dateFrom = startDate;
    if (endDate) params.dateTo = endDate;
    if (pagination?.txPage) params.txPage = pagination.txPage;
    if (pagination?.txLimit) params.txLimit = pagination.txLimit;
    if (pagination?.commPage) params.commPage = pagination.commPage;
    if (pagination?.commLimit) params.commLimit = pagination.commLimit;

    return api.get(API_ENDPOINTS.GET_EARNINGS, { params });
  },
  getReviews: () => api.get(API_ENDPOINTS.REVIEWS),
  getDashboard: () => api.get(API_ENDPOINTS.DASHBOARD),

  // Payments
  createPaymentOrder: () => api.post(API_ENDPOINTS.CREATE_PAYMENT_ORDER),
  verifyPaymentVerify: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post(API_ENDPOINTS.VERIFY_PAYMENT_VERIFY, data),
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

// ================= FARE API =================
export const fareAPI = {
  /**
   * Calculate trip fare using the step-based pricing model.
   * @param distance - trip distance in KM (≥ 1)
   * @param carType  - "5seater" | "7seater"
   * @param service  - "cab" (max 40 KM) | "rental" (unlimited)
   * @param tripType - "one-way" | "round-trip" (default: "one-way")
   */
  calculateTripFare: (data: {
    distance: number;
    carType: "5seater" | "7seater";
    service: "cab" | "rental";
    tripType?: "one-way" | "round-trip";
  }) => api.post("/api/fare/trip", data),
};

export default api;
