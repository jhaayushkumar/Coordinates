const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const puppeteer = require('puppeteer');

let browser = null;

/**
 * Get or create browser instance
 */
const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
};

/**
 * Expands URL using puppeteer (for JavaScript redirects)
 */
const expandUrlWithBrowser = async (shortUrl) => {
  let page;
  try {
    logger.info('Expanding URL with browser', { shortUrl });
    
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();
    
    // Set timeout and navigate
    await page.goto(shortUrl, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait a bit for any JavaScript redirects using setTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalUrl = page.url();
    
    logger.info('URL expanded via browser', { 
      shortUrl, 
      finalUrl 
    });
    
    await page.close();
    return finalUrl;
  } catch (error) {
    if (page) await page.close();
    logger.error('Browser URL expansion failed', {
      shortUrl,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Expands short URLs by following redirects
 */
const expandUrl = async (shortUrl) => {
  try {
    logger.info('Expanding short URL', { shortUrl });
    
    // First try: HEAD request to get location header (faster)
    try {
      const headResponse = await axios.head(shortUrl, {
        maxRedirects: 0,
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 400,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      
      if (headResponse.headers.location) {
        const expandedUrl = headResponse.headers.location;
        logger.info('URL expanded via HEAD request', { shortUrl, expandedUrl });
        return expandedUrl;
      }
    } catch (headError) {
      if (headError.response?.headers?.location) {
        const expandedUrl = headError.response.headers.location;
        logger.info('URL expanded via HEAD redirect', { shortUrl, expandedUrl });
        return expandedUrl;
      }
    }
    
    // Second try: Full GET request with redirects
    const response = await axios.get(shortUrl, {
      maxRedirects: config.request.maxRedirects,
      timeout: config.request.timeout,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
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
const expandUrlWithRetry = async (shortUrl, maxRetries = 2) => {
  let lastError;
  
  // First try: Simple HTTP expansion
  try {
    const httpResult = await expandUrl(shortUrl);
    // If it's a proper Google Maps URL, return it
    if (httpResult.includes('google.com/maps') || httpResult.includes('@')) {
      return httpResult;
    }
    // If it's still share.google or redirect URL, try browser
    if (httpResult.includes('share.google') || httpResult.includes('www.google.com/share')) {
      logger.info('HTTP expansion returned redirect URL, trying browser', { shortUrl, httpResult });
      return await expandUrlWithBrowser(shortUrl);
    }
    return httpResult;
  } catch (error) {
    logger.warn('HTTP expansion failed, trying browser', {
      shortUrl,
      error: error.message,
    });
    lastError = error;
  }
  
  // Second try: Browser-based expansion for JavaScript redirects
  try {
    return await expandUrlWithBrowser(shortUrl);
  } catch (error) {
    logger.error('Browser expansion failed', {
      shortUrl,
      error: error.message,
    });
    lastError = error;
  }
  
  // If both methods fail, return original URL
  logger.warn('All expansion methods failed, returning original URL', { shortUrl });
  return shortUrl;
};

module.exports = {
  expandUrl,
  expandUrlWithRetry,
  expandUrlWithBrowser,
};
