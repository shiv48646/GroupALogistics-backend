const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/conversations', (req, res) => res.json({ message: 'Get user conversations' }));
router.get('/conversations/:id/messages', (req, res) => res.json({ message: 'Get conversation messages' }));
router.post('/conversations', (req, res) => res.json({ message: 'Create conversation' }));
router.post('/messages', (req, res) => res.json({ message: 'Send message' }));
router.put('/messages/:id/read', (req, res) => res.json({ message: 'Mark message as read' }));

module.exports = router;