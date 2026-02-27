const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { authenticateUser } = require("../middleware/auth");
const { detectDefects } = require("../services/roboflow");
const { drawBoundingBoxes } = require("../services/annotate");
const { uploadToStorage } = require("../services/storage");
const { calculateScore } = require("../services/scorer");
const { reverseGeocode } = require("../services/geocoder");
const supabase = require("../lib/supabase");

router.post("/", authenticateUser, upload.single("image"), async (req, res) => {
  try {
    const { lat, lng, timestamp } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imageBuffer = req.file.buffer;

    console.log(`Processing inspection at ${lat}, ${lng}`);

    // 1. Detect defects using Roboflow
    const predictions = await detectDefects(imageBuffer);

    // 2. Draw bounding boxes
    const annotatedBuffer = await drawBoundingBoxes(imageBuffer, predictions);

    // 3. Generate unique filename
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;

    // 4. Upload both images to Supabase Storage
    const [originalUrl, annotatedUrl] = await Promise.all([
      uploadToStorage("road-originals", fileName, imageBuffer),
      uploadToStorage("road-annotated", fileName, annotatedBuffer)
    ]);

    // 5. Calculate quality score
    const { score, status } = calculateScore(predictions);

    // 6. Reverse geocode
    const address = await reverseGeocode(lat, lng);

    // 7. Save to database
    const { data, error } = await supabase
      .from("inspections")
      .insert({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address,
        timestamp: timestamp || new Date().toISOString(),
        score,
        status,
        defect_count: predictions.length,
        defects: predictions,
        original_image_url: originalUrl,
        annotated_image_url: annotatedUrl,
        inspector_id: req.user.id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`Inspection saved: ID ${data.id}, Score ${score}, Status ${status}`);

    res.json({
      success: true,
      inspection: data
    });

  } catch (error) {
    console.error("Inspection error:", error);
    res.status(500).json({ 
      error: "Failed to process inspection",
      details: error.message 
    });
  }
});

module.exports = router;
