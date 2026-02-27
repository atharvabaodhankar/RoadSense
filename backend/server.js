const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const inspectRoute = require("./routes/inspect");
const inspectionsRoute = require("./routes/inspections");
const statsRoute = require("./routes/stats");
const heatmapRoute = require("./routes/heatmap");

app.use("/api/inspect", inspectRoute);
app.use("/api/inspections", inspectionsRoute);
app.use("/api/stats", statsRoute);
app.use("/api/heatmap", heatmapRoute);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "RoadSense API"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 RoadSense API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
