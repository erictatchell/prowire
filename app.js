const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

const requestedProject = new URLSearchParams(window.location.search).get("project");

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  const projectSelect = form.querySelector("[data-project-type]");

  if (requestedProject && projectSelect) {
    const matchingOption = Array.from(projectSelect.options).find(
      (option) => option.value.toLowerCase() === requestedProject.toLowerCase()
    );

    if (matchingOption) {
      projectSelect.value = matchingOption.value;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());

    if (status) {
      status.dataset.tone = "pending";
      status.textContent = "Sending your estimate request...";
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "We could not send the request.");
      }

      if (status) {
        status.dataset.tone = "success";
        status.textContent = "Thanks — your request has been sent. Prowire will follow up shortly.";
      }
      form.reset();
    } catch (error) {
      if (status) {
        status.dataset.tone = "error";
        status.textContent = error.message;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
});

const chatToggle = document.querySelector("[data-chat-toggle]");
const chatPanel = document.querySelector("[data-chat-panel]");

if (chatToggle && chatPanel) {
  chatToggle.addEventListener("click", () => {
    const willOpen = chatPanel.hasAttribute("hidden");
    chatPanel.toggleAttribute("hidden", !willOpen);
    chatToggle.setAttribute("aria-expanded", String(willOpen));
  });
}
