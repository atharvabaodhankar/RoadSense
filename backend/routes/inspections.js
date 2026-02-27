const express = require("express");
const router = express.Router();
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const supabase = require("../lib/supabase");

// Get all inspections (paginated)
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("inspections")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Inspectors see only their own
    if (req.user.role !== "admin") {
      query = query.eq("inspector_id", req.user.id);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      inspections: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error("Get inspections error:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// Get single inspection
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from("inspections")
      .select("*")
      .eq("id", id)
      .single();

    // Inspectors can only see their own
    if (req.user.role !== "admin") {
      query = query.eq("inspector_id", req.user.id);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Inspection not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error("Get inspection error:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
});

// Delete inspection (admin only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("inspections")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Inspection deleted" });
  } catch (error) {
    console.error("Delete inspection error:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
});

module.exports = router;
