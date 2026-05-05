const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

const getSettings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        scannerEnabled: true,
        maxLossType: true,
        maxLossValue: true,
        maxLossResetDate: true
      }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { scannerEnabled, maxLossType, maxLossValue, maxLossResetDate } = req.body;
    
    const updateData = {};
    if (scannerEnabled !== undefined) updateData.scannerEnabled = scannerEnabled;
    if (maxLossType !== undefined) updateData.maxLossType = maxLossType;
    if (maxLossValue !== undefined) updateData.maxLossValue = parseFloat(maxLossValue);
    if (maxLossResetDate !== undefined) updateData.maxLossResetDate = maxLossResetDate ? new Date(maxLossResetDate) : null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        scannerEnabled: true,
        maxLossType: true,
        maxLossValue: true,
        maxLossResetDate: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            trades: true,
            transactions: true,
          }
        }
      }
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      totalTrades: user._count.trades,
      totalTransactions: user._count.transactions,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      const err = new Error('Please provide name or email to update');
      err.statusCode = 400;
      return next(err);
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email already exists for another user
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== req.user.id) {
        const err = new Error('Email already in use');
        err.statusCode = 400;
        return next(err);
      }

      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      const err = new Error('Please provide old password and new password');
      err.statusCode = 400;
      return next(err);
    }

    if (newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters');
      err.statusCode = 400;
      return next(err);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      const err = new Error('Old password is incorrect');
      err.statusCode = 400;
      return next(err);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  updatePassword,
};
