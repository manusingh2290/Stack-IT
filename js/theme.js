// js/theme.js

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");

  // ✅ APPLY SAVED THEME ON ALL PAGES
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (toggle) toggle.checked = true;
  }

  // ✅ TOGGLE ONLY IF BUTTON EXISTS
  if (toggle) {
    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
      }
    });
  }
});
