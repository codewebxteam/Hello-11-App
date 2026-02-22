import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true
    },
    vehicleModel: {
      type: String,
      required: true
    },
    vehicleColor: {
      type: String,
      default: ""
    },
    vehicleType: {
      type: String,
      enum: ["sedan", "suv", "mini", "prime", "auto", "bike"],
      default: "sedan"
    },
    serviceType: {
      type: String,
      enum: ["cab", "both"],
      default: "cab"
    },
    licenseNumber: {
      type: String,
      default: ""
    },
    rating: {
      type: Number,
      default: 0
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    available: {
      type: Boolean,
      default: true
    },
    online: {
      type: Boolean,
      default: false
    },
    onlineTime: {
      type: Number,
      default: 0 // In minutes
    },
    lastOnlineToggle: {
      type: Date,
      default: null
    },
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0] // [longitude, latitude]
      }
    },
    lastLocationUpdate: {
      type: Date,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    totalTrips: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    cancellationReason: {
      type: String,
      default: ""
    },
    documents: {
      license: { type: String, default: "" },
      insurance: { type: String, default: "" },
      registration: { type: String, default: "" }
    },
    profileImage: {
      type: String,
      default: ""
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    }
  },
  { timestamps: true }
);

driverSchema.index({ location: "2dsphere" });

export default mongoose.model("Driver", driverSchema);
