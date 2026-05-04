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
const http = require('http');
const setupPriceSocket = require('./ws/priceSocket');
const applySecurityMiddleware = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Journey API is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/trades', tradeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/targets', targetRouter);
app.use('/api/rules', ruleRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/settings', settingsRouter);

// Error Handler Middleware
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
