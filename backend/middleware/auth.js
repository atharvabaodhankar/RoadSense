const supabase = require("../lib/supabase");

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    
    // Add timeout and retry logic
    let retries = 2;
    let user = null;
    let lastError = null;

    while (retries > 0 && !user) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        user = data.user;
        break;
      } catch (err) {
        lastError = err;
        retries--;
        if (retries > 0) {
          console.log(`Auth retry... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!user) {
      console.error("Auth failed after retries:", lastError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Fetch user profile with role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || "inspector"
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { authenticateUser, requireAdmin };
