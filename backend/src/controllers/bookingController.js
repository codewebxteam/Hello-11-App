import Booking from "../models/Booking.js";
import Driver from "../models/Driver.js";
import { getIO } from "../utils/socketLogic.js";
import { serverLog } from "../utils/logger.js";
import { createNotification } from "./notificationController.js";

// ================= CREATE BOOKING =================
export const createBooking = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, rideType, bookingType, scheduledDate } = req.body;

    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({
        message: "Pickup and drop locations are required"
      });
    }

    // Prevent multiple active bookings
    // Prevent multiple active bookings
    const activeBooking = await Booking.findOne({
      user: req.userId,
      status: { $in: ["pending", "accepted", "driver_assigned", "arrived", "started"] }
    });

    if (activeBooking) {
      const isStale = (new Date() - new Date(activeBooking.createdAt)) > 30 * 60 * 1000; // 30 minutes

      if (activeBooking.status === 'pending' || (activeBooking.status === 'accepted' && isStale)) {
        // Auto-cancel stale pending or old accepted request
        activeBooking.status = 'cancelled';
        activeBooking.cancellationReason = 'Auto-cancelled for new search (Stale)';
        await activeBooking.save();
        serverLog(`[Auto-Cancel] Booking ${activeBooking._id} (${activeBooking.status}) cancelled for new request by user ${req.userId}`);
      } else {
        // Allow blocking ONLY if a driver is actively moving/trip started or recent accepted
        return res.status(400).json({
          message: `You already have an active ride (${activeBooking.status}). Please cancel it to book a new one.`,
          bookingId: activeBooking._id
        });
      }
    }

    const booking = await Booking.create({
      user: req.userId,
      pickupLocation,
      dropLocation,
      pickupLatitude: req.body.pickupLatitude || 0,
      pickupLongitude: req.body.pickupLongitude || 0,
      dropLatitude: req.body.dropLatitude || 0,
      dropLongitude: req.body.dropLongitude || 0,
      rideType: rideType || "normal",
      vehicleType: req.body.vehicleType || "mini",
      bookingType: bookingType || "now",
      scheduledDate: bookingType === "schedule" ? scheduledDate : null,
      // Scheduled rides start as 'scheduled'; ride-now rides start as 'pending'
      status: bookingType === "schedule" ? "scheduled" : "pending",
      baseFare: req.body.baseFare || req.body.fare || 0,
      distance: req.body.distance || 0,
      duration: req.body.duration || 0,
      fare: req.body.fare || 0,
      totalFare: req.body.fare || 0, // Initial total is just the fare
    });


    // BROADCAST to nearby drivers — only for 'ride now' bookings
    // Scheduled bookings skip the broadcast (drivers notified at ride time)
    if (bookingType !== "schedule") {
      const io = getIO();
      try {
        serverLog(`BROADCAST: Searching for drivers | Vehicle: ${booking.vehicleType} | Location: [${booking.pickupLongitude}, ${booking.pickupLatitude}]`);

        // DYNAMIC SERVICE TYPE MATCHING
        let serviceTypes = ["cab", "both"];
        if (booking.rideType === 'outstation') {
          // Outstation can be fulfilled by typical cabs OR existing rental-capable drivers
          serviceTypes = ["cab", "rental", "both"];
        }

        const nearbyDrivers = await Driver.find({
          available: true,
          online: true,
          vehicleType: booking.vehicleType, // Strict match (e.g. 'sedan')
          serviceType: { $in: serviceTypes },
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [booking.pickupLongitude, booking.pickupLatitude]
              },
              $maxDistance: 50000 // 50KM
            }
          }
        });

        serverLog(`BROADCAST: Req Vehicle: '${booking.vehicleType}' | Service: cab/both`);
        if (nearbyDrivers.length === 0) {
          const allDrivers = await Driver.find({ online: true, available: true });
          serverLog(`DEBUG: Total Online: ${allDrivers.length}. Dump: ${allDrivers.map(d => `${d.name}:${d.vehicleType}:${d.serviceType}`).join(', ')}`);
        }

        serverLog(`BROADCAST: Found ${nearbyDrivers.length} matching drivers (Online, Available, and type: ${booking.vehicleType})`);

        if (nearbyDrivers.length === 0) {
          // Check for ALL online/available drivers just to log why they didn't match
          const totalOnline = await Driver.countDocuments({ online: true, available: true });
          const onlineSameType = await Driver.countDocuments({ online: true, available: true, vehicleType: booking.vehicleType });
          serverLog(`DEBUG: Total Online/Available: ${totalOnline} | Matching Type (${booking.vehicleType}): ${onlineSameType} | Result: 0 (Likely too far)`);
        }

        nearbyDrivers.forEach(driver => {
          serverLog(`BROADCAST: Emitting 'newRideRequest' to room ${driver._id.toString()}`);
          io.to(driver._id.toString()).emit("newRideRequest", {
            bookingId: booking._id,
            pickup: pickupLocation,
            drop: dropLocation,
            fare: booking.fare,
            distance: booking.distance,
            rideType: booking.rideType,
            vehicleType: booking.vehicleType,
            bookingType: booking.bookingType
          });
        });

        if (nearbyDrivers.length === 0) {
          serverLog("BROADCAST: NO DRIVERS MATCHED CRITERIA");
        }
      } catch (err) {
        serverLog(`BROADCAST ERROR: ${err.message}`);
      }
    } else {
      serverLog(`SCHEDULED: Booking ${booking._id} created with scheduled date ${booking.scheduledDate}. Driver broadcast skipped.`);
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        id: booking._id,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        rideType: booking.rideType,
        bookingType: booking.bookingType,
        status: booking.status,
        otp: booking.otp,
        fare: booking.fare,
        discount: booking.discount,
        vehicleType: booking.vehicleType,
        scheduledDate: booking.scheduledDate
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message
    });
  }
};

// ================= GET USER BOOKINGS =================
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      bookings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
};

// ================= GET SCHEDULED BOOKINGS =================
export const getScheduledBookings = async (req, res) => {
  try {
    console.log('[getScheduledBookings] userId:', req.userId);
    const bookings = await Booking.find({
      user: req.userId,
      status: "scheduled"
      // No date filter — show all scheduled regardless of time
    }).sort({ scheduledDate: 1 });

    console.log('[getScheduledBookings] found:', bookings.length);
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('[getScheduledBookings] error:', error.message);
    res.status(500).json({
      message: "Failed to fetch scheduled bookings",
      error: error.message
    });
  }
};

// ================= GET SCHEDULED RIDE HISTORY =================
export const getScheduledHistory = async (req, res) => {
  try {
    // Rides that were originally scheduled but have now moved past 'scheduled' status
    const bookings = await Booking.find({
      user: req.userId,
      bookingType: "schedule",
      status: { $nin: ["scheduled"] }   // everything except still-pending scheduled
    })
      .sort({ scheduledDate: -1 })      // Most recent first
      .limit(50);

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch scheduled ride history",
      error: error.message
    });
  }
};

// ================= GET BOOKING BY ID =================
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name mobile profileImage")
      .populate("driver", "name mobile vehicleModel vehicleNumber rating vehicleType profileImage latitude longitude location");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Check authorization: must be either the user or the driver
    const authId = req.userId || req.driverId;
    const isUser = booking.user._id.toString() === authId;
    const isDriver = booking.driver && booking.driver._id.toString() === authId;

    if (!isUser && !isDriver) {
      return res.status(403).json({
        message: "Not authorized to view this booking"
      });
    }

    res.json({
      booking
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch booking",
      error: error.message
    });
  }
};

// ================= CANCEL BOOKING =================
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({
        message: "Not authorized to cancel this booking"
      });
    }

    if (booking.status === "cancelled") {
      return res.json({
        message: "Booking is already cancelled",
        booking
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Cannot cancel a completed booking"
      });
    }

    const previousStatus = booking.status;
    booking.status = "cancelled";
    booking.cancelledBy = "user";
    await booking.save();

    // Notify both user and driver
    try {
      const { getIO } = await import("../utils/socketLogic.js");
      const io = getIO();

      // Notify User (to sync across devices/sessions)
      io.to(booking.user.toString()).emit("bookingCancelledByUser", {
        bookingId: booking._id.toString(),
        message: "Booking cancelled successfully"
      });

      // Notify Driver (if assigned)
      if (booking.driver) {
        await Driver.findByIdAndUpdate(booking.driver, {
          available: true,
          currentBooking: null
        });
        io.to(booking.driver.toString()).emit("bookingCancelledByUser", {
          bookingId: booking._id.toString(),
          message: "The user has cancelled this ride."
        });
      } else {
        // If NO driver was assigned, it means the ride was still in "Searching" or "Scheduled" state
        // and was broadcast to multiple drivers. We must tell them all to HIDE the request.
        io.emit("rideRequestCancelled", {
          bookingId: booking._id.toString()
        });
      }

      // Create persistent notification for user (confirmation of their cancellation)
      await createNotification({
        userId: booking.user,
        title: "Ride Cancelled ❌",
        body: "You have successfully cancelled your ride booking.",
        type: "ride_cancelled",
        bookingId: booking._id
      });
    } catch (socketError) {
      serverLog(`Socket notification error: ${socketError.message}`);
    }

    res.json({
      message: "Booking cancelled successfully",
      booking
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message
    });
  }
};

// ================= GET BOOKING STATUS =================
export const getBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name mobile profileImage")
      .populate("driver", "name vehicleModel vehicleNumber rating profileImage mobile latitude longitude");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Dynamic penalty calculation if waiting started
    console.log(`[Status Request] ID: ${req.params.id} | Status: ${booking.status} | WaitingStartedAt: ${booking.waitingStartedAt}`);
    if (booking.waitingStartedAt) {
      await calculateAndUpdatePenalty(booking);
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking status", error: error.message });
  }
};

// Helper for dynamic penalty calculation
export const calculateAndUpdatePenalty = async (booking) => {
  if (!booking.waitingStartedAt) return;

  const now = new Date();
  const elapsedSeconds = Math.floor((now - booking.waitingStartedAt) / 1000);
  const limit = booking.waitingLimit || 3600;
  const extraTimeSeconds = elapsedSeconds - limit;

  console.log(`[Penalty Debug] Booking: ${booking._id}, Elapsed: ${elapsedSeconds}s, Limit: ${limit}s, Extra: ${extraTimeSeconds}s`);

  // Explicit guard: only apply if we have actually EXCEEDED the limit
  if (extraTimeSeconds > 0) {
    // Current rule: If you exceed even by 1 second, it charges for the first hour (₹100)
    // Subsequent hours are added every 3600 seconds thereafter.
    const extraHours = Math.floor(extraTimeSeconds / 3600) + 1;
    const currentPenalty = extraHours * 100; // ₹100 per hour

    console.log(`[Penalty Debug] Current Penalty: ₹${currentPenalty}, Existing: ₹${booking.penaltyApplied || 0}`);

    if (currentPenalty > (booking.penaltyApplied || 0)) {
      const penaltyIncrement = currentPenalty - (booking.penaltyApplied || 0);
      // KEY FIX: Only update penaltyApplied, do NOT mutate booking.fare
      // booking.fare stays as the original base trip price
      booking.penaltyApplied = currentPenalty;
      booking.lastPenaltyAppliedAt = now;

      // Update totalFare dynamically
      const totalFare = (booking.fare || 0) + (booking.returnTripFare || 0) + currentPenalty;
      booking.totalFare = totalFare;

      await booking.save();
      console.log(`[Penalty Debug] APPLIED ₹${penaltyIncrement}. Total (base+return+penalty): ₹${totalFare}`);

      try {
        const io = getIO();
        const rooms = [booking.user.toString()];
        if (booking.driver) rooms.push(booking.driver.toString());

        rooms.forEach(room => {
          io.to(room).emit("penaltyApplied", {
            bookingId: booking._id,
            penaltyApplied: booking.penaltyApplied,
            totalFare: totalFare,
            message: `Wait penalty of ₹${penaltyIncrement} applied.`
          });
        });

        await createNotification({
          userId: booking.user,
          title: "Wait Penalty Applied ⚠️",
          body: `₹${penaltyIncrement} has been added to your fare due to extended waiting time.`,
          type: "ride_nearby",
          bookingId: booking._id
        });
      } catch (err) {
        serverLog(`Error emitting penalty socket: ${err.message}`);
      }
    }
  }
};

// ================= START RIDE (OTP VERIFICATION) =================
export const startRide = async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (booking.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    booking.status = "started";
    await booking.save();

    res.json({
      message: "Ride started successfully",
      booking: {
        id: booking._id,
        status: booking.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to start ride",
      error: error.message
    });
  }
};

// ================= COMPLETE RIDE =================
export const completeRide = async (req, res) => {
  try {
    const { fare, distance } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    booking.status = "completed";
    // Important: Keep original booking.fare if it exists
    if (!booking.fare || booking.fare === 0) {
      booking.fare = fare || 0;
    }
    booking.distance = distance || booking.distance || 0;
    booking.paymentStatus = "pending";
    booking.rideCompletedAt = new Date();

    // Final totalFare calculation: Use incoming fare as total if it exists
    booking.totalFare = fare || ((booking.fare || 0) + (booking.returnTripFare || 0) + (booking.penaltyApplied || 0));

    await booking.save();

    // Notify User
    getIO().to(booking.user.toString()).emit("rideCompleted", {
      bookingId: booking._id,
      status: "completed",
      finalFare: booking.fare
    });

    // Clear driver status
    if (booking.driver) {
      await Driver.findByIdAndUpdate(booking.driver, {
        available: true,
        online: true // Ensure they stay online for next ride
      });
    }

    res.json({
      success: true,
      message: "Ride completed successfully",
      fare: booking.fare,
      distance: booking.distance
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete ride",
      error: error.message
    });
  }
};

// ================= VERIFY PAYMENT =================
export const verifyPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    booking.paymentStatus = "paid";
    booking.paymentMethod = paymentMethod || "cash";
    await booking.save();

    res.json({
      message: "Payment verified successfully",
      booking: {
        id: booking._id,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message
    });
  }
};

// ================= ACCEPT RETURN OFFER =================
export const acceptReturnOffer = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Security: Only the user who made the booking can accept the offer
    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to accept this offer" });
    }

    if (booking.hasReturnTrip) {
      return res.json({
        message: "Return trip offer already accepted",
        returnTripFare: booking.returnTripFare
      });
    }

    // Logic: 60% OFF on return trip
    const returnFare = Math.round(booking.fare * 0.4);

    booking.hasReturnTrip = true;
    booking.returnTripFare = returnFare;
    booking.discount = 60; // 60% off

    // Update totalFare
    booking.totalFare = (booking.fare || 0) + returnFare + (booking.penaltyApplied || 0);

    await booking.save();

    const io = getIO();
    io.to(booking.user.toString()).emit("returnTripAccepted", {
      bookingId: booking._id,
      returnTripFare: returnFare
    });
    if (booking.driver) {
      io.to(booking.driver.toString()).emit("returnTripAccepted", {
        bookingId: booking._id,
        returnTripFare: returnFare
      });

      // Create persistent notification for driver
      await createNotification({
        userId: booking.driver,
        title: "Return Trip Confirmed! 📉",
        body: `The user has accepted the return trip offer for ₹${returnFare}.`,
        type: "ride_accepted",
        bookingId: booking._id
      });
    }

    // Create persistent notification for user
    await createNotification({
      userId: booking.user,
      title: "Return Trip Offer Accepted! 🎉",
      body: `Your return trip at 60% OFF (₹${returnFare}) has been confirmed.`,
      type: "ride_accepted",
      bookingId: booking._id
    });

    res.json({
      message: "Return trip offer accepted",
      returnTripFare: returnFare
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept return offer", error: error.message });
  }
};

// ================= START WAITING =================
export const startWaiting = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Security: Only the assigned driver can start the waiting timer
    const driverId = req.driverId || req.userId; // Middleware might set either depending on context

    if (!booking.driver || booking.driver.toString() !== driverId.toString()) {
      return res.status(403).json({ message: "Not authorized to start waiting" });
    }

    // Validation
    if (booking.status !== "started") {
      return res.status(400).json({ message: "Ride must be in progress to start waiting" });
    }

    if (!booking.hasReturnTrip) {
      return res.status(400).json({ message: "No return trip offer active for this booking" });
    }

    booking.status = "waiting";
    booking.isWaiting = true;
    booking.waitingStartedAt = new Date();

    // For testing: 30 seconds free wait time
    booking.waitingLimit = 30;

    await booking.save();

    const io = getIO();
    const userRoom = booking.user.toString();

    io.to(userRoom).emit("rideStatusUpdate", {
      bookingId: booking._id.toString(),
      status: "waiting",
      message: "Driver has reached destination and is now waiting for your return."
    });

    io.to(userRoom).emit("waitingStarted", {
      bookingId: booking._id,
      waitingStartedAt: booking.waitingStartedAt,
      waitingLimit: booking.waitingLimit
    });

    res.json({
      message: "Waiting timer started",
      waitingStartedAt: booking.waitingStartedAt,
      waitingLimit: booking.waitingLimit
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to start waiting", error: error.message });
  }
};
