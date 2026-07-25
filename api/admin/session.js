const crypto = require("crypto");

const COOKIE_NAME = "prowire_admin";

function parseCookies(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separatorIndex = item.indexOf("=");
      if (separatorIndex === -1) {
        return cookies;
      }
      cookies[item.slice(0, separatorIndex)] = item.slice(separatorIndex + 1);
      return cookies;
    }, {});
}

function base64UrlDecode(value) {
  const padded = `${value}${"=".repeat((4 - value.length % 4) % 4)}`;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
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

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function cookieOptions(req, maxAgeSeconds) {
  const host = req.headers.host || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const secure = isLocalhost ? "" : "; Secure";
  return `Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

function clearAdminCookie(req, res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; ${cookieOptions(req, 0)}`);
}

function allowedEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function readSession(req) {
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret) {
    return null;
  }

  const cookie = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!cookie) {
    return null;
  }

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload));
    const email = String(session.email || "").toLowerCase();
    if (!email || Number(session.exp) <= Date.now()) {
      return null;
    }
    return { email };
  } catch (error) {
    return null;
  }
}

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");

  const session = readSession(req);
  const whitelist = allowedEmails();
  if (!session || !whitelist.includes(session.email)) {
    clearAdminCookie(req, res);
    res.status(200).json({ admin: false });
    return;
  }

  res.status(200).json({ admin: true, email: session.email });
};
