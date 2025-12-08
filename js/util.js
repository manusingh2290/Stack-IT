// js/utils.js

const API_BASE = "http://localhost:5000/api"; // Adjust this if needed

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
