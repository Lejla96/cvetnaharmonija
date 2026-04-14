const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedClient;
}

function getPetContactsTable() {
  return process.env.SUPABASE_PET_CONTACTS_TABLE || "pet_owner_contacts";
}

function getBookingsTable() {
  return process.env.SUPABASE_BOOKINGS_TABLE || "appointment_requests";
}

module.exports = {
  getSupabaseAdmin,
  getBookingsTable,
  getPetContactsTable,
};
