const prisma = require('../lib/prisma');

const getTrades = async (req, res, next) => {
  try {
    const { startDate, endDate, pair, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Validate pagination params
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        message: 'Invalid pagination params. Page must be >= 1, limit between 1-100' 
      });
    }
    
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

    // Get total count for pagination
    const total = await prisma.trade.count({ where: whereClause });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { openTime: 'desc' },
      include: { traderule: true },
      skip,
      take: limitNum,
    });

    res.json({
      data: trades,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTradeById = async (req, res, next) => {
  try {
    const trade = await prisma.trade.findUnique({
      where: {
        id: req.params.id,
      },
      include: { traderule: true }
    });

    if (!trade || trade.userId !== req.user.id) {
      const err = new Error('Trade not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json(trade);
  } catch (error) {
    next(error);
  }
};

const createTrade = async (req, res, next) => {
  const {
    openTime,
    exitTime,
    pair,
    direction,
    entryPrice,
    slPrice,
    tpPrice,
    exitPrice,
    positionSize,
    margin,
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

  // Calculate pnlPercent based on margin if available, otherwise based on position value
  let pnlPercent = 0;
  if (margin && parseFloat(margin) > 0) {
    // Best practice: pnl% = (pnl / margin) * 100
    pnlPercent = (parseFloat(pnl) / parseFloat(margin)) * 100;
  } else if (positionSize && parseFloat(positionSize) > 0 && parseFloat(entryPrice) > 0) {
    // Fallback: pnl% = (pnl / position value) * 100
    const positionValue = parseFloat(positionSize) * parseFloat(entryPrice);
    pnlPercent = positionValue > 0 ? (parseFloat(pnl) / positionValue) * 100 : 0;
  } else {
    // Last resort: if no margin/position data, use pnl as-is (user should provide margin)
    pnlPercent = 0;
  }

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
        positionSize: positionSize ? parseFloat(positionSize) : null,
        margin: margin ? parseFloat(margin) : null,
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
      await prisma.traderule.createMany({ 
        data: tradeRulesData,
        skipDuplicates: true
      });
    }

    const tradeWithRules = await prisma.trade.findUnique({
      where: { id: trade.id },
      include: {
        traderule: {
          include: {
            rule: true,
          },
        },
      },
    });

    res.status(201).json(tradeWithRules);
  } catch (error) {
    next(error);
  }
};

const updateTrade = async (req, res, next) => {
  try {
    const tradeId = req.params.id;
    
    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!existingTrade || existingTrade.userId !== req.user.id) {
      const err = new Error('Trade not found');
      err.statusCode = 404;
      return next(err);
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
      positionSize,
      margin,
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
    let newMargin = margin !== undefined ? (margin ? parseFloat(margin) : null) : existingTrade.margin;
    let newPositionSize = positionSize !== undefined ? (positionSize ? parseFloat(positionSize) : null) : existingTrade.positionSize;
    
    // Calculate pnlPercent based on margin if available
    if (newMargin && newMargin > 0) {
      pnlPercent = (newPnl / newMargin) * 100;
    } else if (newPositionSize && newPositionSize > 0 && newEntryPrice > 0) {
      const positionValue = newPositionSize * newEntryPrice;
      pnlPercent = positionValue > 0 ? (newPnl / positionValue) * 100 : 0;
    } else {
      pnlPercent = existingTrade.pnlPercent ?? 0;
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
        positionSize: positionSize !== undefined ? (positionSize ? parseFloat(positionSize) : null) : undefined,
        margin: margin !== undefined ? (margin ? parseFloat(margin) : null) : undefined,
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
      await prisma.traderule.deleteMany({ where: { tradeId } });
      if (ruleIds.length > 0) {
        const tradeRulesData = ruleIds.map(ruleId => ({ tradeId, ruleId }));
        await prisma.traderule.createMany({ 
          data: tradeRulesData,
          skipDuplicates: true
        });
      }
    }

    const updatedTradeWithRules = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        traderule: {
          include: {
            rule: true,
          },
        },
      },
    });

    res.json(updatedTradeWithRules);
  } catch (error) {
    next(error);
  }
};

const deleteTrade = async (req, res, next) => {
  try {
    const tradeId = req.params.id;

    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!existingTrade || existingTrade.userId !== req.user.id) {
      const err = new Error('Trade not found');
      err.statusCode = 404;
      return next(err);
    }
    
    // Handle manual cascade deletion
    await prisma.traderule.deleteMany({ where: { tradeId } });

    await prisma.trade.delete({
      where: { id: tradeId },
    });

    res.json({ message: 'Trade removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
};
