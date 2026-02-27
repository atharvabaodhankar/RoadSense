const axios = require("axios");
require("dotenv").config();

async function detectDefects(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString("base64");

    // Run both models in parallel
    const [potholeResponse, crackResponse] = await Promise.all([
      // Model 1: Pothole detection
      axios({
        method: "POST",
        url: process.env.ROBOFLOW_POTHOLE_URL,
        params: { 
          api_key: process.env.ROBOFLOW_API_KEY,
          confidence: 30,
          overlap: 25
        },
        data: base64Image,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }),
      // Model 2: Road cracks
      axios({
        method: "POST",
        url: process.env.ROBOFLOW_CRACK_URL,
        params: { 
          api_key: process.env.ROBOFLOW_API_KEY,
          confidence: 30,
          overlap: 25
        },
        data: base64Image,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      })
    ]);

    const potholes = potholeResponse.data.predictions || [];
    const cracks = crackResponse.data.predictions || [];

    // Combine all predictions
    const allPredictions = [...potholes, ...cracks];

    console.log(`Detected: ${potholes.length} potholes, ${cracks.length} cracks`);

    return allPredictions;
  } catch (error) {
    console.error("Roboflow detection error:", error.message);
    throw new Error("AI detection failed");
  }
}

module.exports = { detectDefects };
