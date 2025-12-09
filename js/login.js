// stackit-frontend/js/login.js

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('message');

  try {
    const res = await fetch('https://stack-it-dgbn.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    messageEl.textContent = "✅ Login successful!";
    messageEl.style.color = 'green';
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (err) {
    messageEl.textContent = `❌ ${err.message}`;
    messageEl.style.color = 'red';
  }
});
