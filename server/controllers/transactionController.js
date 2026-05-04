const prisma = require('../lib/prisma');

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
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
