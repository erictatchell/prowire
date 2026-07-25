const crypto = require("crypto");

const COOKIE_NAME = "prowire_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signPayload(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCookieValue(email, secret) {
  const payload = base64UrlEncode(JSON.stringify({
    email,
    exp: Date.now() + COOKIE_MAX_AGE_SECONDS * 1000
  }));
  return `${payload}.${signPayload(payload, secret)}`;
}

function cookieOptions(req, maxAgeSeconds) {
  const host = req.headers.host || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const secure = isLocalhost ? "" : "; Secure";
  return `Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

function allowedEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function isVerifiedEmail(value) {
  return value === true || value === "true";
}

async function verifyGoogleCredential(credential, clientId) {
  const response = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(credential)}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    return null;
  }

  const claims = await response.json();
  const validIssuer = claims.iss === "accounts.google.com" || claims.iss === "https://accounts.google.com";
  const expiresAt = Number(claims.exp) * 1000;

  if (!validIssuer || claims.aud !== clientId || !isVerifiedEmail(claims.email_verified) || expiresAt <= Date.now()) {
    return null;
  }

  return {
    email: String(claims.email || "").toLowerCase()
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET;
  const whitelist = allowedEmails();

  if (!clientId || !cookieSecret || whitelist.length === 0) {
    res.status(500).json({ error: "Admin auth is not configured" });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const credential = typeof body.credential === "string" ? body.credential : "";
  if (!credential) {
    res.status(400).json({ error: "Missing Google credential" });
    return;
  }

  let user;
  try {
    user = await verifyGoogleCredential(credential, clientId);
  } catch (error) {
    res.status(502).json({ error: "Could not verify Google sign-in" });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Google sign-in could not be verified" });
    return;
  }

  if (!whitelist.includes(user.email)) {
    res.status(403).json({ error: "This Google account is not allowed" });
    return;
  }

  const cookieValue = createCookieValue(user.email, cookieSecret);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${cookieValue}; ${cookieOptions(req, COOKIE_MAX_AGE_SECONDS)}`);
  res.status(200).json({ admin: true, email: user.email });
};
