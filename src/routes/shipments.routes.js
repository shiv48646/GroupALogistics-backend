const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get all shipments' }));
router.get('/:id', (req, res) => res.json({ message: 'Get shipment details' }));
router.post('/', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Create shipment' }));
router.put('/:id', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Update shipment' }));
router.patch('/:id/status', (req, res) => res.json({ message: 'Update shipment status' }));
router.get('/track/:trackingNumber', (req, res) => res.json({ message: 'Track shipment' }));

module.exports = router;