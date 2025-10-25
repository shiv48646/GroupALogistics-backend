const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Get all attendance records' }));
router.get('/:userId', (req, res) => res.json({ message: 'Get user attendance' }));
router.post('/check-in', (req, res) => res.json({ message: 'Check in' }));
router.post('/check-out', (req, res) => res.json({ message: 'Check out' }));
router.get('/report', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Attendance report' }));

module.exports = router;