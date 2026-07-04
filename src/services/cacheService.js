const NodeCache = require('node-cache');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

// Initialize in-memory cache
const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false,
});

/**
 * Generates cache key from URL
 */
const generateCacheKey = (url) => {
  return 'coords:' + crypto.createHash('sha256').update(url).digest('hex');
};

/**
 * Gets coordinates from cache
 */
const getFromCache = (url) => {
  try {
    const key = generateCacheKey(url);
    const cached = cache.get(key);
    
    if (cached) {
      logger.debug('Cache hit', { url, key });
      return cached;
    }
    
    logger.debug('Cache miss', { url, key });
    return null;
  } catch (error) {
    logger.error('Cache get error', error);
    return null;
  }
};

/**
 * Saves coordinates to cache
 */
const saveToCache = (url, data) => {
  try {
    const key = generateCacheKey(url);
    const cacheData = {
      ...data,
      cached_at: new Date().toISOString(),
    };
    
    cache.set(key, cacheData);
    logger.debug('Cache saved', { url, key });
    return true;
  } catch (error) {
    logger.error('Cache save error', error);
    return false;
  }
};

/**
 * Gets cache statistics
 */
const getCacheStats = () => {
  return cache.getStats();
};

/**
 * Clears all cache
 */
const clearCache = () => {
  cache.flushAll();
  logger.info('Cache cleared');
};

module.exports = {
  getFromCache,
  saveToCache,
  getCacheStats,
  clearCache,
};
