const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTrades = async (req, res) => {
  try {
    const { startDate, endDate, pair } = req.query;
    
    let whereClause = { userId: req.user.id };

    if (pair) {
      whereClause.pair = pair;
    }

    if (startDate && endDate) {
      whereClause.openTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.openTime = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.openTime = {
        lte: new Date(endDate),
      };
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { openTime: 'desc' },
      include: { tradeRules: true }
    });

    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTradeById = async (req, res) => {
  try {
    const trade = await prisma.trade.findUnique({
      where: {
        id: req.params.id,
      },
      include: { tradeRules: true }
    });

    if (!trade || trade.userId !== req.user.id) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json(trade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTrade = async (req, res) => {
  const {
    openTime,
    exitTime,
    pair,
    direction,
    entryPrice,
    slPrice,
    tpPrice,
    exitPrice,
    pnl,
    strategy,
    screenshotUrl,
    notes,
    tags,
    isRuleViolated,
    ruleIds
  } = req.body;

  // ===== VALIDATION =====
  if (!openTime || !pair || !direction || !entryPrice || pnl === undefined || pnl === null) {
    return res.status(400).json({ 
      message: 'Required fields: openTime, pair, direction, entryPrice, pnl' 
    });
  }

  if (!['LONG', 'SHORT'].includes(direction)) {
    return res.status(400).json({ message: 'Direction must be LONG or SHORT' });
  }

  if (parseFloat(entryPrice) <= 0) {
    return res.status(400).json({ message: 'entryPrice must be positive number' });
  }

  if (isNaN(parseFloat(pnl))) {
    return res.status(400).json({ message: 'pnl must be a valid number' });
  }

  if (slPrice && parseFloat(slPrice) <= 0) {
    return res.status(400).json({ message: 'slPrice must be positive number' });
  }

  if (tpPrice && parseFloat(tpPrice) <= 0) {
    return res.status(400).json({ message: 'tpPrice must be positive number' });
  }

  if (exitPrice && parseFloat(exitPrice) <= 0) {
    return res.status(400).json({ message: 'exitPrice must be positive number' });
  }

  if (exitTime && new Date(exitTime) <= new Date(openTime)) {
    return res.status(400).json({ message: 'exitTime must be after openTime' });
  }

  const pnlPercent = parseFloat(entryPrice) > 0 ? (parseFloat(pnl) / parseFloat(entryPrice)) * 100 : 0;

  try {
    const trade = await prisma.trade.create({
      data: {
        userId: req.user.id,
        openTime: new Date(openTime),
        exitTime: exitTime ? new Date(exitTime) : null,
        pair,
        direction,
        entryPrice: parseFloat(entryPrice),
        slPrice: slPrice ? parseFloat(slPrice) : null,
        tpPrice: tpPrice ? parseFloat(tpPrice) : null,
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        pnl: parseFloat(pnl),
        pnlPercent,
        strategy: strategy || null,
        screenshotUrl: screenshotUrl || null,
        notes: notes || null,
        tags: tags || null,
        isRuleViolated: isRuleViolated || false,
      },
    });

    if (ruleIds && Array.isArray(ruleIds) && ruleIds.length > 0) {
      const tradeRulesData = ruleIds.map(ruleId => ({
        tradeId: trade.id,
        ruleId: ruleId,
      }));
      await prisma.tradeRule.createMany({ 
        data: tradeRulesData,
        skipDuplicates: true
      });
    }

    const tradeWithRules = await prisma.trade.findUnique({
      where: { id: trade.id },
      include: {
        tradeRules: {
          include: {
            rule: true,
          },
        },
      },
    });

    res.status(201).json(tradeWithRules);
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ 
      message: 'Failed to create trade', 
      error: error.message 
    });
  }
};

const updateTrade = async (req, res) => {
  try {
    const tradeId = req.params.id;
    
    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!existingTrade || existingTrade.userId !== req.user.id) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    const {
      openTime,
      exitTime,
      pair,
      direction,
      entryPrice,
      slPrice,
      tpPrice,
      exitPrice,
      pnl,
      strategy,
      screenshotUrl,
      notes,
      tags,
      isRuleViolated,
      ruleIds
    } = req.body;

    let pnlPercent = null;
    let newEntryPrice = entryPrice !== undefined ? parseFloat(entryPrice) : existingTrade.entryPrice;
    let newPnl = pnl !== undefined && pnl !== null ? parseFloat(pnl) : existingTrade.pnl;
    
    if (newEntryPrice > 0) {
      pnlPercent = (newPnl / newEntryPrice) * 100;
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        openTime: openTime ? new Date(openTime) : undefined,
        exitTime: exitTime !== undefined ? (exitTime ? new Date(exitTime) : null) : undefined,
        pair,
        direction,
        entryPrice: entryPrice !== undefined ? parseFloat(entryPrice) : undefined,
        slPrice: slPrice !== undefined ? (slPrice ? parseFloat(slPrice) : null) : undefined,
        tpPrice: tpPrice !== undefined ? (tpPrice ? parseFloat(tpPrice) : null) : undefined,
        exitPrice: exitPrice !== undefined ? (exitPrice ? parseFloat(exitPrice) : null) : undefined,
        pnl: pnl !== undefined && pnl !== null ? parseFloat(pnl) : undefined,
        pnlPercent,
        strategy: strategy !== undefined ? strategy : undefined,
        screenshotUrl,
        notes,
        tags,
        isRuleViolated: isRuleViolated !== undefined ? isRuleViolated : undefined,
      },
    });

    if (ruleIds !== undefined && Array.isArray(ruleIds)) {
      await prisma.tradeRule.deleteMany({ where: { tradeId } });
      if (ruleIds.length > 0) {
        const tradeRulesData = ruleIds.map(ruleId => ({ tradeId, ruleId }));
        await prisma.tradeRule.createMany({ 
          data: tradeRulesData,
          skipDuplicates: true
        });
      }
    }

    const updatedTradeWithRules = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        tradeRules: {
          include: {
            rule: true,
          },
        },
      },
    });

    res.json(updatedTradeWithRules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTrade = async (req, res) => {
  try {
    const tradeId = req.params.id;

    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!existingTrade || existingTrade.userId !== req.user.id) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    // Handle manual cascade deletion
    await prisma.tradeRule.deleteMany({ where: { tradeId } });

    await prisma.trade.delete({
      where: { id: tradeId },
    });

    res.json({ message: 'Trade removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
};
