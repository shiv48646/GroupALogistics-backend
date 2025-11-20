const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth.middleware');
const { uploadChatAttachment } = require('../middleware/upload.middleware');

// Protect all routes
router.use(protect);

// Send message with optional attachment
router.post(
  '/messages',
  uploadChatAttachment,  // Use the new chat upload middleware
  chatController.sendMessage
);

// Get messages for a conversation
router.get('/messages/:conversationId', chatController.getMessages);

// Get user conversations
router.get('/conversations', chatController.getConversations);

// Create/Get conversation
router.post('/conversations', chatController.createConversation);

// Delete message
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;