const express = require('express');
const router = express.Router();
const {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getRuleStats,
  attachRuleToTrade,
  removeRuleFromTrade
} = require('../controllers/ruleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getRuleStats);

router.route('/trade-rules')
  .post(protect, attachRuleToTrade);
  
router.route('/trade-rules/:id')
  .delete(protect, removeRuleFromTrade);

router.route('/')
  .get(protect, getRules)
  .post(protect, createRule);

router.route('/:id')
  .put(protect, updateRule)
  .delete(protect, deleteRule);

module.exports = router;
