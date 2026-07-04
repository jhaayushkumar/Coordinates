const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Expands short URLs by following redirects
 */
const expandUrl = async (shortUrl) => {
  try {
    logger.info('Expanding short URL', { shortUrl });
    
    const response = await axios.get(shortUrl, {
      maxRedirects: config.request.maxRedirects,
      timeout: config.request.timeout,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    // The final URL after all redirects
    const expandedUrl = response.request.res.responseUrl || response.config.url;
    
    logger.info('URL expanded successfully', { 
      shortUrl, 
      expandedUrl,
      redirects: response.request._redirectable._redirectCount || 0,
    });
    
    return expandedUrl;
  } catch (error) {
    logger.error('URL expansion failed', {
      shortUrl,
      error: error.message,
    });
    
    // Return original URL if expansion fails
    // Some short URLs might still be parseable
    return shortUrl;
  }
};

/**
 * Expands URL with retry logic
 */
const expandUrlWithRetry = async (shortUrl, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await expandUrl(shortUrl);
    } catch (error) {
      lastError = error;
      logger.warn(`URL expansion attempt ${attempt} failed`, {
        shortUrl,
        attempt,
        error: error.message,
      });
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

module.exports = {
  expandUrl,
  expandUrlWithRetry,
};
