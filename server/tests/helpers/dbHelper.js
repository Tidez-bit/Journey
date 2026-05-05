const prisma = require('../../lib/prisma');

/**
 * Clear all test data from database
 */
async function clearDatabase() {
  // Delete in order to respect foreign key constraints
  await prisma.dailyLog.deleteMany({});
  await prisma.scanner.deleteMany({});
  await prisma.rule.deleteMany({});
  await prisma.target.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Clear data for specific user
 */
async function clearUserData(userId) {
  await prisma.dailyLog.deleteMany({ where: { userId } });
  await prisma.scanner.deleteMany({ where: { userId } });
  await prisma.rule.deleteMany({ where: { userId } });
  await prisma.target.deleteMany({ where: { userId } });
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.trade.deleteMany({ where: { userId } });
}

/**
 * Seed test trades for a user
 */
async function seedTrades(userId, trades) {
  const createdTrades = [];
  
  for (const trade of trades) {
    const created = await prisma.trade.create({
      data: {
        userId,
        openTime: trade.openTime || new Date(),
        closeTime: trade.closeTime || new Date(),
        pair: trade.pair || 'BTCUSDT',
        direction: trade.direction || 'LONG',
        entryPrice: trade.entryPrice || 50000,
        exitPrice: trade.exitPrice || 51000,
        positionSize: trade.positionSize || 0.1,
        margin: trade.margin || 1000,
        pnl: trade.pnl || 100,
        pnlPercent: trade.pnlPercent || 10,
        slPrice: trade.slPrice,
        tpPrice: trade.tpPrice,
        notes: trade.notes,
        screenshotUrl: trade.screenshotUrl
      }
    });
    createdTrades.push(created);
  }
  
  return createdTrades;
}

/**
 * Seed test transactions for a user
 */
async function seedTransactions(userId, transactions) {
  const createdTransactions = [];
  
  for (const transaction of transactions) {
    const created = await prisma.transaction.create({
      data: {
        userId,
        type: transaction.type || 'DEPOSIT',
        amount: transaction.amount || 1000,
        date: transaction.date || new Date(),
        notes: transaction.notes
      }
    });
    createdTransactions.push(created);
  }
  
  return createdTransactions;
}

/**
 * Seed test target for a user
 */
async function seedTarget(userId, targetData = {}) {
  return await prisma.target.create({
    data: {
      userId,
      name: targetData.name || 'Test Target',
      dailyPercent: targetData.dailyPercent || 2,
      weeklyPercent: targetData.weeklyPercent || 10,
      monthlyPercent: targetData.monthlyPercent || 40,
      startDate: targetData.startDate || new Date(),
      endDate: targetData.endDate,
      initialBalance: targetData.initialBalance || 10000,
      isActive: targetData.isActive !== undefined ? targetData.isActive : true
    }
  });
}

/**
 * Disconnect Prisma client
 */
async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  clearDatabase,
  clearUserData,
  seedTrades,
  seedTransactions,
  seedTarget,
  disconnectDatabase
};
