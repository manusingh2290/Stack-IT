// routes/questions.js

const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// 🔒 POST /api/questions/ask
router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags } = req.body;

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
    res.status(500).json({ message: 'Server error' });
  }
});

// 📥 GET /api/questions (with answer count + reputation)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('author', 'username email reputation')
      .populate('acceptedAnswer')
      .lean()
      .sort({ likes: -1, createdAt: -1 });

    const enriched = await Promise.all(
      questions.map(async (q) => {
        const answersCount = await Answer.countDocuments({
          question: q._id
        });

        return {
          ...q,
          answersCount
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 👍 UPVOTE QUESTION
router.post('/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.likedBy.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already upvoted' });
    }

    question.likes += 1;
    question.likedBy.push(req.user.userId);
    await question.save();

    res.json({ likes: question.likes });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ ACCEPT ANSWER (question owner only)
router.post('/accept/:questionId/:answerId', authMiddleware, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only question owner can accept an answer' });
    }

    // reset previous accepted answer
    await Answer.updateMany(
      { question: questionId },
      { isAccepted: false }
    );

    const acceptedAnswer = await Answer.findByIdAndUpdate(
      answerId,
      { isAccepted: true },
      { new: true }
    );

    question.acceptedAnswer = answerId;
    await question.save();

    // ⭐ +10 reputation to answer author
    await User.findByIdAndUpdate(acceptedAnswer.author, {
      $inc: { reputation: 10 }
    });

    res.json({ message: 'Answer accepted', acceptedAnswer: answerId });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// 🗑️ DELETE QUESTION (ONLY OWNER)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Not found' });

    if (question.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await question.deleteOne();
    res.json({ message: 'Question deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✏️ UPDATE QUESTION (ONLY OWNER)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    question.title = title ?? question.title;
    question.description = description ?? question.description;
    question.tags = tags ?? question.tags;

    await question.save();
    res.json({ message: 'Question updated successfully', question });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
