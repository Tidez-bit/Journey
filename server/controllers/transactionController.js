const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { type, amount, note, date } = req.body;

    if (!type || !amount || !date) {
      return res.status(400).json({ message: 'Please provide type, amount, and date' });
    }

    if (type !== 'DEPOSIT' && type !== 'WITHDRAW') {
      return res.status(400).json({ message: 'Type must be DEPOSIT or WITHDRAW' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
};
