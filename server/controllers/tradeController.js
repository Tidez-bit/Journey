const prisma = require('../lib/prisma');

const getTrades = async (req, res, next) => {
  try {
    const { startDate, endDate, pair, status, page = 1, limit = 20 } = req.query;
    
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

    if (status && ['RUNNING', 'CLOSED'].includes(status)) {
      whereClause.status = status;
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
      include: { 
        traderule: true,
        partialclose: {
          orderBy: { closeTime: 'asc' }
        }
      },
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
      include: { 
        traderule: true,
        partialclose: {
          orderBy: { closeTime: 'asc' }
        }
      }
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
    ruleIds,
    status
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

  if (status && !['RUNNING', 'CLOSED'].includes(status)) {
    return res.status(400).json({ message: 'Status must be RUNNING or CLOSED' });
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
        status: status || 'CLOSED',
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
        partialclose: {
          orderBy: { closeTime: 'asc' }
        }
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
      ruleIds,
      status
    } = req.body;

    // Validate status if provided
    if (status && !['RUNNING', 'CLOSED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be RUNNING or CLOSED' });
    }

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
        status: status !== undefined ? status : undefined,
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
        partialclose: {
          orderBy: { closeTime: 'asc' }
        }
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

// ===== PARTIAL CLOSE ENDPOINTS =====

const createPartialClose = async (req, res, next) => {
  try {
    const { id: tradeId } = req.params;
    const { closeTime, closePrice, closedSize, pnl, notes } = req.body;

    // Validate required fields
    if (!closeTime || !closePrice || !closedSize || pnl === undefined || pnl === null) {
      return res.status(400).json({
        message: 'Required fields: closeTime, closePrice, closedSize, pnl'
      });
    }

    // Validate trade exists and belongs to user
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    if (!trade || trade.userId !== req.user.id) {
      const err = new Error('Trade not found');
      err.statusCode = 404;
      return next(err);
    }

    // Validate numeric values
    if (parseFloat(closePrice) <= 0) {
      return res.status(400).json({ message: 'closePrice must be positive' });
    }

    if (parseFloat(closedSize) <= 0) {
      return res.status(400).json({ message: 'closedSize must be positive' });
    }

    if (isNaN(parseFloat(pnl))) {
      return res.status(400).json({ message: 'pnl must be a valid number' });
    }

    // Create partial close
    const partialClose = await prisma.partialclose.create({
      data: {
        tradeId,
        closeTime: new Date(closeTime),
        closePrice: parseFloat(closePrice),
        closedSize: parseFloat(closedSize),
        pnl: parseFloat(pnl),
        notes: notes || null
      }
    });

    res.status(201).json(partialClose);
  } catch (error) {
    next(error);
  }
};

const getPartialCloses = async (req, res, next) => {
  try {
    const { id: tradeId } = req.params;

    // Validate trade exists and belongs to user
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    if (!trade || trade.userId !== req.user.id) {
      const err = new Error('Trade not found');
      err.statusCode = 404;
      return next(err);
    }

    const partialCloses = await prisma.partialclose.findMany({
      where: { tradeId },
      orderBy: { closeTime: 'asc' }
    });

    res.json(partialCloses);
  } catch (error) {
    next(error);
  }
};

const deletePartialClose = async (req, res, next) => {
  try {
    const { id: tradeId, partialId } = req.params;

    // Validate trade exists and belongs to user
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    if (!trade || trade.userId !== req.user.id) {
      const err = new Error('Trade not found');
      err.statusCode = 404;
      return next(err);
    }

    // Validate partial close exists
    const partialClose = await prisma.partialclose.findUnique({
      where: { id: partialId }
    });

    if (!partialClose || partialClose.tradeId !== tradeId) {
      const err = new Error('Partial close not found');
      err.statusCode = 404;
      return next(err);
    }

    await prisma.partialclose.delete({
      where: { id: partialId }
    });

    res.json({ message: 'Partial close removed' });
  } catch (error) {
    next(error);
  }
};

// ===== ANALYTICS ENDPOINT =====

const getTradeAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    let whereClause = { 
      userId,
      status: 'CLOSED' // Only analyze closed trades
    };

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

    // Get all closed trades for calculations
    const trades = await prisma.trade.findMany({
      where: whereClause,
      select: {
        id: true,
        pair: true,
        strategy: true,
        pnl: true,
        openTime: true
      }
    });

    // Calculate basic metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const totalGrossWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalGrossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalGrossLoss > 0 ? totalGrossWin / totalGrossLoss : totalGrossWin > 0 ? Infinity : 0;

    const avgWin = winningTrades.length > 0 ? totalGrossWin / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0;

    // Count running vs closed trades
    const runningCount = await prisma.trade.count({
      where: { userId, status: 'RUNNING' }
    });
    const closedCount = totalTrades;

    // PnL per pair
    const pnlByPair = {};
    trades.forEach(trade => {
      if (!pnlByPair[trade.pair]) {
        pnlByPair[trade.pair] = 0;
      }
      pnlByPair[trade.pair] += trade.pnl;
    });

    const pnlPerPair = Object.entries(pnlByPair).map(([pair, pnl]) => ({
      pair,
      pnl: Math.round(pnl * 100) / 100
    })).sort((a, b) => b.pnl - a.pnl);

    // Win rate per strategy
    const strategyStats = {};
    trades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { total: 0, wins: 0 };
      }
      strategyStats[strategy].total++;
      if (trade.pnl > 0) {
        strategyStats[strategy].wins++;
      }
    });

    const winRatePerStrategy = Object.entries(strategyStats).map(([strategy, stats]) => ({
      strategy,
      winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100 * 100) / 100 : 0,
      totalTrades: stats.total
    })).sort((a, b) => b.winRate - a.winRate);

    // Trade distribution per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrades = trades.filter(t => new Date(t.openTime) >= thirtyDaysAgo);
    const tradesByDate = {};
    
    recentTrades.forEach(trade => {
      const dateKey = new Date(trade.openTime).toISOString().split('T')[0];
      tradesByDate[dateKey] = (tradesByDate[dateKey] || 0) + 1;
    });

    const tradeDistribution = Object.entries(tradesByDate).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      metrics: {
        totalTrades,
        winRate: Math.round(winRate * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        runningTrades: runningCount,
        closedTrades: closedCount
      },
      pnlPerPair,
      winRatePerStrategy,
      tradeDistribution
    });
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
  createPartialClose,
  getPartialCloses,
  deletePartialClose,
  getTradeAnalytics,
};
