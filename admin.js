let isAdmin = false;

const statusElement = document.querySelector("[data-admin-status]");
const authElement = document.querySelector("[data-admin-auth]");
const panelElement = document.querySelector("[data-admin-panel]");
const emailElement = document.querySelector("[data-admin-email]");
const googleButtonElement = document.querySelector("[data-google-signin]");
const logoutButton = document.querySelector("[data-admin-logout]");

function setAdminFlag(value) {
  isAdmin = value === true;
  document.documentElement.dataset.admin = String(isAdmin);
}

function setStatus(message, tone = "") {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
}

function showAuth() {
  setAdminFlag(false);
  authElement?.removeAttribute("hidden");
  panelElement?.setAttribute("hidden", "");
}

function showPanel(email) {
  setAdminFlag(true);
  authElement?.setAttribute("hidden", "");
  panelElement?.removeAttribute("hidden");
  if (emailElement) {
    emailElement.textContent = email;
  }
  setStatus("Admin access confirmed.");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Google sign-in could not load"));
    document.head.appendChild(script);
  });
}

async function handleGoogleCredential(response) {
  setAdminFlag(false);
  setStatus("Verifying Google account...");

  try {
    const session = await requestJson("/api/admin/google", {
      method: "POST",
      body: JSON.stringify({ credential: response.credential })
    });
    showPanel(session.email);
  } catch (error) {
    showAuth();
    setStatus(error.message, "error");
  }
}

async function initializeGoogleSignIn(clientId) {
  await loadGoogleScript();

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  window.google.accounts.id.renderButton(googleButtonElement, {
    theme: "filled_black",
    size: "large",
    shape: "rectangular",
    text: "signin_with",
    width: 280
  });

  window.google.accounts.id.prompt();
}

async function initializeAdmin() {
  setAdminFlag(false);

  try {
    const session = await requestJson("/api/admin/session");
    if (session.admin === true && session.email) {
      showPanel(session.email);
      return;
    }
  } catch (error) {
    setStatus("Admin session unavailable.", "error");
  }

  showAuth();

  try {
    const config = await requestJson("/api/admin/config");
    if (!config.googleClientId) {
      setStatus("Google sign-in is not configured.", "error");
      return;
    }
    setStatus("Sign in with Google to continue.");
    await initializeGoogleSignIn(config.googleClientId);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

logoutButton?.addEventListener("click", async () => {
  setAdminFlag(false);
  try {
    await requestJson("/api/admin/logout", { method: "POST" });
  } finally {
    showAuth();
    setStatus("Signed out.");
    window.google?.accounts?.id?.disableAutoSelect();
  }
});

initializeAdmin();
