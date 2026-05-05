const express = require('express');
const router = express.Router();
const { upload, uploadScreenshot } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.post('/screenshot', protect, upload.single('screenshot'), uploadScreenshot);

module.exports = router;
