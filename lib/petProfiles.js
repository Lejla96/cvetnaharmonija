const { getPetContactsTable, getSupabaseAdmin } = require("./supabase");

function readRawBody(request) {
  if (typeof request.body === "string") {
    return Promise.resolve(request.body);
  }

  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return Promise.resolve(JSON.stringify(request.body));
  }

  if (Buffer.isBuffer(request.body)) {
    return Promise.resolve(request.body.toString("utf8"));
  }

  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function validatePetProfile(payload) {
  const requiredFields = ["ownerName", "phone", "email", "petName", "language"];

  for (const field of requiredFields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      return `${field} is required`;
    }
  }

  return null;
}

function normalizePetProfile(payload) {
  return {
    ownerName: String(payload.ownerName).trim(),
    phone: String(payload.phone).trim(),
    email: String(payload.email).trim(),
    petName: String(payload.petName).trim(),
    language: payload.language === "en" ? "en" : "mk",
    source: String(payload.source || "website").trim(),
  };
}

async function insertPetProfile(profile) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      ok: false,
      configurationError: true,
      error:
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const { data, error } = await supabase
    .from(getPetContactsTable())
    .insert({
      owner_name: profile.ownerName,
      phone_number: profile.phone,
      email: profile.email,
      pet_name: profile.petName,
      language: profile.language,
      source: profile.source,
    })
    .select("id, created_at, pet_name")
    .single();

  if (error) {
    throw error;
  }

  return {
    ok: true,
    data,
  };
}

async function handlePetProfileRequest(request) {
  try {
    const rawBody = await readRawBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const validationError = validatePetProfile(payload);

    if (validationError) {
      return {
        statusCode: 400,
        payload: { success: false, error: validationError },
      };
    }

    const profile = normalizePetProfile(payload);
    const insertResult = await insertPetProfile(profile);

    if (!insertResult.ok && insertResult.configurationError) {
      return {
        statusCode: 503,
        payload: {
          success: false,
          error: insertResult.error,
        },
      };
    }

    return {
      statusCode: 200,
      payload: {
        success: true,
        profile: {
          id: insertResult.data.id,
          petName: insertResult.data.pet_name,
          createdAt: insertResult.data.created_at,
        },
      },
    };
  } catch (error) {
    console.error("Pet profile request failed:", error);
    return {
      statusCode: 500,
      payload: {
        success: false,
        error: "Unable to save pet profile right now",
      },
    };
  }
}

module.exports = {
  handlePetProfileRequest,
};
