const express = require('express');
const router = express.Router();
const {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
  createPartialClose,
  getPartialCloses,
  deletePartialClose,
  getTradeAnalytics,
} = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTrades)
  .post(protect, createTrade);

router.route('/analytics')
  .get(protect, getTradeAnalytics);

router.route('/:id')
  .get(protect, getTradeById)
  .put(protect, updateTrade)
  .delete(protect, deleteTrade);

router.route('/:id/partial-close')
  .post(protect, createPartialClose)
  .get(protect, getPartialCloses);

router.route('/:id/partial-close/:partialId')
  .delete(protect, deletePartialClose);

module.exports = router;
