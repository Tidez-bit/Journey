const express = require('express');
const router = express.Router();
const {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
} = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTrades)
  .post(protect, createTrade);

router.route('/:id')
  .get(protect, getTradeById)
  .put(protect, updateTrade)
  .delete(protect, deleteTrade);

module.exports = router;
