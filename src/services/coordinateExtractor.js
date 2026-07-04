const { extractCoordinatesFromUrl, extractPlaceId, extractPlaceName, extractKgmid, isShortUrl } = require('../utils/urlParser');
const { sanitizeUrl, isValidGoogleUrl } = require('../utils/validators');
const { expandUrlWithRetry } = require('./urlExpander');
const { getCoordinatesFromPlaceId, getCoordinatesFromKgmid, geocodeAddress } = require('./googleMapsAPI');
const { getFromCache, saveToCache } = require('./cacheService');
const logger = require('../utils/logger');

/**
 * Main service to extract coordinates from any Google Maps URL
 * Implements complete fallback chain
 */
const extractCoordinates = async (rawUrl) => {
  // Step 1: Sanitize input
  const sanitizedUrl = sanitizeUrl(rawUrl);
  if (!sanitizedUrl) {
    throw new Error('Invalid URL format');
  }
  
  // Step 2: Validate it's a Google URL (SSRF protection)
  if (!isValidGoogleUrl(sanitizedUrl)) {
    throw new Error('URL must be from Google Maps domains');
  }
  
  logger.info('Processing URL', { url: sanitizedUrl });
  
  // Step 3: Check cache first
  const cachedResult = getFromCache(sanitizedUrl);
  if (cachedResult) {
    return cachedResult;
  }
  
  let finalUrl = sanitizedUrl;
  
  // Step 4: Expand short URLs if needed
  if (isShortUrl(sanitizedUrl)) {
    try {
      finalUrl = await expandUrlWithRetry(sanitizedUrl);
      logger.info('Short URL expanded', { original: sanitizedUrl, expanded: finalUrl });
    } catch (error) {
      logger.error('Failed to expand URL', error);
      throw new Error('Failed to expand short URL');
    }
  }
  
  // Step 5: Try direct coordinate extraction (FREE - no API call)
  const directCoords = extractCoordinatesFromUrl(finalUrl);
  if (directCoords) {
    logger.info('Coordinates extracted directly', directCoords);
    saveToCache(sanitizedUrl, directCoords);
    return directCoords;
  }
  
  // Step 6: Fallback to Place ID extraction + API
  const placeId = extractPlaceId(finalUrl);
  if (placeId) {
    try {
      const coords = await getCoordinatesFromPlaceId(placeId);
      if (coords) {
        saveToCache(sanitizedUrl, coords);
        return coords;
      }
    } catch (error) {
      logger.warn('Place ID lookup failed, trying next fallback', error);
    }
  }
  
  // Step 6.5: Fallback to kgmid (knowledge graph ID) extraction + API
  const kgmid = extractKgmid(finalUrl);
  if (kgmid) {
    try {
      const coords = await getCoordinatesFromKgmid(kgmid);
      if (coords) {
        saveToCache(sanitizedUrl, coords);
        return coords;
      }
    } catch (error) {
      logger.warn('kgmid lookup failed, trying next fallback', error);
    }
  }
  
  // Step 7: Fallback to place name + Geocoding API
  const placeName = extractPlaceName(finalUrl);
  if (placeName) {
    try {
      const coords = await geocodeAddress(placeName);
      if (coords) {
        saveToCache(sanitizedUrl, coords);
        return coords;
      }
    } catch (error) {
      logger.warn('Geocoding failed', error);
    }
  }
  
  // Step 8: No coordinates found
  throw new Error('Could not extract coordinates from URL');
};

module.exports = {
  extractCoordinates,
};
