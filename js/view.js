// js/view.js

const qId = new URLSearchParams(window.location.search).get("id");
const highlightAnswerId = new URLSearchParams(window.location.search).get("highlightAnswer");

let currentQuestion = null;

document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();

  document.getElementById("login-btn").style.display = token ? "none" : "inline";
  document.getElementById("logout-btn").style.display = token ? "inline" : "none";

  if (!token) {
    document.getElementById("answer-form-section").style.display = "none";
  }

  await loadQuestion();
  await loadAnswers();

  document
    .getElementById("answer-form")
    ?.addEventListener("submit", postAnswer);
});

/* =============================
   LOAD QUESTION
============================= */
async function loadQuestion() {
  try {
    const res = await fetch(`${API_BASE}/questions`);
    const questions = await res.json();

    currentQuestion = questions.find(q => q._id === qId);
    if (!currentQuestion) return alert("Question not found");

    document.getElementById("q-title").innerText = currentQuestion.title;
    document.getElementById("q-description").innerHTML = currentQuestion.description;
    document.getElementById("q-tags").innerHTML =
      `<b>Tags:</b> ${currentQuestion.tags.join(", ")}`;
    document.getElementById("q-author").innerHTML =
      `<b>By:</b> ${currentQuestion.author.username}`;
  } catch {
    alert("Error loading question");
  }
}

/* =============================
   LOAD ANSWERS
============================= */
async function loadAnswers() {
  try {
    const res = await fetch(`${API_BASE}/answers/${qId}`);
    const answers = await res.json();

    const list = document.getElementById("answers-list");
    list.innerHTML = "";

    const user = getUserFromToken();
    const isQuestionOwner =
      user && currentQuestion.author._id === user.userId;

    // 🔥 PIN ACCEPTED ANSWER ON TOP
    const orderedAnswers = [
      ...answers.filter(a => a.isAccepted),
      ...answers.filter(a => !a.isAccepted)
    ];

    orderedAnswers.forEach(a => {
      if (highlightAnswerId && a._id !== highlightAnswerId) return;

      const isMyAnswer = user && a.author._id === user.userId;

      const card = document.createElement("div");
      card.className = "answer-card";

      if (a.isAccepted) {
        card.classList.add("accepted");
      }

      card.innerHTML = `
        ${a.isAccepted ? `<span class="accepted-badge">Accepted ✔</span>` : ""}

        <p>${a.content}</p>
        <p>
          <b>${a.author.username}</b> |
          ${new Date(a.createdAt).toLocaleString()}
        </p>

        <p>
          👍 ${a.upvotes}
          👎 ${a.downvotes}

          <button onclick="vote('${a._id}', 'up')">⬆️</button>
          <button onclick="vote('${a._id}', 'down')">⬇️</button>

          ${
            isQuestionOwner && !a.isAccepted
              ? `<button onclick="acceptAnswer('${a._id}')">✔ Accept</button>`
              : ""
          }

          ${
            isMyAnswer
              ? `<button class="delete-answer-btn" data-id="${a._id}">Delete</button>`
              : ""
          }
        </p>
        <hr/>
      `;

      list.appendChild(card);
    });

    attachDeleteAnswerHandlers();
  } catch {
    document.getElementById("answers-list").innerHTML =
      "<p>Error loading answers.</p>";
  }
}

/* =============================
   POST ANSWER
============================= */
async function postAnswer(e) {
  e.preventDefault();

  const content = document.getElementById("answer-input").value;
  const errorBox = document.getElementById("answer-error");
  const token = getToken();

  if (!token) return (errorBox.innerText = "Login required");

  try {
    const res = await fetch(`${API_BASE}/answers/${qId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    if (!res.ok) return (errorBox.innerText = data.message);

    document.getElementById("answer-form").reset();
    loadAnswers();
  } catch {
    errorBox.innerText = "Failed to post answer";
  }
}

/* =============================
   VOTE
============================= */
async function vote(answerId, type) {
  const token = getToken();
  if (!token) return alert("Login required");

  const res = await fetch(`${API_BASE}/answers/${type}vote/${answerId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  loadAnswers();
}

/* =============================
   ACCEPT ANSWER
============================= */
async function acceptAnswer(answerId) {
  const token = getToken();
  if (!token) return alert("Login required");

  const res = await fetch(
    `${API_BASE}/answers/accept/${answerId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  loadAnswers();
}

/* =============================
   DELETE ANSWER
============================= */
function attachDeleteAnswerHandlers() {
  document.querySelectorAll(".delete-answer-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this answer?")) return;

      const token = getToken();
      const res = await fetch(`${API_BASE}/answers/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        highlightAnswerId ? history.back() : loadAnswers();
      } else {
        alert("Failed to delete answer");
      }
    };
  });
}
