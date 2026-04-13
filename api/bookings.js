const { handleBookingRequest } = require("../lib/booking");

module.exports = async function bookings(request, response) {
  if (request.method !== "POST") {
    response
      .status(405)
      .setHeader("Content-Type", "application/json; charset=utf-8")
      .json({ success: false, error: "Method not allowed" });
    return;
  }

  const result = await handleBookingRequest(request);
  response
    .status(result.statusCode)
    .setHeader("Content-Type", "application/json; charset=utf-8")
    .json(result.payload);
};
