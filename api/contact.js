const MAX_LENGTHS = {
  firstName: 80,
  lastName: 80,
  email: 160,
  phone: 40,
  address: 180,
  projectType: 80,
  timeline: 80,
  message: 4000,
};

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const body = request.body || {};

  // Quietly accept bot submissions that fill the hidden company field.
  if (clean(body.company, 120)) {
    return response.status(200).json({ ok: true });
  }

  const submission = Object.fromEntries(
    Object.entries(MAX_LENGTHS).map(([key, maxLength]) => [key, clean(body[key], maxLength)])
  );

  if (!submission.firstName || !submission.email || !submission.projectType || !submission.message) {
    return response.status(400).json({
      error: "Please include your name, email, project type, and project description.",
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(submission.email)) {
    return response.status(400).json({ error: "Please enter a valid email address." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "info@prowiregroup.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "Prowire Website <website@prowireelectric.ca>";

  if (!apiKey) {
    return response.status(503).json({
      error: "Please call 604-849-3192 or email info@prowiregroup.com to request an estimate.",
    });
  }

  const rows = [
    ["Name", `${submission.firstName} ${submission.lastName}`.trim()],
    ["Email", submission.email],
    ["Phone", submission.phone || "Not provided"],
    ["Project address", submission.address || "Not provided"],
    ["Project type", submission.projectType],
    ["Timeline", submission.timeline || "Not provided"],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 14px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Prowire Website/1.0",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: submission.email,
        subject: `Website estimate request: ${submission.projectType}`,
        text: `${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nProject description:\n${submission.message}`,
        html: `<h1>New website estimate request</h1><table>${htmlRows}</table><h2>Project description</h2><p>${escapeHtml(submission.message).replaceAll("\n", "<br>")}</p>`,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email provider returned ${emailResponse.status}.`);
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact email failed", error);
    return response.status(502).json({
      error: "We could not send the request. Please call 604-849-3192 or email info@prowiregroup.com.",
    });
  }
};
