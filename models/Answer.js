const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  content: {
    type: String, // rich text (HTML)
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  voters: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['up', 'down'] }
    }
  ],
  isAccepted: {
    type: Boolean,
    default: false // ✅ NEW FIELD to support accepted answer
  }
});

module.exports = mongoose.model('Answer', AnswerSchema);
