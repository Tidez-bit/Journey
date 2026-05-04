const express = require('express');
const router = express.Router();
const {
  getRealTimePrice,
  getMultiplePrices,
  calculatePD,
  getScanners,
  createScanner
} = require('../controllers/scannerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/price/:pair(*)', protect, getRealTimePrice);
router.post('/prices', protect, getMultiplePrices);
router.post('/calculate-pd', protect, calculatePD);

router.route('/')
  .get(protect, getScanners)
  .post(protect, createScanner);

module.exports = router;
