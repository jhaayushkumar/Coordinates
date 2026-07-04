const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * Rate limiting middleware to prevent abuse
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
