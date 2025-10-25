const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/dashboard', (req, res) => res.json({ message: 'Dashboard analytics' }));
router.get('/metrics', (req, res) => res.json({ message: 'Get metrics' }));
router.get('/reports', (req, res) => res.json({ message: 'Generate reports' }));

module.exports = router;