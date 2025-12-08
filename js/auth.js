

// Utility functions (also used in utils.js if needed)
function setToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// LOGIN HANDLER
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorElem = document.getElementById("login-error");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorElem.textContent = data.message || "Login failed";
      return;
    }

    // Success
    setToken(data.token);
    window.location.href = "index.html";
  } catch (err) {
    errorElem.textContent = "Server error. Try again.";
  }
});

// REGISTER HANDLER (for register.html)
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorElem = document.getElementById("register-error");

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorElem.textContent = data.message || "Registration failed";
      return;
    }

    alert("✅ Registration successful! Please login.");
    window.location.href = "login.html";
  } catch (err) {
    errorElem.textContent = "Server error. Try again.";
  }
});
