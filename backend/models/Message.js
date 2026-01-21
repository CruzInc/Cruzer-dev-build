const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  contactId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: true
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice', 'video'],
    default: 'text'
  },
  mediaUrl: String
});

MessageSchema.index({ userId: 1, contactId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);
