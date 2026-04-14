const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { handleBookingRequest } = require("./lib/booking");
const { handlePetProfileRequest } = require("./lib/petProfiles");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

async function serveStatic(filePath, request, response) {
  try {
    const resolvedPath = path.join(ROOT, filePath);
    const extension = path.extname(resolvedPath);
    const contentType = MIME_TYPES[extension] || "application/octet-stream";
    const content = await fs.readFile(resolvedPath);
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": Buffer.byteLength(content),
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Server error");
  }
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "POST" && url.pathname === "/api/bookings") {
    const result = await handleBookingRequest(request);
    json(response, result.statusCode, result.payload);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/pet-profiles") {
    const result = await handlePetProfileRequest(request);
    json(response, result.statusCode, result.payload);
    return;
  }

  if (!["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    await serveStatic("index.html", request, response);
    return;
  }

  if (url.pathname === "/en" || url.pathname === "/en.html") {
    await serveStatic("en.html", request, response);
    return;
  }

  if (url.pathname === "/admin" || url.pathname === "/admin.html") {
    await serveStatic("admin.html", request, response);
    return;
  }

  const sanitizedPath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  await serveStatic(sanitizedPath.replace(/^[/\\]/, ""), request, response);
});

server.listen(PORT, () => {
  console.log(`PetShop server running on http://localhost:${PORT}`);
});
