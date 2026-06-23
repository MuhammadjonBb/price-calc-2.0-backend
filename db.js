require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

module.exports = supabase;
