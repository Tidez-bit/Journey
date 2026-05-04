const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const logger = require('../lib/logger');

const applySecurityMiddleware = (app) => {
  app.use(helmet());

  // General rate limiter - reduced from 2000 to 200
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ 
        success: false, 
        message: 'Too many requests, please try again later.' 
      });
    }
  });

  app.use('/api/', limiter);
  app.use(xss());
  app.use(hpp());
  
  logger.info('Security middleware applied');
};

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({ 
      success: false, 
      message: 'Too many login attempts, please try again later.' 
    });
  }
});

module.exports = { applySecurityMiddleware, authLimiter };
