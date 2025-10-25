const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get all inventory items' }));
router.get('/:id', (req, res) => res.json({ message: 'Get item details' }));
router.post('/', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Add inventory item' }));
router.put('/:id', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Update item' }));
router.delete('/:id', authorize('admin'), (req, res) => res.json({ message: 'Delete item' }));
router.get('/stock-movements', (req, res) => res.json({ message: 'Get stock movements' }));
router.post('/stock-movement', (req, res) => res.json({ message: 'Record stock movement' }));

module.exports = router;
