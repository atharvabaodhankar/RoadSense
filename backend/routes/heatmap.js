const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth");
const supabase = require("../lib/supabase");

router.get("/", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("inspections")
      .select("id, lat, lng, score, status, address, created_at");

    if (error) throw error;

    // Format for heatmap
    const heatmapData = data.map(item => ({
      id: item.id,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lng),
      score: item.score,
      status: item.status,
      weight: 100 - item.score, // Lower score = higher weight = more red
      address: item.address,
      created_at: item.created_at
    }));

    res.json(heatmapData);
  } catch (error) {
    console.error("Heatmap error:", error);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

module.exports = router;
