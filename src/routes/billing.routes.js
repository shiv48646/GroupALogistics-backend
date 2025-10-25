const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/invoices', (req, res) => res.json({ message: 'Get all invoices' }));
router.get('/invoices/:id', (req, res) => res.json({ message: 'Get invoice details' }));
router.post('/invoices', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Create invoice' }));
router.put('/invoices/:id', authorize('admin', 'manager'), (req, res) => res.json({ message: 'Update invoice' }));
router.delete('/invoices/:id', authorize('admin'), (req, res) => res.json({ message: 'Delete invoice' }));
router.get('/invoices/:id/pdf', (req, res) => res.json({ message: 'Download invoice PDF' }));

module.exports = router;