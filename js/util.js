// js/utils.js

const API_BASE = "https://stack-it-dgbn.onrender.com/api"; // Adjust this if needed

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function logout() {
  localStorage.removeItem("token");
  location.href = "login.html";
}
