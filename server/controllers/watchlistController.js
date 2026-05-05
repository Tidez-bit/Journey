const prisma = require('../lib/prisma');

const getWatchlist = async (req, res, next) => {
  try {
    const watchlist = await prisma.watchlistitem.findMany({
      where: { userId: req.user.id },
      orderBy: { order: 'asc' },
    });
    res.json(watchlist);
  } catch (error) {
    next(error);
  }
};

const addWatchlistItem = async (req, res, next) => {
  try {
    const { pair } = req.body;

    if (!pair) {
      const err = new Error('Pair is required');
      err.statusCode = 400;
      return next(err);
    }

    const existing = await prisma.watchlistitem.findUnique({
      where: {
        userId_pair: {
          userId: req.user.id,
          pair,
        },
      },
    });

    if (existing) {
      const err = new Error('Pair already in watchlist');
      err.statusCode = 400;
      return next(err);
    }

    const maxOrderItem = await prisma.watchlistitem.findFirst({
      where: { userId: req.user.id },
      orderBy: { order: 'desc' },
    });

    const newOrder = maxOrderItem ? maxOrderItem.order + 1 : 0;

    const watchlistItem = await prisma.watchlistitem.create({
      data: {
        userId: req.user.id,
        pair,
        order: newOrder,
      },
    });

    res.status(201).json(watchlistItem);
  } catch (error) {
    next(error);
  }
};

const deleteWatchlistItem = async (req, res, next) => {
  try {
    const { pair } = req.params;

    const existing = await prisma.watchlistitem.findUnique({
      where: {
        userId_pair: {
          userId: req.user.id,
          pair,
        },
      },
    });

    if (!existing) {
      const err = new Error('Watchlist item not found');
      err.statusCode = 404;
      return next(err);
    }

    await prisma.watchlistitem.delete({
      where: {
        userId_pair: {
          userId: req.user.id,
          pair,
        },
      },
    });

    res.json({ message: 'Watchlist item removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  addWatchlistItem,
  deleteWatchlistItem,
};