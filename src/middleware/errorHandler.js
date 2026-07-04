const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });
  
  // Handle specific error types
  if (err.message === 'Invalid URL format') {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format',
      message: 'Please provide a valid Google Maps URL',
    });
  }
  
  if (err.message === 'URL must be from Google Maps domains') {
    return res.status(400).json({
      success: false,
      error: 'Invalid domain',
      message: 'Only Google Maps URLs are supported',
    });
  }
  
  if (err.message === 'Could not extract coordinates from URL') {
    return res.status(404).json({
      success: false,
      error: 'Coordinates not found',
      message: 'Could not extract coordinates from this URL. The link may be invalid or expired.',
    });
  }
  
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(504).json({
      success: false,
      error: 'Request timeout',
      message: 'The request took too long to process. Please try again.',
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
  });
};

module.exports = errorHandler;
