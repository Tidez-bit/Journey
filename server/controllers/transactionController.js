const prisma = require('../lib/prisma');

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Validate pagination params
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        message: 'Invalid pagination params. Page must be >= 1, limit between 1-100' 
      });
    }
    
    const whereClause = { userId: req.user.id };
    
    // Get total count for pagination
    const total = await prisma.transaction.count({ where: whereClause });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;
    
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      skip,
      take: limitNum,
    });
    
    res.json({
      data: transactions,
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

const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, note, date } = req.body;

    if (!type || !amount || !date) {
      const err = new Error('Please provide type, amount, and date');
      err.statusCode = 400;
      return next(err);
    }

    if (type !== 'DEPOSIT' && type !== 'WITHDRAW') {
      const err = new Error('Type must be DEPOSIT or WITHDRAW');
      err.statusCode = 400;
      return next(err);
    }

    if (amount <= 0) {
      const err = new Error('Amount must be greater than 0');
      err.statusCode = 400;
      return next(err);
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        type,
        amount: parseFloat(amount),
        note,
        date: new Date(date),
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, type, note, date } = req.body;

    // Pastikan transaksi milik user ini
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      const err = new Error('Transaction not found');
      err.statusCode = 404;
      return next(err);
    }

    // Validasi type jika diubah
    if (type && type !== 'DEPOSIT' && type !== 'WITHDRAW') {
      const err = new Error('Type must be DEPOSIT or WITHDRAW');
      err.statusCode = 400;
      return next(err);
    }

    // Validasi amount jika diubah
    if (amount !== undefined && amount <= 0) {
      const err = new Error('Amount must be greater than 0');
      err.statusCode = 400;
      return next(err);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(note !== undefined && { note }),
        ...(date && { date: new Date(date) }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Pastikan transaksi milik user ini
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      const err = new Error('Transaction not found');
      err.statusCode = 404;
      return next(err);
    }

    await prisma.transaction.delete({ where: { id } });

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
