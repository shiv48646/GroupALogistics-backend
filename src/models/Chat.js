const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'system'],
    default: 'text'
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ conversation: 1, createdAt: -1 });
chatSchema.index({ sender: 1 });

const conversationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  avatar: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
conversationSchema.index({ participants: 1 });

const Chat = mongoose.model('Chat', chatSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Chat, Conversation };