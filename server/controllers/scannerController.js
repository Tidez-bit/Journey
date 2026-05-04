const prisma = require('../lib/prisma');
const priceService = require('../services/priceService');
const { calculatePDArray } = require('../helpers/smcCalculator');

const getRealTimePrice = (req, res) => {
  const { pair } = req.params;
  const data = priceService.getPrice(pair);
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ message: 'Price not available yet' });
  }
};

const getMultiplePrices = (req, res) => {
  const { pairs } = req.body;
  if (!Array.isArray(pairs)) {
    return res.status(400).json({ message: 'Pairs must be an array' });
  }
  const data = priceService.getMultiplePrices(pairs);
  res.json(data);
};

const calculatePD = (req, res) => {
  const { high, low, currentPrice } = req.body;
  const result = calculatePDArray(parseFloat(high), parseFloat(low), parseFloat(currentPrice));
  res.json(result);
};

// CRUD for Scanner
const getScanners = async (req, res) => {
  try {
    const { date, timeframe } = req.query;
    let whereClause = { userId: req.user.id };
    
    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0,0,0,0);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.date = {
        gte: dateObj,
        lt: nextDay
      };
    }
    
    if (timeframe) {
      whereClause.timeframe = timeframe;
    }

    const scanners = await prisma.scanner.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(scanners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createScanner = async (req, res) => {
  try {
    const {
      date, pair, timeframe, currentPrice, lastHigh, lastLow, pdArray, pdPercent,
      liquidityAbove, liquidityBelow, liquiditySide, obBullish, obBearish, obSide,
      trend, structure, volume, volumeRatio, bias, confidence, notes
    } = req.body;

    const dateObj = new Date(date);
    dateObj.setHours(0,0,0,0);

    const scanner = await prisma.scanner.upsert({
      where: {
        userId_date_pair_timeframe: {
          userId: req.user.id,
          date: dateObj,
          pair,
          timeframe
        }
      },
      update: {
        currentPrice: parseFloat(currentPrice),
        lastHigh: parseFloat(lastHigh),
        lastLow: parseFloat(lastLow),
        pdArray,
        pdPercent: parseFloat(pdPercent),
        liquidityAbove: liquidityAbove ? parseFloat(liquidityAbove) : null,
        liquidityBelow: liquidityBelow ? parseFloat(liquidityBelow) : null,
        liquiditySide,
        obBullish,
        obBearish,
        obSide,
        trend,
        structure,
        volume,
        volumeRatio: volumeRatio ? parseFloat(volumeRatio) : null,
        bias,
        confidence: confidence ? parseInt(confidence) : null,
        notes
      },
      create: {
        userId: req.user.id,
        date: dateObj,
        pair,
        timeframe,
        currentPrice: parseFloat(currentPrice),
        lastHigh: parseFloat(lastHigh),
        lastLow: parseFloat(lastLow),
        pdArray,
        pdPercent: parseFloat(pdPercent),
        liquidityAbove: liquidityAbove ? parseFloat(liquidityAbove) : null,
        liquidityBelow: liquidityBelow ? parseFloat(liquidityBelow) : null,
        liquiditySide,
        obBullish,
        obBearish,
        obSide,
        trend,
        structure,
        volume,
        volumeRatio: volumeRatio ? parseFloat(volumeRatio) : null,
        bias,
        confidence: confidence ? parseInt(confidence) : null,
        notes
      }
    });

    res.status(201).json(scanner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRealTimePrice,
  getMultiplePrices,
  calculatePD,
  getScanners,
  createScanner
};
