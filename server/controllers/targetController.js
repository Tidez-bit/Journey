const prisma = require('../lib/prisma');

const getTargets = async (req, res) => {
  try {
    const targets = await prisma.target.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        dailyTargetLogs: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });
    res.json(targets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTarget = async (req, res) => {
  try {
    const { type, name, startBalance, targetBalance, dailyPercent, deadline } = req.body;
    
    const target = await prisma.target.create({
      data: {
        userId: req.user.id,
        type,
        name,
        startBalance: parseFloat(startBalance),
        targetBalance: parseFloat(targetBalance),
        dailyPercent: dailyPercent ? parseFloat(dailyPercent) : null,
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    res.status(201).json(target);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startBalance, targetBalance, dailyPercent, deadline, isActive } = req.body;

    const existingTarget = await prisma.target.findUnique({ where: { id } });
    if (!existingTarget || existingTarget.userId !== req.user.id) {
      return res.status(404).json({ message: 'Target not found' });
    }

    const updatedTarget = await prisma.target.update({
      where: { id },
      data: {
        name,
        startBalance: startBalance !== undefined ? parseFloat(startBalance) : undefined,
        targetBalance: targetBalance !== undefined ? parseFloat(targetBalance) : undefined,
        dailyPercent: dailyPercent !== undefined ? parseFloat(dailyPercent) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });

    res.json(updatedTarget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingTarget = await prisma.target.findUnique({ where: { id } });
    if (!existingTarget || existingTarget.userId !== req.user.id) {
      return res.status(404).json({ message: 'Target not found' });
    }

    await prisma.dailyTargetLog.deleteMany({
      where: { targetId: id }
    });

    await prisma.target.delete({ where: { id } });

    res.json({ message: 'Target deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDailyLogs = async (req, res) => {
  try {
    const { startDate, endDate, targetId } = req.query;
    
    let whereClause = { userId: req.user.id };
    
    if (targetId) {
      whereClause.targetId = targetId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const logs = await prisma.dailyTargetLog.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDailyLog = async (req, res) => {
  try {
    const { targetId, date } = req.body;

    const target = await prisma.target.findUnique({ where: { id: targetId } });
    if (!target || target.userId !== req.user.id) {
      return res.status(404).json({ message: 'Target not found' });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user.id,
        openTime: { gte: dateObj, lt: nextDay }
      }
    });

    const actualPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const prevTrades = await prisma.trade.findMany({
      where: { userId: req.user.id, openTime: { lt: dateObj } }
    });
    const prevTx = await prisma.transaction.findMany({
      where: { userId: req.user.id, date: { lt: dateObj } }
    });

    let balanceStart = 0;
    prevTx.forEach(t => {
      if (t.type === 'DEPOSIT') balanceStart += t.amount;
      if (t.type === 'WITHDRAW') balanceStart -= t.amount;
    });
    prevTrades.forEach(t => balanceStart += (t.pnl || 0));

    if (balanceStart === 0 && target.startBalance) {
      balanceStart = target.startBalance;
    }

    const dailyPercent = target.dailyPercent || 0;
    const targetAmount = balanceStart * (dailyPercent / 100);
    const isAchieved = actualPnl >= targetAmount;

    const log = await prisma.dailyTargetLog.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: dateObj
        }
      },
      update: {
        balanceStart,
        targetAmount,
        actualPnl,
        isAchieved
      },
      create: {
        userId: req.user.id,
        targetId,
        date: dateObj,
        balanceStart,
        targetAmount,
        actualPnl,
        isAchieved
      }
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjection = async (req, res) => {
  try {
    const { startBalance, dailyPercent, days } = req.query;
    
    if (!startBalance || !dailyPercent || !days) {
      return res.status(400).json({ message: 'Please provide startBalance, dailyPercent, and days' });
    }

    let currentBalance = parseFloat(startBalance);
    const percent = parseFloat(dailyPercent) / 100;
    const numDays = parseInt(days, 10);
    
    const projection = [];
    
    for (let i = 1; i <= numDays; i++) {
      const dailyTarget = currentBalance * percent;
      currentBalance += dailyTarget;
      
      projection.push({
        day: i,
        targetPnl: dailyTarget,
        accumulatedBalance: currentBalance
      });
    }

    res.json({
      startBalance: parseFloat(startBalance),
      endBalance: currentBalance,
      projection
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  getDailyLogs,
  createDailyLog,
  getProjection
};
