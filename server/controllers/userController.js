const prisma = require('../lib/prisma');

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

module.exports = {
  getSettings,
  updateSettings
};
