// stackit-frontend/js/question.js

const questionId = new URLSearchParams(window.location.search).get('id');
const questionContainer = document.getElementById('question-container');
const answersContainer = document.getElementById('answers-container');
const messageEl = document.getElementById('message');
const token = localStorage.getItem('token');

// Fetch and render the question
async function loadQuestion() {
  try {
    const res = await fetch(`http://localhost:5000/api/questions`);
    const allQuestions = await res.json();
    const question = allQuestions.find(q => q._id === questionId);
    if (!question) return (questionContainer.innerHTML = '<p>Question not found.</p>');

    questionContainer.innerHTML = `
      <h2>${question.title}</h2>
      <p>${question.description}</p>
      <p><strong>Tags:</strong> ${question.tags.join(', ')}</p>
      <p><em>Posted by: ${question.author.username}</em></p>
    `;
  } catch (err) {
    questionContainer.innerHTML = '<p>Error loading question.</p>';
  }
}

// Fetch and render answers with vote buttons
async function loadAnswers() {
  try {
    const res = await fetch(`http://localhost:5000/api/answers/${questionId}`);
    const answers = await res.json();

    answersContainer.innerHTML = answers.map(a => `
      <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
        <p>${a.content}</p>
        <p><em>By: ${a.author.username}</em></p>
        <p>
          <button onclick="voteAnswer('${a._id}', 'up')">👍 ${a.upvotes}</button>
          <button onclick="voteAnswer('${a._id}', 'down')">👎 ${a.downvotes}</button>
        </p>
      </div>
    `).join('');
  } catch (err) {
    answersContainer.innerHTML = '<p>Error loading answers.</p>';
  }
}

// Vote handler
async function voteAnswer(answerId, type) {
  if (!token) return alert('Login required to vote');

  try {
    const res = await fetch(`http://localhost:5000/api/answers/vote/${answerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({ voteType: type })
    });

    const data = await res.json();
    if (res.ok) {
      loadAnswers(); // refresh votes
    } else {
      alert(data.message || 'Voting failed');
    }
  } catch (err) {
    alert('Server error while voting');
  }
}

// Post a new answer
document.getElementById('answer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('answer-content').value.trim();
  if (!token) return alert('Login required to post answers.');

  try {
    const res = await fetch(`http://localhost:5000/api/answers/${questionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (res.ok) {
      messageEl.textContent = '✅ Answer posted!';
      document.getElementById('answer-content').value = '';
      loadAnswers();
    } else {
      throw new Error(data.message || 'Failed');
    }
  } catch (err) {
    messageEl.textContent = `❌ ${err.message}`;
  }
});

// Initialize
loadQuestion();
loadAnswers();
