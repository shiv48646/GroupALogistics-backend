const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get all routes' }));
router.get('/:id', (req, res) => res.json({ message: 'Get route details' }));
router.post('/', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Create route' }));
router.put('/:id', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Update route' }));
router.delete('/:id', authorize('admin'), (req, res) => res.json({ message: 'Delete route' }));
router.post('/optimize', (req, res) => res.json({ message: 'Optimize route' }));

module.exports = router;