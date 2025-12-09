// stackit-frontend/js/api.js

const API_BASE = 'https://stack-it-dgbn.onrender.com/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

window.api = {
  fetchQuestions: () => fetchJSON(`${API_BASE}/questions`),
  login: (data) => fetchJSON(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  register: (data) => fetchJSON(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  askQuestion: (data) => fetchJSON(`${API_BASE}/questions/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(data)
  }),
  fetchQuestionById: (id) => fetchJSON(`${API_BASE}/questions/${id}`),
};
