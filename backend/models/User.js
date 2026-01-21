const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    index: true
  },
  displayName: String,
  photoURL: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: String,
  emailVerificationCodeExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    theme: {
      type: String,
      default: 'automatic'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);
