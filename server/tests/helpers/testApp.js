const express = require('express');
const cors = require('cors');
const { applySecurityMiddleware } = require('../../middleware/security');
const { errorHandler } = require('../../middleware/errorHandler');

// Import routes
const authRouter = require('../../routes/authRoutes');
const tradeRouter = require('../../routes/tradeRoutes');
const transactionRouter = require('../../routes/transactionRoutes');
const targetRouter = require('../../routes/targetRoutes');
const ruleRouter = require('../../routes/ruleRoutes');
const scannerRouter = require('../../routes/scannerRoutes');
const dashboardRouter = require('../../routes/dashboardRoutes');
const userRouter = require('../../routes/userRoutes');

function createTestApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Security middleware (without rate limiting for tests)
  app.use((req, res, next) => {
    // Skip rate limiting in tests
    next();
  });

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/trades', tradeRouter);
  app.use('/api/transactions', transactionRouter);
  app.use('/api/targets', targetRouter);
  app.use('/api/rules', ruleRouter);
  app.use('/api/scanner', scannerRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/users', userRouter);

  // Error handler
  app.use(errorHandler);

  return app;
}

module.exports = { createTestApp };
