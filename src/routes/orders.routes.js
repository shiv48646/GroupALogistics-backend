const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get all orders' }));
router.get('/:id', (req, res) => res.json({ message: 'Get order details' }));
router.post('/', (req, res) => res.json({ message: 'Create order' }));
router.put('/:id', (req, res) => res.json({ message: 'Update order' }));
router.patch('/:id/status', (req, res) => res.json({ message: 'Update order status' }));
router.delete('/:id', authorize('admin'), (req, res) => res.json({ message: 'Delete order' }));

module.exports = router;