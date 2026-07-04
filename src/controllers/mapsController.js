const { extractCoordinates } = require('../services/coordinateExtractor');
const { getCacheStats } = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Controller to handle coordinate extraction
 */
const getCoordinates = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    logger.info('Coordinate extraction request', { url });
    
    const result = await extractCoordinates(url);
    
    res.json({
      success: true,
      data: {
        latitude: result.lat,
        longitude: result.lng,
        source: result.source,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check endpoint
 */
const healthCheck = (req, res) => {
  const stats = getCacheStats();
  
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    cache: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%' : '0%',
    },
  });
};

module.exports = {
  getCoordinates,
  healthCheck,
};
