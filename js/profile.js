// js/profile.js

document.addEventListener("DOMContentLoaded", initProfile);

async function initProfile() {
  const params = new URLSearchParams(window.location.search);
  const profileUserId = params.get("id");
  const loggedInUser = getUserFromToken();
  const container = document.getElementById("profile-container");

  if (!profileUserId) {
    container.innerHTML = "<p>User not found.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${profileUserId}/profile`);
    const data = await res.json();

    const isOwnProfile =
      loggedInUser && loggedInUser.userId === profileUserId;

    renderProfile(data, isOwnProfile);

    if (isOwnProfile) {
      attachProfileEditHandlers();
      attachDeleteHandlers();
      attachEditHandlers();
      loadMyAnswers(profileUserId);
    }

    const logoutBtn = document.getElementById("profile-logout-btn");

    if (isOwnProfile && logoutBtn) {
      logoutBtn.style.display = "inline-block";
      logoutBtn.addEventListener("click", logout);
    }
  } catch {
    container.innerHTML = "<p>Failed to load profile.</p>";
  }
}

/* =============================
   RENDER PROFILE
============================= */

function renderProfile({ user, stats, questions }, isOwnProfile) {
  const container = document.getElementById("profile-container");

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar-wrapper">
        <img id="avatarImg"
             src="${user.avatar || "/uploads/default-avatar.png"}"
             class="profile-avatar" />

        ${isOwnProfile ? `
          <label for="avatarInput" class="avatar-plus">+</label>
          <input type="file" id="avatarInput" accept="image/*" hidden />
        ` : ""}
      </div>

      <h2>${user.username}</h2>

      ${isOwnProfile ? `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Joined:</strong> ${new Date(user.createdAt).toDateString()}</p>

        <textarea id="bioInput"
          placeholder="Write something about yourself...">${user.bio || ""}</textarea>

        <button id="saveProfileBtn" class="nav-btn">Save</button>
      ` : `<p>${user.bio || "No bio added yet."}</p>`}

      <div class="profile-stats">
        <div><strong>${stats.questionsAsked}</strong> Questions</div>
        <div><strong>${stats.totalLikes}</strong> Upvotes</div>
      </div>

      <h3>Questions</h3>
      <div id="profile-questions">
        ${questions.length ? questions.map(q => `
          <div class="profile-question">
            <a href="view.html?id=${q._id}">${q.title}</a>
            <span>👍 ${q.likes || 0}</span>
            ${isOwnProfile ? `
              <button class="edit-btn" data-id="${q._id}">Edit</button>
              <button class="delete-btn" data-id="${q._id}">Delete</button>
            ` : ""}
          </div>
        `).join("") : "<p>No questions yet.</p>"}
      </div>

      <div id="answers-section"></div>
    </div>
  `;
}

/* =============================
   PROFILE EDIT (AVATAR + BIO)
============================= */

function attachProfileEditHandlers() {
  const avatarInput = document.getElementById("avatarInput");
  const avatarImg = document.getElementById("avatarImg");
  const saveBtn = document.getElementById("saveProfileBtn");

  if (!saveBtn) return;

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => (avatarImg.src = reader.result);
    reader.readAsDataURL(file);
  });

  saveBtn.addEventListener("click", async () => {
    const bio = document.getElementById("bioInput").value;
    const formData = new FormData();

    formData.append("bio", bio);
    if (avatarInput.files.length) {
      formData.append("avatar", avatarInput.files[0]);
    }

    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData
    });

    if (res.ok) location.reload();
    else alert("Profile update failed");
  });
}

/* =============================
   DELETE QUESTIONS
============================= */

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this question?")) return;

      const res = await fetch(`${API_BASE}/questions/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (res.ok) location.reload();
      else alert("Failed to delete question");
    };
  });
}

/* =============================
   MY ANSWERS
============================= */

async function loadMyAnswers(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/answers`);
  const answers = await res.json();

  const container = document.getElementById("answers-section");

  container.innerHTML = `
    <h3>My Answers</h3>
    ${answers.length ? answers.map(a => `
      <div class="profile-answer">
        <a href="view.html?id=${a.question._id}">
          ${a.question.title}
        </a>
        <button class="delete-answer-btn" data-id="${a._id}">
          Delete Answer
        </button>
      </div>
    `).join("") : "<p>No answers yet.</p>"}
  `;

  attachDeleteAnswerHandlers();
}

function attachDeleteAnswerHandlers() {
  document.querySelectorAll(".delete-answer-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this answer?")) return;

      const res = await fetch(`${API_BASE}/answers/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (res.ok) location.reload();
      else alert("Failed to delete answer");
    };
  });
}

/* =============================
   EDIT QUESTION MODAL
============================= */

function attachEditHandlers() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = async () => {
      const res = await fetch(`${API_BASE}/questions`);
      const questions = await res.json();
      const q = questions.find(x => x._id === btn.dataset.id);
      if (q) showEditModal(q);
    };
  });
}

function showEditModal(question) {
  let isDirty = false;

  const beforeUnloadHandler = (e) => {
    if (!isDirty) return;
    e.preventDefault();
    e.returnValue = "";
  };

  const modal = document.createElement("div");
  modal.className = "edit-modal";

  modal.innerHTML = `
    <div class="edit-box">
      <h3>Edit Question</h3>
      <input id="editTitle" value="${question.title}" />
      <div id="editor" style="height:180px;"></div>
      <input id="editTags" value="${question.tags.join(", ")}" />

      <div class="preview-box" id="previewBox" style="display:none;"></div>

      <div class="edit-actions">
        <button id="togglePreview" class="nav-btn-outline">Preview</button>
        <button id="saveEdit" class="nav-btn" disabled>Save</button>
        <button id="cancelEdit" class="nav-btn-outline">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const quill = new Quill("#editor", { theme: "snow" });
  quill.root.innerHTML = question.description;

  const titleInput = document.getElementById("editTitle");
  const tagsInput = document.getElementById("editTags");
  const saveBtn = document.getElementById("saveEdit");
  const previewBox = document.getElementById("previewBox");
  const toggleBtn = document.getElementById("togglePreview");
  const editorDiv = document.getElementById("editor");

  let previewMode = false;

  toggleBtn.onclick = () => {
    previewMode = !previewMode;

    if (previewMode) {
      previewBox.innerHTML = `
      <h4>${titleInput.value}</h4>
      ${quill.root.innerHTML}
      <p><strong>Tags:</strong> ${tagsInput.value}</p>
    `;

      previewBox.style.display = "block";
      editorDiv.style.display = "none";
      toggleBtn.textContent = "Edit";
    } else {
      previewBox.style.display = "none";
      editorDiv.style.display = "block";
      toggleBtn.textContent = "Preview";
    }
  };
  const initial = {
    title: question.title,
    desc: question.description,
    tags: question.tags.join(", ")
  };

  function checkDirty() {
    isDirty =
      titleInput.value !== initial.title ||
      quill.root.innerHTML !== initial.desc ||
      tagsInput.value !== initial.tags;

    saveBtn.disabled = !isDirty;
  }

  titleInput.oninput = checkDirty;
  tagsInput.oninput = checkDirty;
  quill.on("text-change", checkDirty);

  window.addEventListener("beforeunload", beforeUnloadHandler);

  document.getElementById("cancelEdit").onclick = () => {
    if (!isDirty || confirm("Discard unsaved changes?")) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      modal.remove();
    }
  };

  saveBtn.onclick = async () => {
    const payload = {
      title: titleInput.value,
      description: quill.root.innerHTML,
      tags: tagsInput.value.split(",").map(t => t.trim()).filter(Boolean)
    };

    const res = await fetch(`${API_BASE}/questions/${question._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      isDirty = false;
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      modal.remove();
      location.reload();
    } else {
      alert("Failed to update question");
    }
  };
}