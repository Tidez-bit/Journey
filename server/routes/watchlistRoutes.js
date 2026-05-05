const express = require('express');
const router = express.Router();
const { getWatchlist, addWatchlistItem, deleteWatchlistItem } = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWatchlist);
router.post('/', protect, addWatchlistItem);
router.delete('/:pair', protect, deleteWatchlistItem);

module.exports = router;
