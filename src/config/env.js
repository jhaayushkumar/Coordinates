require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 2592000, // 30 days default
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
    maxRedirects: parseInt(process.env.MAX_REDIRECTS) || 10,
  },
};
