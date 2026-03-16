import Constants from 'expo-constants';

// Get API base URL based on environment
const getApiBaseUrl = (): string => {
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

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints - matching backend routes
export const API_ENDPOINTS = {
    // Auth
    SIGNUP: "/api/auth/signup",
    SIGNIN: "/api/auth/signin",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",

    // User
    PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/profile",
    CHANGE_PASSWORD: "/api/users/password",
    USER_HISTORY: "/api/users/history",

    // Bookings
    CREATE_BOOKING: "/api/bookings",
    GET_BOOKINGS: "/api/bookings",
    GET_BOOKING_BY_ID: (id: string) => `/api/bookings/${id}`,
    BOOKING_STATUS: (id: string) => `/api/bookings/${id}/status`,
    CANCEL_BOOKING: (id: string) => `/api/bookings/${id}/cancel`,
    START_RIDE: (id: string) => `/api/bookings/${id}/start`,
    COMPLETE_RIDE: (id: string) => `/api/bookings/${id}/complete`,
    ACCEPT_RETURN: (id: string) => `/api/bookings/${id}/accept-return`,
    VERIFY_PAYMENT: (id: string) => `/api/bookings/${id}/verify-payment`,

    // Chat
    GET_CHAT_HISTORY: (bookingId: string) => `/api/chat/${bookingId}`,

    // Drivers
    NEARBY_DRIVERS: "/api/drivers/nearby",
    GET_DRIVER: (id: string) => `/api/drivers/${id}`,
    UPDATE_DRIVER_LOCATION: "/api/drivers/location",
    TOGGLE_AVAILABILITY: "/api/drivers/availability",

    // Location
    GEOCODE: "/api/location/geocode",
    REVERSE_GEOCODE: "/api/location/reverse",
    DIRECTIONS: "/api/location/directions",
    AUTOCOMPLETE: "/api/location/autocomplete",
    LOCATION_STATUS: "/api/location/status",
    DISTANCE_RECOMMEND: "/api/location/distance",

    // Fare calculation
    CALCULATE_TRIP_FARE: "/api/fare/trip",

    // Notifications
    NOTIFICATIONS: "/api/notifications",
    MARK_NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: "/api/notifications/read-all",
    CLEAR_NOTIFICATIONS: "/api/notifications/clear",
};