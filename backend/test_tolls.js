import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const testTolls = async () => {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.log("No API key found in .env");
      return;
    }
    
    // Delhi (28.6139, 77.2090) to Agra (27.1767, 78.0081)
    const payload = {
      origin: { location: { latLng: { latitude: 28.6139, longitude: 77.2090 } } },
      destination: { location: { latLng: { latitude: 27.1767, longitude: 78.0081 } } },
      travelMode: "DRIVE",
      extraComputations: ["TOLLS"]
    };

    const response = await axios.post("https://routes.googleapis.com/directions/v2:computeRoutes", payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "routes.travelAdvisory.tollInfo.estimatedPrice"
      }
    });

    console.log("API Success:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("API Error:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
};

testTolls();
