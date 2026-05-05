const express = require('express');
const router = express.Router();
const {
  getRealTimePrice,
  getMultiplePrices,
  calculatePD,
  getScanners,
  createScanner,
  upsertScannerNote,
  getScannerNotes,
  analyzePair,
  deleteScanner
} = require('../controllers/scannerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/price/:pair(*)', protect, getRealTimePrice);
router.post('/prices', protect, getMultiplePrices);
router.post('/calculate-pd', protect, calculatePD);

router.route('/')
  .get(protect, getScanners)
  .post(protect, createScanner);

// Delete scanner record
router.delete('/:id', protect, deleteScanner);

// Scanner notes routes
router.get('/notes', protect, getScannerNotes);
router.patch('/notes', protect, upsertScannerNote);

// Auto scan analysis
router.post('/analyze', protect, analyzePair);

module.exports = router;
