const express = require('express');
const router = express.Router();
const {
  getTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  getDailyLogs,
  createDailyLog,
  getProjection
} = require('../controllers/targetController');
const { protect } = require('../middleware/authMiddleware');

router.get('/projection', protect, getProjection);

router.route('/daily-logs')
  .get(protect, getDailyLogs)
  .post(protect, createDailyLog);

router.route('/')
  .get(protect, getTargets)
  .post(protect, createTarget);

router.route('/:id')
  .put(protect, updateTarget)
  .delete(protect, deleteTarget);

module.exports = router;
