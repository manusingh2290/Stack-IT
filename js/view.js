// js/view.js

const params = new URLSearchParams(window.location.search);
const qId = params.get("id");

if (!qId) {
  console.error("❌ No question ID in URL");
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();

  document.getElementById("login-btn").style.display = token ? "none" : "inline";
  document.getElementById("logout-btn").style.display = token ? "inline" : "none";

  if (!token) {
    document.getElementById("answer-form-section").style.display = "none";
  }

  await loadQuestion();
  await loadAnswers();

  const form = document.getElementById("answer-form");
  if (form) form.addEventListener("submit", postAnswer);
});

// ----------------------
// Load Specific Question
// ----------------------
async function loadQuestion() {
  try {
    const res = await fetch(`${API_BASE}/questions`);
    const questions = await res.json();

    const question = questions.find(q => q._id === qId);

    if (!question) {
      document.getElementById("q-title").innerText = "Question not found.";
      return;
    }

    document.getElementById("q-title").innerText = question.title;
    document.getElementById("q-description").innerText = question.description;
    document.getElementById("q-tags").innerHTML = `<b>Tags:</b> ${question.tags.join(", ")}`;
    document.getElementById("q-author").innerHTML = `<b>By:</b> ${question.author.username}`;
  } catch (err) {
    console.error("❌ Error loading question:", err);
  }
}

// ----------------------
// Load Answers
// ----------------------
async function loadAnswers() {
  try {
    const res = await fetch(`${API_BASE}/answers/${qId}`);
    const answers = await res.json();

    const list = document.getElementById("answers-list");
    list.innerHTML = "";

    if (!answers.length) {
      list.innerHTML = "<p>No answers yet. Be the first!</p>";
      return;
    }

    answers.forEach(a => {
      const card = document.createElement("div");
      card.className = "answer-card";
      card.innerHTML = `
        <p>${a.content}</p>
        <p><b>${a.author.username}</b> | ${new Date(a.createdAt).toLocaleString()}</p>
        <p>
          👍 ${a.upvotes} &nbsp; 
          👎 ${a.downvotes}
          <button onclick="vote('${a._id}', 'up')">⬆️</button>
          <button onclick="vote('${a._id}', 'down')">⬇️</button>
        </p>
        <hr/>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    document.getElementById("answers-list").innerHTML = "<p>Error loading answers.</p>";
  }
}

// ----------------------
// Post Answer
// ----------------------
async function postAnswer(e) {
  e.preventDefault();

  const content = document.getElementById("answer-input").value;
  const errorBox = document.getElementById("answer-error");
  const token = getToken();

  if (!token) {
    errorBox.innerText = "Login required to post answers.";
    return;
  }

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

    if (!res.ok) {
      errorBox.innerText = data.message;
      return;
    }

    document.getElementById("answer-form").reset();
    loadAnswers();
  } catch {
    errorBox.innerText = "Failed to post answer.";
  }
}

// ----------------------
// Voting
// ----------------------
async function vote(answerId, type) {
  const token = getToken();
  if (!token) return alert("Login to vote");

  const res = await fetch(`${API_BASE}/answers/${type}vote/${answerId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  loadAnswers();
}
