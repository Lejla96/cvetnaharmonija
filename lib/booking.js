const fs = require("node:fs/promises");
const path = require("node:path");
const nodemailer = require("nodemailer");
const { getBookingsTable, getSupabaseAdmin } = require("./supabase");

const ROOT = process.cwd();
const PERSISTENT_DATA_DIR = process.env.BOOKINGS_DATA_DIR
  ? path.resolve(ROOT, process.env.BOOKINGS_DATA_DIR)
  : path.join(ROOT, "data");
const TEMP_DATA_DIR = path.join("/tmp", "petshop-bookings");
const BOOKINGS_FILENAME = "bookings.ndjson";

function createReference() {
  return `BK-${Date.now().toString(36).toUpperCase()}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function readRawBody(request) {
  if (typeof request.body === "string") {
    return request.body;
  }

  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return JSON.stringify(request.body);
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body.toString("utf8");
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

function validateBooking(payload) {
  const requiredFields = [
    "name",
    "email",
    "phone",
    "petName",
    "petType",
    "service",
    "date",
    "time",
    "language",
  ];

  for (const field of requiredFields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      return `${field} is required`;
    }
  }

  return null;
}

async function writeBookingFile(targetDir, booking) {
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, BOOKINGS_FILENAME);
  await fs.appendFile(filePath, `${JSON.stringify(booking)}\n`, "utf8");
  return filePath;
}

async function persistBookingToSupabase(booking) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      persisted: false,
      durable: false,
      backend: null,
      reason: "supabase_not_configured",
    };
  }

  const { data, error } = await supabase
    .from(getBookingsTable())
    .insert({
      reference: booking.reference,
      customer_name: booking.name,
      email: booking.email,
      phone_number: booking.phone,
      pet_name: booking.petName,
      pet_type: booking.petType,
      service: booking.service,
      appointment_date: booking.date,
      appointment_time: booking.time,
      notes: booking.notes,
      language: booking.language,
      source: "website",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    persisted: true,
    durable: true,
    backend: "supabase",
    recordId: data.id,
  };
}

async function persistBookingToFiles(booking) {
  const errors = [];

  try {
    const filePath = await writeBookingFile(PERSISTENT_DATA_DIR, booking);
    return {
      persisted: true,
      durable: true,
      backend: "file",
      filePath,
    };
  } catch (error) {
    errors.push(error);
  }

  try {
    const filePath = await writeBookingFile(TEMP_DATA_DIR, booking);
    return {
      persisted: true,
      durable: false,
      backend: "tmp-file",
      filePath,
    };
  } catch (error) {
    errors.push(error);
  }

  return {
    persisted: false,
    durable: false,
    backend: null,
    errors: errors.map((error) => ({
      code: error.code || "UNKNOWN",
      message: error.message,
    })),
  };
}

async function persistBooking(booking) {
  try {
    const supabaseStatus = await persistBookingToSupabase(booking);
    if (supabaseStatus.persisted) {
      return supabaseStatus;
    }
  } catch (error) {
    console.error("Supabase booking storage failed:", error);
  }

  return persistBookingToFiles(booking);
}

async function sendBookingEmail(booking) {
  const transporter = createTransporter();
  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;

  if (!transporter || !recipient) {
    return { sent: false, skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const subject = `New PetShop booking ${booking.reference}`;
  const text = [
    `Reference: ${booking.reference}`,
    `Customer: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Pet Name: ${booking.petName}`,
    `Pet Type: ${booking.petType}`,
    `Service: ${booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    `Notes: ${booking.notes || "-"}`,
    `Language: ${booking.language}`,
    `Submitted At: ${booking.submittedAt}`,
  ].join("\n");

  const html = `
    <h1>New appointment request</h1>
    <p><strong>Reference:</strong> ${escapeHtml(booking.reference)}</p>
    <ul>
      <li><strong>Customer:</strong> ${escapeHtml(booking.name)}</li>
      <li><strong>Email:</strong> ${escapeHtml(booking.email)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(booking.phone)}</li>
      <li><strong>Pet name:</strong> ${escapeHtml(booking.petName)}</li>
      <li><strong>Pet type:</strong> ${escapeHtml(booking.petType)}</li>
      <li><strong>Service:</strong> ${escapeHtml(booking.service)}</li>
      <li><strong>Date:</strong> ${escapeHtml(booking.date)}</li>
      <li><strong>Time:</strong> ${escapeHtml(booking.time)}</li>
      <li><strong>Notes:</strong> ${escapeHtml(booking.notes || "-")}</li>
      <li><strong>Language:</strong> ${escapeHtml(booking.language)}</li>
      <li><strong>Submitted at:</strong> ${escapeHtml(booking.submittedAt)}</li>
    </ul>
  `;

  await transporter.sendMail({
    from,
    to: recipient,
    replyTo: booking.email,
    subject,
    text,
    html,
  });

  return { sent: true, skipped: false };
}

function normalizeBooking(payload) {
  return {
    reference: createReference(),
    name: String(payload.name).trim(),
    email: String(payload.email).trim(),
    phone: String(payload.phone).trim(),
    petName: String(payload.petName).trim(),
    petType: String(payload.petType).trim(),
    service: String(payload.service).trim(),
    date: String(payload.date).trim(),
    time: String(payload.time).trim(),
    notes: String(payload.notes || "").trim(),
    language: payload.language === "en" ? "en" : "mk",
    submittedAt: new Date().toISOString(),
  };
}

async function handleBookingRequest(request) {
  try {
    const rawBody = await readRawBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const validationError = validateBooking(payload);

    if (validationError) {
      return {
        statusCode: 400,
        payload: { success: false, error: validationError },
      };
    }

    const booking = normalizeBooking(payload);
    const storageStatus = await persistBooking(booking);

    let emailStatus = { sent: false, skipped: true };
    try {
      emailStatus = await sendBookingEmail(booking);
    } catch (error) {
      console.error("Email delivery failed:", error);
    }

    if (!storageStatus.persisted && !emailStatus.sent) {
      return {
        statusCode: 503,
        payload: {
          success: false,
          error:
            "Unable to safely store your booking request right now. Please try again after Supabase or email notifications are configured.",
        },
      };
    }

    return {
      statusCode: 200,
      payload: {
        success: true,
        booking: {
          reference: booking.reference,
          emailSent: emailStatus.sent,
          stored: storageStatus.persisted,
          durableStorage: storageStatus.durable,
          storageBackend: storageStatus.backend,
        },
      },
    };
  } catch (error) {
    console.error("Booking request failed:", error);
    return {
      statusCode: 500,
      payload: {
        success: false,
        error: "Unable to process booking request",
      },
    };
  }
}

module.exports = {
  handleBookingRequest,
};
