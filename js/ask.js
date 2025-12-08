// stackit-frontend/js/ask.js


function getToken() {
  return localStorage.getItem("token");
}

document.getElementById("ask-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const tags = document.getElementById("tags").value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  const errorElem = document.getElementById("ask-error");
  const successElem = document.getElementById("ask-success");

  const token = getToken();
  if (!token) {
    errorElem.textContent = "You must be logged in to ask a question.";
    return;
  }

  console.log("🔐 Sending Token:", token);
  console.log("📦 Payload:", { title, description, tags });

  try {
    const res = await fetch(`${API_BASE}/questions/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, tags })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to post question:", data);
      errorElem.textContent = data.message || "Failed to post question";
      successElem.textContent = "";
      return;
    }

    successElem.textContent = "✅ Question posted successfully!";
    errorElem.textContent = "";
    document.getElementById("ask-form").reset();
  } catch (err) {
    console.error("Server error:", err);
    errorElem.textContent = "Server error. Try again.";
    successElem.textContent = "";
  }
});
