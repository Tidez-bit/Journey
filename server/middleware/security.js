const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

const applySecurityMiddleware = (app) => {
  app.use(helmet());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limit each IP to 2000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  app.use('/api/', limiter);
  app.use(xss());
  app.use(hpp());
};

module.exports = applySecurityMiddleware;
