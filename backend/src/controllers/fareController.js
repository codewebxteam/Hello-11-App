// Cab fare rates (per km)
const CAB_RATES = {
  Mini: 12,    // ₹12/km
  Sedan: 15,   // ₹15/km
  SUV: 20,     // ₹20/km
  Prime: 18,   // ₹18/km
  Auto: 10,    // ₹10/km
  Bike: 7,     // ₹7/km
};

// Outstation fare rates (Premium per km)
const OUTSTATION_RATES = {
  mini: 18,
  hatchback: 18,
  sedan: 25,
  suv: 35,
  prime: 28,
  default: 20,
};

// Get cab fare rates
export const getCabRates = (req, res) => {
  res.json({
    success: true,
    data: {
      cabTypes: [
        { type: "Mini", ratePerKm: CAB_RATES.Mini, currency: "INR", description: "Affordable hatchback" },
        { type: "Sedan", ratePerKm: CAB_RATES.Sedan, currency: "INR", description: "Comfortable sedan" },
        { type: "SUV", ratePerKm: CAB_RATES.SUV, currency: "INR", description: "Spacious SUV" },
        { type: "Prime", ratePerKm: CAB_RATES.Prime, currency: "INR", description: "Premium Sedan" },
        { type: "Auto", ratePerKm: CAB_RATES.Auto, currency: "INR", description: "Reliable 3-wheeler" },
        { type: "Bike", ratePerKm: CAB_RATES.Bike, currency: "INR", description: "Swift 2-wheeler" },
      ],
      baseFare: 0,
      perKmRates: CAB_RATES,
    },
  });
};

// Get outstation fare rates
export const getOutstationRates = (req, res) => {
  res.json({
    success: true,
    data: {
      vehicleTypes: [
        { type: "mini", title: "Mini / Hatchback", ratePerKm: OUTSTATION_RATES.mini, icon: "car-sport-outline", desc: "Comfy, economical cars", capacity: "4" },
        { type: "sedan", title: "Sedan", ratePerKm: OUTSTATION_RATES.sedan, icon: "car-outline", desc: "Spacious sedans for comfort", capacity: "4" },
        { type: "prime", title: "Prime Sedan", ratePerKm: OUTSTATION_RATES.prime, icon: "shield-checkmark-outline", desc: "Top-rated drivers & cars", capacity: "4" },
        { type: "suv", title: "SUV / Ertiga", ratePerKm: OUTSTATION_RATES.suv, icon: "bus-outline", desc: "Perfect for families & luggage", capacity: "6" },
      ],
      defaultRate: OUTSTATION_RATES.default,
      currency: "INR",
    },
  });
};

// Calculate fare estimate
export const calculateFareEstimate = (req, res) => {
  try {
    const { distanceKm, hours, cabType, bookingType } = req.body;

    // Default values
    const distance = parseFloat(distanceKm) || 0;
    const bookingTypeValue = bookingType || "cab";
    const cabTypeValue = cabType || "Mini";

    if (bookingTypeValue === "cab") {
      // Cab booking calculation
      if (!distance || distance <= 0) {
        return res.status(400).json({ error: "Valid distance in km is required for cab booking" });
      }

      const ratePerKm = CAB_RATES[cabTypeValue];
      if (!ratePerKm) {
        return res.status(400).json({ error: "Invalid cab type. Choose: Mini, Sedan, or SUV" });
      }

      const estimatedFare = distance * ratePerKm;

      res.json({
        success: true,
        data: {
          bookingType: "cab",
          cabType: cabTypeValue,
          distanceKm: distance,
          ratePerKm: ratePerKm,
          estimatedFare: Math.round(estimatedFare),
          currency: "INR",
          breakdown: {
            baseFare: 0,
            distanceCharge: `${distance} km × ₹${ratePerKm}/km`,
            total: `₹${Math.round(estimatedFare)}`,
          },
        },
      });
    } else if (bookingTypeValue === "outstation") {
      // Outstation booking calculation
      if (!distance || distance <= 0) {
        return res.status(400).json({ error: "Valid distance in km is required for outstation booking" });
      }

      const ratePerKm = OUTSTATION_RATES[cabTypeValue.toLowerCase()] || OUTSTATION_RATES.default;
      const estimatedFare = distance * ratePerKm;

      res.json({
        success: true,
        data: {
          bookingType: "outstation",
          cabType: cabTypeValue,
          distanceKm: distance,
          ratePerKm: ratePerKm,
          estimatedFare: Math.round(estimatedFare),
          currency: "INR",
          breakdown: {
            baseFare: 0,
            distanceCharge: `${distance} km × ₹${ratePerKm}/km`,
            total: `₹${Math.round(estimatedFare)}`,
          },
        },
      });
    } else {
      return res.status(400).json({ error: "Invalid booking type. Choose: cab or outstation" });
    }
  } catch (error) {
    console.error("Fare estimation error:", error.message);
    res.status(500).json({ error: "Failed to calculate fare estimate" });
  }
};
