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

// Delete inspection (own inspections or admin)
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Delete request:', {
      inspectionId: id,
      userId: req.user.id,
      userRole: req.user.role
    });

    // First check if inspection exists and user has permission
    let query = supabase
      .from("inspections")
      .select("id, inspector_id")
      .eq("id", id)
      .single();

    const { data: inspection, error: fetchError } = await query;

    console.log('Inspection data:', inspection);
    console.log('Fetch error:', fetchError);

    if (fetchError || !inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    // Check permission: admin can delete any, users can delete their own
    const isOwner = inspection.inspector_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    
    console.log('Permission check:', {
      isOwner,
      isAdmin,
      inspectorId: inspection.inspector_id,
      userId: req.user.id
    });

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Not authorized to delete this inspection" });
    }

    // Delete the inspection
    const { error } = await supabase
      .from("inspections")
      .delete()
      .eq("id", id);

    if (error) throw error;

    console.log('Inspection deleted successfully');
    res.json({ success: true, message: "Inspection deleted" });
  } catch (error) {
    console.error("Delete inspection error:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
});

module.exports = router;
