// Mobile navigation toggle
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Current year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Quote form — opens the visitor's email client with a prefilled message.
// Swap in a real form backend (Formspree, Netlify Forms, etc.) when ready.
const form = document.getElementById("quoteForm");
const status = document.getElementById("formStatus");
const CONTACT_EMAIL = "dispatch@jbdtransit.com"; // TODO: confirm the real inbox

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();

    if (!name || !email) {
      setStatus("Please add your name and email so we can reply.", "err");
      return;
    }

    const lines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${data.get("phone") || "-"}`,
      `Pickup: ${data.get("origin") || "-"}`,
      `Delivery: ${data.get("destination") || "-"}`,
      "",
      "Freight details:",
      (data.get("message") || "-").toString(),
    ];

    const subject = encodeURIComponent(`Freight quote request — ${name}`);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setStatus("Opening your email app to send the request…", "ok");
    form.reset();
  });
}

function setStatus(msg, kind) {
  if (!status) return;
  status.textContent = msg;
  status.className = "form-status " + (kind || "");
}
