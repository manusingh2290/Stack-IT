// js/home.js

let allQuestions = [];

document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();

  document.getElementById("login-btn").style.display = token ? "none" : "inline";
  document.getElementById("logout-btn").style.display = token ? "inline" : "none";

  try {
    const res = await fetch(`${API_BASE}/questions`);
    allQuestions = await res.json();

    renderQuestions(allQuestions);
  } catch {
    document.getElementById("questions-container").innerHTML =
      "<p>Failed to load questions.</p>";
  }

  // 🔍 Search + Filters
  document.getElementById("searchInput")
    .addEventListener("input", applyFilters);

  document.getElementById("statusFilter")
    .addEventListener("change", applyFilters);
});

// =============================
// AUTH UI
// =============================

const user = getUserFromToken();

if (user) {
  document.getElementById("login-btn").style.display = "none";
  document.getElementById("logout-btn").style.display = "inline";

  const profileLink = document.getElementById("profile-link");
  profileLink.style.display = "inline";
  profileLink.innerHTML = `
    <a href="profile.html?id=${user.userId}">
      ${user.username}
    </a>
  `;
}

// =============================
// FILTER LOGIC (CORE)
// =============================

function applyFilters() {
  const searchText =
    document.getElementById("searchInput").value.toLowerCase().trim();

  const status =
    document.getElementById("statusFilter").value;

  const filtered = allQuestions.filter(q => {

    // 🔍 Search by title OR tag
    const matchesSearch =
      q.title.toLowerCase().includes(searchText) ||
      q.tags.some(tag => tag.toLowerCase().includes(searchText));

    let matchesStatus = true;

    // ❓ UNANSWERED → zero answers
    if (status === "unanswered") {
      matchesStatus = q.answersCount === 0;
    }

    // 💬 ANSWERED → at least one answer
    if (status === "answered") {
      matchesStatus = q.answersCount > 0;
    }

    // ✅ ACCEPTED → accepted answer exists
    if (status === "accepted") {
      matchesStatus = Boolean(q.acceptedAnswer);
    }

    return matchesSearch && matchesStatus;
  });

  renderQuestions(filtered);
}

// =============================
// RENDER QUESTIONS
// =============================

function renderQuestions(questions) {
  const container = document.getElementById("questions-container");
  container.innerHTML = "";

  if (!questions.length) {
    container.innerHTML = "<p>No questions found.</p>";
    return;
  }

  questions.forEach(q => {
    const card = document.createElement("div");
    card.className = "question-card";

    card.innerHTML = `
      <h3>${q.title}</h3>
      <p>${q.description.slice(0, 100)}...</p>
      <p><strong>Tags:</strong> ${q.tags.join(", ")}</p>

      <p>
  <strong>By:</strong>
  <a href="profile.html?id=${q.author._id}">
    ${q.author.username}
  </a>
  ⭐ ${q.author.reputation}
</p>

      <div class="question-footer">
        <button class="upvote-btn" data-id="${q._id}">
          👍 <span>${q.likes || 0}</span>
        </button>

        ${q.acceptedAnswer ? "✅ Accepted" : ""}

        <a href="view.html?id=${q._id}">View</a>
      </div>
    `;

    container.appendChild(card);
  });

  attachUpvoteHandlers();
}

// =============================
// UPVOTE
// =============================

function attachUpvoteHandlers() {
  document.querySelectorAll(".upvote-btn").forEach(btn => {
    btn.onclick = async () => {
      const token = getToken();
      if (!token) {
        alert("Please login to upvote");
        return;
      }

      const questionId = btn.dataset.id;

      try {
        const res = await fetch(
          `${API_BASE}/questions/${questionId}/upvote`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();
        if (!res.ok) return alert(data.message);

        btn.querySelector("span").textContent = data.likes;
      } catch {
        alert("Failed to upvote");
      }
    };
  });
}
