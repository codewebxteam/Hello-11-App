import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  getAllDrivers,
  getAllBookings,
  deleteUser,
  deleteDriver,
  verifyDriver,
  updateBookingStatus,
  manualPaymentReset,
  getFinancialReports,
  adminLogin // <-- Naya import
} from "../controllers/adminController.js";
import { adminForceCancelBooking } from "../controllers/bookingController.js"; 
import { adminAuth } from "../middleware/adminAuth.js"; // <-- Middleware import

const router = express.Router();

// 1. OPEN ROUTE: Login ke liye auth ki zaroorat nahi hai
router.post("/login", adminLogin);

// 2. LOCK ALL OTHER ROUTES: Yahan se niche ke saare routes lock ho jayenge
router.use(adminAuth);

// Dashboard
router.get("/stats", getDashboardStats);

// Users management
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// Drivers management
router.get("/drivers", getAllDrivers);
router.delete("/drivers/:id", deleteDriver);
router.put("/drivers/:id/verify", verifyDriver);
router.put("/drivers/:id/reset-commission", manualPaymentReset);

// Bookings management
router.get("/bookings", getAllBookings);
router.put("/bookings/:id/status", updateBookingStatus);
router.post("/bookings/:id/cancel", adminForceCancelBooking);

// Financials
router.get("/financials", getFinancialReports);

export default router;