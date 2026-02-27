const axios = require("axios");
require("dotenv").config();

async function reverseGeocode(lat, lng) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === "your_key_here") {
      return `${lat}, ${lng}`;
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return `${lat}, ${lng}`;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return `${lat}, ${lng}`;
  }
}

module.exports = { reverseGeocode };
