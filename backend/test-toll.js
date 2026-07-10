import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const getGoogleApiKey = () => process.env.GOOGLE_MAPS_API_KEY;

const lat1 = 26.8467; // Lucknow
const lon1 = 80.9462;
const lat2 = 26.7606; // Gorakhpur
const lon2 = 83.3732;

const payload = {
  origin: { location: { latLng: { latitude: lat1, longitude: lon1 } } },
  destination: { location: { latLng: { latitude: lat2, longitude: lon2 } } },
  travelMode: "DRIVE",
  extraComputations: ["TOLLS"]
};

axios.post("https://routes.googleapis.com/directions/v2:computeRoutes", payload, {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": getGoogleApiKey(),
    "X-Goog-FieldMask": "routes.travelAdvisory.tollInfo.estimatedPrice"
  }
}).then(res => {
  console.log(JSON.stringify(res.data, null, 2));
}).catch(console.error);
