//routes/answers.js:
const express = require("express");
const router = express.Router();

const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");
const auth = require("../middleware/auth");

/* =============================
   POST ANSWER
============================= */
router.post("/:questionId", auth, async (req, res) => {
  try {
    const answer = new Answer({
      content: req.body.content,
      question: req.params.questionId,
      author: req.user.userId
    });

    await answer.save();
    res.status(201).json(answer);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   GET ANSWERS
============================= */
router.get("/:questionId", async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .populate("author", "username email reputation")
      .sort({ isAccepted: -1, createdAt: -1 });

    res.json(answers);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   UPVOTE (+2)
============================= */
router.post("/upvote/:answerId", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const voter = answer.voters.find(
      v => v.userId.toString() === req.user.userId
    );

    if (voter) {
      if (voter.vote === "up") {
        return res.status(400).json({ message: "Already upvoted" });
      }

      answer.downvotes--;
      answer.upvotes++;
      voter.vote = "up";

      await User.findByIdAndUpdate(answer.author, {
        $inc: { reputation: 4 }
      });
    } else {
      answer.upvotes++;
      answer.voters.push({ userId: req.user.userId, vote: "up" });

      await User.findByIdAndUpdate(answer.author, {
        $inc: { reputation: 2 }
      });
    }

    await answer.save();
    res.json(answer);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   DOWNVOTE (-2)
============================= */
router.post("/downvote/:answerId", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const voter = answer.voters.find(
      v => v.userId.toString() === req.user.userId
    );

    if (voter) {
      if (voter.vote === "down") {
        return res.status(400).json({ message: "Already downvoted" });
      }

      answer.upvotes--;
      answer.downvotes++;
      voter.vote = "down";

      await User.findByIdAndUpdate(answer.author, {
        $inc: { reputation: -4 }
      });
    } else {
      answer.downvotes++;
      answer.voters.push({ userId: req.user.userId, vote: "down" });

      await User.findByIdAndUpdate(answer.author, {
        $inc: { reputation: -2 }
      });
    }

    await answer.save();
    res.json(answer);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   ACCEPT ANSWER (+10)
============================= */
/* =============================
   ACCEPT ANSWER (FIXED)
============================= */
router.post("/accept/:answerId", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId)
      .populate("question");

    if (!answer)
      return res.status(404).json({ message: "Answer not found" });

    // Only question owner can accept
    if (answer.question.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🔎 Find previously accepted answer (if any)
    const previousAccepted = await Answer.findOne({
      question: answer.question._id,
      isAccepted: true
    });

    // 🔻 Rollback reputation of previous accepted answer author
    if (previousAccepted) {
      // If switching to a different answer
      if (previousAccepted._id.toString() !== answer._id.toString()) {
        await User.findByIdAndUpdate(previousAccepted.author, {
          $inc: { reputation: -10 }
        });

        previousAccepted.isAccepted = false;
        await previousAccepted.save();
      } else {
        // Same answer already accepted → do nothing
        return res.json({ message: "Answer already accepted" });
      }
    }

    // ✅ Accept new answer
    answer.isAccepted = true;
    await answer.save();

    // ⭐ Give +10 to new accepted answer author
    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: 10 }
    });

    // Update question
    await Question.findByIdAndUpdate(answer.question._id, {
      acceptedAnswer: answer._id
    });

    res.json({ message: "Answer accepted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   DELETE ANSWER (ROLLBACK REP)
============================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let rep = 0;
    rep -= answer.upvotes * 2;
    rep += answer.downvotes * 2;
    if (answer.isAccepted) rep -= 10;

    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: rep }
    });

    if (answer.isAccepted) {
      await Question.findByIdAndUpdate(answer.question, {
        acceptedAnswer: null
      });
    }

    await answer.deleteOne();
    res.json({ message: "Answer deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
