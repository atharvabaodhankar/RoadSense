const express = require("express");
const router = express.Router();
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const supabase = require("../lib/supabase");

router.get("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    // Total inspections
    const { count: totalInspections } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true });

    // Critical zones
    const { count: criticalCount } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true })
      .eq("status", "Critical");

    // Average score
    const { data: scoreData } = await supabase
      .from("inspections")
      .select("score");

    const avgScore = scoreData && scoreData.length > 0
      ? Math.round(scoreData.reduce((sum, item) => sum + item.score, 0) / scoreData.length)
      : 0;

    // Total defects
    const { data: defectData } = await supabase
      .from("inspections")
      .select("defect_count");

    const totalDefects = defectData
      ? defectData.reduce((sum, item) => sum + (item.defect_count || 0), 0)
      : 0;

    // Status breakdown
    const { data: statusData } = await supabase
      .from("inspections")
      .select("status");

    const statusBreakdown = {
      Good: 0,
      Moderate: 0,
      Critical: 0
    };

    if (statusData) {
      statusData.forEach(item => {
        if (statusBreakdown.hasOwnProperty(item.status)) {
          statusBreakdown[item.status]++;
        }
      });
    }

    // Recent inspections
    const { data: recentInspections } = await supabase
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    res.json({
      totalInspections: totalInspections || 0,
      criticalZones: criticalCount || 0,
      avgScore,
      totalDefects,
      statusBreakdown,
      recentInspections: recentInspections || []
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
