const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRules = async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRule = async (req, res) => {
  try {
    const { title, description, category, isActive } = req.body;
    
    const rule = await prisma.rule.create({
      data: {
        userId: req.user.id,
        title,
        description,
        category,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, isActive } = req.body;

    const rule = await prisma.rule.findUnique({ where: { id } });
    if (!rule || rule.userId !== req.user.id) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    const updatedRule = await prisma.rule.update({
      where: { id },
      data: { title, description, category, isActive }
    });

    res.json(updatedRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await prisma.rule.findUnique({ where: { id } });
    if (!rule || rule.userId !== req.user.id) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    // Delete related TradeRules first
    await prisma.tradeRule.deleteMany({
      where: { ruleId: id }
    });

    await prisma.rule.delete({ where: { id } });

    res.json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const attachRuleToTrade = async (req, res) => {
  try {
    const { tradeId, ruleId } = req.body;

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });

    if (!trade || trade.userId !== req.user.id || !rule || rule.userId !== req.user.id) {
      return res.status(404).json({ message: 'Trade or Rule not found' });
    }

    const tradeRule = await prisma.tradeRule.create({
      data: { tradeId, ruleId }
    });

    // Mark trade as violated
    await prisma.trade.update({
      where: { id: tradeId },
      data: { isRuleViolated: true }
    });

    res.status(201).json(tradeRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeRuleFromTrade = async (req, res) => {
  try {
    const { id } = req.params; // TradeRule ID

    const tradeRule = await prisma.tradeRule.findUnique({
      where: { id },
      include: { trade: true }
    });

    if (!tradeRule || tradeRule.trade.userId !== req.user.id) {
      return res.status(404).json({ message: 'TradeRule not found' });
    }

    await prisma.tradeRule.delete({ where: { id } });

    // Check if trade still has other violations, if not set isRuleViolated to false
    const remainingRules = await prisma.tradeRule.count({
      where: { tradeId: tradeRule.tradeId }
    });

    if (remainingRules === 0) {
      await prisma.trade.update({
        where: { id: tradeRule.tradeId },
        data: { isRuleViolated: false }
      });
    }

    res.json({ message: 'Rule removed from trade' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRuleStats = async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { tradeRules: true }
        }
      }
    });

    const totalTrades = await prisma.trade.count({
      where: { userId: req.user.id }
    });

    const tradesWithViolation = await prisma.trade.count({
      where: { userId: req.user.id, isRuleViolated: true }
    });

    const complianceRate = totalTrades === 0 ? 100 : ((totalTrades - tradesWithViolation) / totalTrades) * 100;
    const violationRate = totalTrades === 0 ? 0 : (tradesWithViolation / totalTrades) * 100;

    const statsPerRule = rules.map(rule => {
      const violations = rule._count.tradeRules;
      const rate = totalTrades === 0 ? 0 : (violations / totalTrades) * 100;
      return {
        id: rule.id,
        title: rule.title,
        category: rule.category,
        violations,
        violationRate: rate
      };
    }).sort((a, b) => b.violations - a.violations);

    res.json({
      totalTrades,
      tradesWithViolation,
      complianceRate,
      violationRate,
      rules: statsPerRule
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  attachRuleToTrade,
  removeRuleFromTrade,
  getRuleStats
};
