const prisma = require('../lib/prisma');
const priceService = require('../services/priceService');
const { calculatePDArray } = require('../helpers/smcCalculator');

const getRealTimePrice = (req, res, next) => {
  try {
    const { pair } = req.params;
    const data = priceService.getPrice(pair);
    if (data) {
      res.json(data);
    } else {
      const err = new Error('Price not available yet');
      err.statusCode = 404;
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

const getMultiplePrices = (req, res, next) => {
  try {
    const { pairs } = req.body;
    if (!Array.isArray(pairs)) {
      const err = new Error('Pairs must be an array');
      err.statusCode = 400;
      return next(err);
    }
    const data = priceService.getMultiplePrices(pairs);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const calculatePD = (req, res, next) => {
  try {
    const { high, low, currentPrice } = req.body;
    const result = calculatePDArray(parseFloat(high), parseFloat(low), parseFloat(currentPrice));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// CRUD for Scanner
const getScanners = async (req, res, next) => {
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
    next(error);
  }
};

const createScanner = async (req, res, next) => {
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
    next(error);
  }
};

const upsertScannerNote = async (req, res, next) => {
  try {
    const { pair, timeframe, note } = req.body;
    const userId = req.user.id;

    if (!pair) {
      const err = new Error('Pair is required');
      err.statusCode = 400;
      return next(err);
    }

    // Use today's date for the scanner entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert scanner with minimal data, focusing on notes
    const result = await prisma.scanner.upsert({
      where: {
        userId_date_pair_timeframe: {
          userId,
          date: today,
          pair,
          timeframe: timeframe || '1h'
        }
      },
      update: {
        notes: note,
        updatedAt: new Date()
      },
      create: {
        userId,
        date: today,
        pair,
        timeframe: timeframe || '1h',
        currentPrice: 0,
        lastHigh: 0,
        lastLow: 0,
        pdArray: 'UNKNOWN',
        pdPercent: 0,
        trend: 'UNKNOWN',
        volume: 'UNKNOWN',
        bias: 'UNKNOWN',
        notes: note
      }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getScannerNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get all scanner entries with notes
    const scanners = await prisma.scanner.findMany({
      where: { 
        userId,
        notes: { not: null }
      },
      select: { 
        pair: true, 
        timeframe: true, 
        notes: true, 
        updatedAt: true 
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: scanners });
  } catch (error) {
    next(error);
  }
};

const analyzePair = async (req, res, next) => {
  try {
    const { pair, timeframe } = req.body;
    const userId = req.user.id;

    if (!pair) {
      const err = new Error('Pair is required');
      err.statusCode = 400;
      return next(err);
    }

    // Get current price from price service
    const priceData = priceService.getPrice(pair);
    if (!priceData) {
      const err = new Error('Price data not available for this pair');
      err.statusCode = 404;
      return next(err);
    }

    const currentPrice = priceData.price;
    
    // Calculate mock high/low based on current price (in real app, fetch from exchange API)
    const volatility = 0.05; // 5% range
    const lastHigh = currentPrice * (1 + volatility);
    const lastLow = currentPrice * (1 - volatility);

    // Calculate PD Array using the helper
    const pdResult = calculatePDArray(lastHigh, lastLow, currentPrice);

    // Determine liquidity zones
    const liquidityAbove = lastHigh * 1.02;
    const liquidityBelow = lastLow * 0.98;
    const liquiditySide = pdResult.percent > 60 ? 'ABOVE' : pdResult.percent < 40 ? 'BELOW' : 'BOTH';

    // Determine order blocks (simplified logic)
    const obBullish = pdResult.percent < 50 ? (lastLow * 1.01).toFixed(2) : null;
    const obBearish = pdResult.percent > 50 ? (lastHigh * 0.99).toFixed(2) : null;
    const obSide = obBullish ? 'BULLISH' : obBearish ? 'BEARISH' : 'NONE';

    // Determine trend based on PD position
    const trend = pdResult.percent > 55 ? 'BULLISH' : pdResult.percent < 45 ? 'BEARISH' : 'SIDEWAYS';

    // Mock volume analysis
    const volume = Math.random() > 0.5 ? 'HIGH' : 'NORMAL';

    // Overall bias
    let bias = 'NEUTRAL';
    if (pdResult.pdArray === 'DISCOUNT' && obSide === 'BULLISH') bias = 'BULLISH';
    if (pdResult.pdArray === 'PREMIUM' && obSide === 'BEARISH') bias = 'BEARISH';

    const analysis = {
      pair,
      timeframe: timeframe || '4H',
      currentPrice,
      lastHigh,
      lastLow,
      pdArray: pdResult.pdArray,
      pdPercent: pdResult.percent,
      liquidityAbove,
      liquidityBelow,
      liquiditySide,
      obBullish,
      obBearish,
      obSide,
      trend,
      volume,
      bias,
      confidence: Math.floor(Math.random() * 30) + 70 // 70-100%
    };

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRealTimePrice,
  getMultiplePrices,
  calculatePD,
  getScanners,
  createScanner,
  upsertScannerNote,
  getScannerNotes,
  analyzePair
};
