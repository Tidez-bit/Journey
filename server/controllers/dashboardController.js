const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxLossType: true, maxLossValue: true, scannerEnabled: true }
    });

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { openTime: 'asc' },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    let depositTotal = 0;
    let withdrawTotal = 0;

    transactions.forEach(t => {
      if (t.type === 'DEPOSIT') depositTotal += t.amount;
      if (t.type === 'WITHDRAW') withdrawTotal += t.amount;
    });

    let totalPnL = 0;
    let winCount = 0;
    let lossCount = 0;
    let bestTrade = 0;
    let worstTrade = 0;
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let sumWin = 0;
    let sumLoss = 0;
    
    const dailyPnLMap = {};

    const allEvents = [
      ...trades.map(t => ({ date: new Date(t.openTime), type: 'TRADE', amount: t.pnl || 0 })),
      ...transactions.map(t => ({ date: new Date(t.date), type: t.type, amount: t.amount }))
    ].sort((a, b) => a.date - b.date);

    let runningBalance = 0;
    const equityCurveMap = {};

    allEvents.forEach(event => {
      if (event.type === 'DEPOSIT') runningBalance += event.amount;
      else if (event.type === 'WITHDRAW') runningBalance -= event.amount;
      else if (event.type === 'TRADE') runningBalance += event.amount;

      const dateStr = event.date.toISOString().split('T')[0];
      // Keep the latest balance for the day
      equityCurveMap[dateStr] = runningBalance;
    });

    const equityCurve = Object.keys(equityCurveMap).map(date => ({
      date,
      balance: equityCurveMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    trades.forEach(t => {
      const pnl = t.pnl || 0;
      totalPnL += pnl;

      if (pnl > 0) {
        winCount++;
        sumWin += pnl;
        currentWinStreak++;
        if (currentWinStreak > maxWinStreak) {
          maxWinStreak = currentWinStreak;
        }
      } else if (pnl < 0) {
        lossCount++;
        sumLoss += Math.abs(pnl);
        currentWinStreak = 0;
      } else {
        currentWinStreak = 0;
      }

      if (pnl > bestTrade) bestTrade = pnl;
      if (pnl < worstTrade) worstTrade = pnl;

      const dayStr = new Date(t.openTime).toISOString().split('T')[0];
      if (!dailyPnLMap[dayStr]) {
        dailyPnLMap[dayStr] = 0;
      }
      dailyPnLMap[dayStr] += pnl;
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const currentBalance = (depositTotal - withdrawTotal) + totalPnL;
    
    const avgWin = winCount > 0 ? sumWin / winCount : 0;
    const avgLoss = lossCount > 0 ? sumLoss / lossCount : 0;
    const profitFactor = sumLoss > 0 ? sumWin / sumLoss : (sumWin > 0 ? sumWin : 0);

    const recentTrades = [...trades].reverse().slice(0, 5);

    const dailyPnL = Object.keys(dailyPnLMap).map(date => ({
      date,
      pnl: dailyPnLMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate today's loss
    const today = new Date();
    today.setHours(0,0,0,0);
    let todayLoss = 0;
    
    trades.forEach(t => {
      if (new Date(t.openTime) >= today && t.pnl < 0) {
        todayLoss += Math.abs(t.pnl);
      }
    });

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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats
};
