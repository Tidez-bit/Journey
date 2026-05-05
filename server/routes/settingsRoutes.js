const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getProfile, updateProfile, updatePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSettings)
  .put(protect, updateSettings);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
