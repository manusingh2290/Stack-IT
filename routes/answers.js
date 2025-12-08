const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');

// 🟢 Post a new answer
router.post('/:questionId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { questionId } = req.params;

    const answer = new Answer({
      content,
      question: questionId,
      author: req.user.userId
    });

    await answer.save();
    res.status(201).json({ message: 'Answer posted successfully', answer });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 🔵 Get all answers for a question
router.get('/:questionId', async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.json(answers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ⬆️ Upvote an answer
router.post('/upvote/:answerId', authMiddleware, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const voter = answer.voters.find(v => v.userId.toString() === req.user.userId);

    if (voter) {
      if (voter.vote === 'up') return res.status(400).json({ message: 'Already upvoted' });
      answer.downvotes--;
      answer.upvotes++;
      voter.vote = 'up';
    } else {
      answer.upvotes++;
      answer.voters.push({ userId: req.user.userId, vote: 'up' });
    }

    await answer.save();
    res.json({ message: 'Upvoted', upvotes: answer.upvotes, downvotes: answer.downvotes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ⬇️ Downvote an answer
router.post('/downvote/:answerId', authMiddleware, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const voter = answer.voters.find(v => v.userId.toString() === req.user.userId);

    if (voter) {
      if (voter.vote === 'down') return res.status(400).json({ message: 'Already downvoted' });
      answer.upvotes--;
      answer.downvotes++;
      voter.vote = 'down';
    } else {
      answer.downvotes++;
      answer.voters.push({ userId: req.user.userId, vote: 'down' });
    }

    await answer.save();
    res.json({ message: 'Downvoted', upvotes: answer.upvotes, downvotes: answer.downvotes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Accept an answer (only by question owner)
router.post('/accept/:answerId', authMiddleware, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId).populate('question');
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const question = await Question.findById(answer.question._id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Only question owner can accept
    if (question.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only question owner can accept answers' });
    }

    // Unmark previously accepted answers for this question
    await Answer.updateMany(
      { question: question._id, isAccepted: true },
      { $set: { isAccepted: false } }
    );

    // Mark this answer as accepted
    answer.isAccepted = true;
    await answer.save();

    res.json({ message: 'Answer accepted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
