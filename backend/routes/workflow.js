const express = require("express");
const router = express.Router();
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const supabase = require("../lib/supabase");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for after image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../temp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `after-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only images allowed"));
  }
});

// Admin: Update repair status
router.patch("/:id/status", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { repair_status, estimated_completion_date, admin_notes } = req.body;

    const updateData = {
      repair_status,
      approved_by: req.user.id,
      approved_at: new Date().toISOString()
    };

    if (estimated_completion_date) {
      updateData.estimated_completion_date = estimated_completion_date;
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from("inspections")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, inspection: data });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Admin: Upload after image and mark as completed
router.post("/:id/complete", authenticateUser, requireAdmin, upload.single("after_image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { completion_date, admin_notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "After image is required to complete inspection" });
    }

    // Upload to Supabase Storage
    const fileName = `after-${id}-${Date.now()}${path.extname(req.file.originalname)}`;
    const fileBuffer = fs.readFileSync(req.file.path);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("inspections")
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("inspections")
      .getPublicUrl(fileName);

    // Update inspection
    const updateData = {
      repair_status: "completed",
      after_image_url: publicUrl,
      approved_by: req.user.id,
      approved_at: new Date().toISOString(),
      completion_date: completion_date || new Date().toISOString().split('T')[0]
    };

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from("inspections")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, inspection: data });
  } catch (error) {
    console.error("Complete inspection error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to complete inspection" });
  }
});

// Inspector: Add feedback (only on completed inspections)
router.post("/:id/feedback", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_feedback, user_rating } = req.body;

    // Check if inspection is completed and belongs to user
    const { data: inspection, error: fetchError } = await supabase
      .from("inspections")
      .select("id, inspector_id, repair_status")
      .eq("id", id)
      .single();

    if (fetchError || !inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    if (inspection.inspector_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (inspection.repair_status !== "completed") {
      return res.status(400).json({ error: "Can only add feedback to completed inspections" });
    }

    const { data, error } = await supabase
      .from("inspections")
      .update({
        user_feedback,
        user_rating,
        feedback_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, inspection: data });
  } catch (error) {
    console.error("Add feedback error:", error);
    res.status(500).json({ error: "Failed to add feedback" });
  }
});

module.exports = router;
