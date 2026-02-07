//models/User.js:
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },

  // ✅ REQUIRED FOR PROFILE
  avatar: {
    type: String,
    default: "/uploads/default-avatar.png"
  },
  bio: {
    type: String,
    default: ""
  },
  reputation: {
  type: Number,
  default: 0
}

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
