// js/home.js

document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();
  document.getElementById("login-btn").style.display = token ? "none" : "inline";
  document.getElementById("logout-btn").style.display = token ? "inline" : "none";

  try {
    const res = await fetch(`${API_BASE}/questions`);
    const questions = await res.json();

    const container = document.getElementById("questions-container");
    if (!questions.length) {
      container.innerHTML = "<p>No questions yet. Be the first to ask!</p>";
      return;
    }

    questions.forEach(q => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `
        <h3>${q.title}</h3>
        <p>${q.description.slice(0, 100)}...</p>
        <p><strong>Tags:</strong> ${q.tags.join(", ")}</p>
        <p><strong>By:</strong> ${q.author.username}</p>
        <a href="view.html?id=${q._id}">View Question</a>
        <hr />
      `;
      container.appendChild(card);
    });
  } catch (err) {
    document.getElementById("questions-container").innerHTML = "<p>Failed to load questions.</p>";
  }
});
