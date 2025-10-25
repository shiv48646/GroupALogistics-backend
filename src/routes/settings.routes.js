const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get user settings' }));
router.put('/', (req, res) => res.json({ message: 'Update settings' }));

module.exports = router;