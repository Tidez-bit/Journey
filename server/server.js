require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const transactionRouter = require('./routes/transactionRoutes');
const tradeRouter = require('./routes/tradeRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const targetRouter = require('./routes/targetRoutes');
const ruleRouter = require('./routes/ruleRoutes');
const scannerRouter = require('./routes/scannerRoutes');
const settingsRouter = require('./routes/settingsRoutes');
const watchlistRouter = require('./routes/watchlistRoutes');
const uploadRouter = require('./routes/uploadRoutes');
const http = require('http');
const setupPriceSocket = require('./ws/priceSocket');
const { applySecurityMiddleware, authLimiter } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./lib/logger');

const app = express();
const server = http.createServer(app);
setupPriceSocket(server);
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Apply Security Middlewares
applySecurityMiddleware(app);
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Journey API is running' });
});

// Auth routes with strict rate limiting
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/trades', tradeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/targets', targetRouter);
app.use('/api/rules', ruleRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/upload', uploadRouter);

// Error Handler Middleware
app.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
