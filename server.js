const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const rootPath = path.resolve(rootDir);
const dataDir = path.join(rootDir, "data");
const productsFile = path.join(dataDir, "products.json");
const uploadDir = path.join(rootDir, "assets", "vendor-products");
const sessions = new Map();

const vendorUser = process.env.VENDOR_USER || "pratik";
const vendorPass = process.env.VENDOR_PASSWORD || "pratik@123";

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(productsFile, "utf8"));
  } catch {
    return []; // ✅ File nahi hai toh empty array return karo
  }
}

function writeProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function parseCookies(request) {
  const cookies = {};
  const cookieHeader = request.headers.cookie || "";
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...value] = cookie.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(value.join("="));
  });
  return cookies;
}

function createSession(role, name) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { role, name, createdAt: Date.now() });
  return token;
}

function getSession(request) {
  const token = parseCookies(request).pe_session;
  return token ? sessions.get(token) : null;
}

function requireRole(request, response, role) {
  const session = getSession(request);
  if (!session || session.role !== role) {
    sendJson(response, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
}

function setSessionCookie(response, token) {
  response.setHeader("Set-Cookie", `pe_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/`);
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", "pe_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || `product-${Date.now()}`;
}

function saveImage(imageData, originalName) {
  if (!imageData || !imageData.startsWith("data:image/")) return "";
  const match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return "";

  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const fileName = `${Date.now()}-${slugify(originalName || "product")}.${extension}`;
  fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(match[2], "base64"));
  return `assets/vendor-products/${fileName}`;
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8"
  };
  return types[extension] || "application/octet-stream";
}
function serveStatic(request, response, pathname) {
  let targetPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  
  // Clean URL Support: Agar URL me dot (.) nahi hai, toh .html extension laga do safely
  if (!targetPath.includes(".") && targetPath !== "") {
    targetPath += ".html";
  }

  const resolved = path.resolve(rootPath, targetPath);
  if (!resolved.startsWith(rootPath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(resolved) });
    response.end(data);
  });
}
  const resolved = path.resolve(rootPath, targetPath);
  if (!resolved.startsWith(rootPath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(resolved) });
    response.end(data);
  });
}

  fs.readFile(resolved, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(resolved) });
    response.end(data);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/products") {
    sendJson(response, 200, { products: readProducts() });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/me") {
    const session = getSession(request);
    sendJson(response, 200, { user: session || null });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/vendor/login") {
    const body = await readBody(request);
    if (body.username === vendorUser && body.password === vendorPass) {
      const token = createSession("vendor", vendorUser);
      setSessionCookie(response, token);
      sendJson(response, 200, { ok: true });
      return true;
    }
    sendJson(response, 401, { error: "Invalid vendor login" });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/user/login") {
    const body = await readBody(request);
    const name = String(body.name || "").trim();
    if (!name) {
      sendJson(response, 400, { error: "Name is required" });
      return true;
    }
    const token = createSession("user", name);
    setSessionCookie(response, token);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/logout") {
    clearSessionCookie(response);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/vendor/products" && request.method === "POST") {
    if (!requireRole(request, response, "vendor")) return true;
    const body = await readBody(request);
    const products = readProducts();
    const image = saveImage(body.imageData, body.imageName) || body.image || "assets/product-placeholder.svg";
    const product = {
      id: slugify(body.name || `product-${Date.now()}`),
      name: String(body.name || "New Product").trim(),
      details: String(body.details || "").trim(),
      image
    };
    products.push(product);
    writeProducts(products);
    sendJson(response, 201, { product });
    return true;
  }

  const vendorProductMatch = pathname.match(/^\/api\/vendor\/products\/([^/]+)$/);
  if (vendorProductMatch && request.method === "PUT") {
    if (!requireRole(request, response, "vendor")) return true;
    const id = decodeURIComponent(vendorProductMatch[1]);
    const body = await readBody(request);
    const products = readProducts();
    const product = products.find((item) => item.id === id);
    if (!product) {
      sendJson(response, 404, { error: "Product not found" });
      return true;
    }
    product.name = String(body.name || product.name).trim();
    product.details = String(body.details || product.details).trim();
    const image = saveImage(body.imageData, body.imageName);
    if (image) product.image = image;
    writeProducts(products);
    sendJson(response, 200, { product });
    return true;
  }

  if (vendorProductMatch && request.method === "DELETE") {
    if (!requireRole(request, response, "vendor")) return true;
    const id = decodeURIComponent(vendorProductMatch[1]);
    const products = readProducts().filter((item) => item.id !== id);
    writeProducts(products);
    sendJson(response, 200, { ok: true });
    return true;
  }

  return false;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/") && await handleApi(request, response, url.pathname)) return;
    serveStatic(request, response, url.pathname);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Pratik Enterprises app running at http://localhost:${port}`);
  console.log(`Vendor login: ${vendorUser} / ${vendorPass}`);
});
