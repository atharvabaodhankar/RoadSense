const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
require("dotenv").config();

async function testInspection() {
  try {
    console.log("🧪 Testing RoadSense Inspection API\n");

    // Check if test image exists
    const testImagePath = "../node-test/wow.png";
    if (!fs.existsSync(testImagePath)) {
      console.error("❌ Test image not found at:", testImagePath);
      return;
    }

    // First, we need to authenticate
    // For testing, we'll use the admin credentials
    console.log("1️⃣ Authenticating with Supabase...");
    
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "test.inspector@roadsense.com",
      password: "Test@1234"
    });

    if (authError) {
      console.error("❌ Auth failed:", authError.message);
      return;
    }

    console.log("✅ Authenticated as:", authData.user.email);
    const token = authData.session.access_token;

    // Prepare form data
    console.log("\n2️⃣ Preparing inspection data...");
    const form = new FormData();
    form.append("image", fs.createReadStream(testImagePath));
    form.append("lat", "18.5204"); // Pune coordinates
    form.append("lng", "73.8567");
    form.append("timestamp", new Date().toISOString());

    // Submit inspection
    console.log("3️⃣ Submitting inspection to API...");
    const response = await axios.post(
      "http://localhost:5001/api/inspect",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("\n✅ Inspection completed successfully!\n");
    console.log("📊 Results:");
    console.log("─────────────────────────────────────");
    console.log("ID:", response.data.inspection.id);
    console.log("Score:", response.data.inspection.score, "/100");
    console.log("Status:", response.data.inspection.status);
    console.log("Defects found:", response.data.inspection.defect_count);
    console.log("Location:", response.data.inspection.address);
    console.log("\n🖼️  Images:");
    console.log("Original:", response.data.inspection.original_image_url);
    console.log("Annotated:", response.data.inspection.annotated_image_url);
    console.log("\n🎯 Defect details:");
    response.data.inspection.defects.forEach((defect, i) => {
      console.log(`  ${i + 1}. ${defect.class} - ${(defect.confidence * 100).toFixed(1)}% confidence`);
    });

  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testInspection();
