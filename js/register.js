// stackit-frontend/js/register.js

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const messageEl = document.getElementById('message');

  try {
    const res = await window.api.register({ username, email, password });
    messageEl.textContent = res.message;
    messageEl.style.color = 'green';
    setTimeout(() => window.location.href = '/login', 1500);
  } catch (err) {
    messageEl.textContent = `❌ ${err.message}`;
    messageEl.style.color = 'red';
  }
});
