const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  contactId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: String,
  email: String,
  photoURL: String,
  isFavorite: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ContactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

ContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Contact', ContactSchema);
