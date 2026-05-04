const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSettings)
  .put(protect, updateSettings);

module.exports = router;
