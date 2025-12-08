// routes/questions.js

const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');

// 🔒 POST /api/questions/ask
router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    console.log("✅ Authenticated user:", req.user);
    console.log("📥 Request body:", req.body);

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const newQuestion = new Question({
      title,
      description,
      tags,
      author: req.user.userId,
    });

    await newQuestion.save();

    res.status(201).json({ message: 'Question posted successfully', question: newQuestion });
  } catch (err) {
    console.error("❌ Error posting question:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 📥 GET /api/questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('author', 'username email')
      .populate('acceptedAnswer')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Accept an answer
router.post('/accept/:questionId/:answerId', authMiddleware, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the question author can accept an answer' });
    }

    question.acceptedAnswer = answerId;
    await question.save();

    res.json({ message: 'Answer accepted', acceptedAnswer: answerId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
