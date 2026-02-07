// routes/users.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// 👤 GET USER PROFILE
router.get("/:id/profile", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "username email createdAt avatar bio reputation"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const questions = await Question.find({ author: user._id });

    const totalLikes = questions.reduce(
      (sum, q) => sum + (q.likes || 0),
      0
    );

    res.json({
      user,
      stats: {
        questionsAsked: questions.length,
        totalLikes
      },
      questions
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ✏️ UPDATE OWN PROFILE (AVATAR + BIO)
router.put(
  "/me",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const updates = {};

      if (typeof req.body.bio === "string") {
        updates.bio = req.body.bio;
      }

      if (req.file) {
        updates.avatar = `/uploads/${req.file.filename}`;
      }

      if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "Nothing to update" });
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updates },
        { new: true }
      );

      res.json(user);
    } catch {
      res.status(500).json({ message: "Profile update failed" });
    }
  }
);

// 🧠 GET ANSWERS BY USER
router.get("/:id/answers", async (req, res) => {
  try {
    const answers = await Answer.find({ author: req.params.id })
      .populate("question", "title")
      .sort({ createdAt: -1 });

    res.json(answers);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;