const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createTestUser() {
  console.log("Creating test inspector account...\n");

  const { data, error } = await supabase.auth.signUp({
    email: "test.inspector@roadsense.com",
    password: "Test@1234"
  });

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  console.log("✅ Test user created successfully!");
  console.log("Email: test.inspector@roadsense.com");
  console.log("Password: Test@1234");
  console.log("\nUser ID:", data.user.id);
  console.log("\nNote: Check your email for verification link if email confirmation is enabled.");
}

createTestUser();
