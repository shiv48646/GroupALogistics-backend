const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get user notifications' }));
router.put('/:id/read', (req, res) => res.json({ message: 'Mark notification as read' }));
router.put('/read-all', (req, res) => res.json({ message: 'Mark all as read' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete notification' }));

module.exports = router;