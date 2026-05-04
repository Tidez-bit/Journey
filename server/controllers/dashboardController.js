const prisma = require('../lib/prisma');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxLossType: true, maxLossValue: true, scannerEnabled: true }
    });

    // ===== AGGREGATION QUERIES (efficient for large datasets) =====

    // Aggregate trade statistics
    const tradeAggregates = await prisma.trade.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { pnl: true },
      _max: { pnl: true },
      _min: { pnl: true },
    });

    // Count wins and losses
    const winCount = await prisma.trade.count({
      where: { userId, pnl: { gt: 0 } }
    });

    const lossCount = await prisma.trade.count({
      where: { userId, pnl: { lt: 0 } }
    });

    // Aggregate transactions
    const depositSum = await prisma.transaction.aggregate({
      where: { userId, type: 'DEPOSIT' },
      _sum: { amount: true }
    });

    const withdrawSum = await prisma.transaction.aggregate({
      where: { userId, type: 'WITHDRAW' },
      _sum: { amount: true }
    });

    // Get winning trades for average calculation
    const winningTrades = await prisma.trade.aggregate({
      where: { userId, pnl: { gt: 0 } },
      _sum: { pnl: true }
    });

    // Get losing trades for average calculation
    const losingTrades = await prisma.trade.aggregate({
      where: { userId, pnl: { lt: 0 } },
      _sum: { pnl: true }
    });

    // ===== CALCULATE BASIC STATS =====

    const totalTrades = tradeAggregates._count.id || 0;
    const totalPnL = tradeAggregates._sum.pnl || 0;
    const bestTrade = winCount > 0 ? (tradeAggregates._max.pnl || 0) : 0;
    const worstTrade = tradeAggregates._min.pnl || 0;

    const depositTotal = depositSum._sum.amount || 0;
    const withdrawTotal = withdrawSum._sum.amount || 0;
    const currentBalance = (depositTotal - withdrawTotal) + totalPnL;

    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    const sumWin = winningTrades._sum.pnl || 0;
    const sumLoss = Math.abs(losingTrades._sum.pnl || 0);

    const avgWin = winCount > 0 ? sumWin / winCount : 0;
    const avgLoss = lossCount > 0 ? sumLoss / lossCount : 0;
    const profitFactor = sumLoss > 0 ? sumWin / sumLoss : (sumWin > 0 ? sumWin : 0);

    // ===== WIN STREAK CALCULATION (need to fetch trades ordered) =====
    // Only fetch necessary fields for streak calculation
    const tradesForStreak = await prisma.trade.findMany({
      where: { userId },
      select: { pnl: true },
      orderBy: { openTime: 'desc' },
      take: 100 // Limit to last 100 trades for streak calculation
    });

    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let tempStreak = 0;

    // Calculate current streak from most recent trades
    for (let i = 0; i < tradesForStreak.length; i++) {
      if (tradesForStreak[i].pnl > 0) {
        tempStreak++;
        if (i === 0 || currentWinStreak > 0) {
          currentWinStreak = tempStreak;
        }
        if (tempStreak > maxWinStreak) {
          maxWinStreak = tempStreak;
        }
      } else {
        if (i === 0) currentWinStreak = 0;
        tempStreak = 0;
      }
    }

    // ===== RECENT TRADES (limited to 5) =====
    const recentTrades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { openTime: 'desc' },
      take: 5,
      include: { tradeRules: true }
    });

    // ===== EQUITY CURVE (limited to last 90 days or 500 events) =====
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentTradesForEquity = await prisma.trade.findMany({
      where: {
        userId,
        openTime: { gte: ninetyDaysAgo }
      },
      select: { openTime: true, pnl: true },
      orderBy: { openTime: 'asc' },
      take: 500
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: ninetyDaysAgo }
      },
      select: { date: true, type: true, amount: true },
      orderBy: { date: 'asc' },
      take: 500
    });

    // Get initial balance (before 90 days)
    const oldTradesSum = await prisma.trade.aggregate({
      where: { userId, openTime: { lt: ninetyDaysAgo } },
      _sum: { pnl: true }
    });

    const oldDeposits = await prisma.transaction.aggregate({
      where: { userId, type: 'DEPOSIT', date: { lt: ninetyDaysAgo } },
      _sum: { amount: true }
    });

    const oldWithdraws = await prisma.transaction.aggregate({
      where: { userId, type: 'WITHDRAW', date: { lt: ninetyDaysAgo } },
      _sum: { amount: true }
    });

    let initialBalance = 0;
    initialBalance += (oldDeposits._sum.amount || 0);
    initialBalance -= (oldWithdraws._sum.amount || 0);
    initialBalance += (oldTradesSum._sum.pnl || 0);

    // Build equity curve
    const allEvents = [
      ...recentTradesForEquity.map(t => ({
        date: new Date(t.openTime),
        type: 'TRADE',
        amount: t.pnl || 0
      })),
      ...recentTransactions.map(t => ({
        date: new Date(t.date),
        type: t.type,
        amount: t.amount
      }))
    ].sort((a, b) => a.date - b.date);

    let runningBalance = initialBalance;
    const equityCurveMap = {};

    allEvents.forEach(event => {
      if (event.type === 'DEPOSIT') runningBalance += event.amount;
      else if (event.type === 'WITHDRAW') runningBalance -= event.amount;
      else if (event.type === 'TRADE') runningBalance += event.amount;

      const dateStr = event.date.toISOString().split('T')[0];
      equityCurveMap[dateStr] = runningBalance;
    });

    const equityCurve = Object.keys(equityCurveMap).map(date => ({
      date,
      balance: equityCurveMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // ===== DAILY PNL (last 30 days) =====
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrades = await prisma.trade.findMany({
      where: {
        userId,
        openTime: { gte: thirtyDaysAgo }
      },
      select: { openTime: true, pnl: true },
      orderBy: { openTime: 'asc' }
    });

    const dailyPnLMap = {};
    dailyTrades.forEach(t => {
      const dayStr = new Date(t.openTime).toISOString().split('T')[0];
      if (!dailyPnLMap[dayStr]) {
        dailyPnLMap[dayStr] = 0;
      }
      dailyPnLMap[dayStr] += (t.pnl || 0);
    });

    const dailyPnL = Object.keys(dailyPnLMap).map(date => ({
      date,
      pnl: dailyPnLMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // ===== TODAY'S LOSS =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLosses = await prisma.trade.aggregate({
      where: {
        userId,
        openTime: { gte: today },
        pnl: { lt: 0 }
      },
      _sum: { pnl: true }
    });

    const todayLoss = Math.abs(todayLosses._sum.pnl || 0);

    res.json({
      totalPnL,
      winRate,
      totalTrades,
      bestTrade,
      worstTrade,
      winStreak: currentWinStreak,
      maxWinStreak,
      currentBalance,
      avgWin,
      avgLoss,
      profitFactor,
      equityCurve,
      recentTrades,
      dailyPnL,
      maxLossUsed: todayLoss,
      maxLossType: user.maxLossType,
      maxLossValue: user.maxLossValue,
      scannerEnabled: user.scannerEnabled
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
