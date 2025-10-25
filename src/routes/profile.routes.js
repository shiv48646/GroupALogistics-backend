const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', (req, res) => res.json({ message: 'Get user profile' }));
router.put('/', (req, res) => res.json({ message: 'Update profile' }));
router.put('/password', (req, res) => res.json({ message: 'Change password' }));
router.post('/avatar', (req, res) => res.json({ message: 'Update avatar' }));

module.exports = router;