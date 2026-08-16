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

async function handleContact(request, response, toEmail) {
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

  try {
    const emailResponse = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://www.prowireelectric.ca",
        Referer: "https://www.prowireelectric.ca/contact",
      },
      body: JSON.stringify({
        _subject: `Website estimate request: ${submission.projectType}`,
        _replyto: submission.email,
        _template: "table",
        Name: `${submission.firstName} ${submission.lastName}`.trim(),
        Email: submission.email,
        Phone: submission.phone || "Not provided",
        "Project address": submission.address || "Not provided",
        "Project type": submission.projectType,
        Timeline: submission.timeline || "Not provided",
        "Project description": submission.message,
      }),
    });

    if (!emailResponse.ok) {
      const providerResponse = await emailResponse.json().catch(() => ({}));
      throw new Error(providerResponse.message || `Email provider returned ${emailResponse.status}.`);
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact email failed", error);
    return response.status(502).json({
      error: "We could not send the request. Please call 604-849-3192 or email info@prowiregroup.com.",
    });
  }
}

module.exports = function handler(request, response) {
  const toEmail = process.env.CONTACT_TO_EMAIL || "info@prowiregroup.com";
  return handleContact(request, response, toEmail);
};

module.exports.handleContact = handleContact;
