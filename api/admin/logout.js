const COOKIE_NAME = "prowire_admin";

function cookieOptions(req, maxAgeSeconds) {
  const host = req.headers.host || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const secure = isLocalhost ? "" : "; Secure";
  return `Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; ${cookieOptions(req, 0)}`);
  res.status(200).json({ admin: false });
};
