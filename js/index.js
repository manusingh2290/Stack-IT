// stackit-frontend/js/index.js

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('questions-container');

  try {
    const questions = await window.api.fetchQuestions();
    container.innerHTML = questions.map(q => `
      <div class="question-card">
        <h3><a href="question.html?id=${q._id}">${q.title}</a></h3>
        <p>Tags: ${q.tags.join(', ')}</p>
        <small>Asked by: ${q.author?.username || 'Unknown'} on ${new Date(q.createdAt).toLocaleString()}</small>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Failed to load questions: ${err.message}</p>`;
  }
});
