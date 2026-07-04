const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Gets coordinates from knowledge graph ID (kgmid) using Geocoding API
 * kgmid can be used as a place_id in geocoding
 */
const getCoordinatesFromKgmid = async (kgmid) => {
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }
  
  try {
    logger.info('Fetching coordinates from kgmid', { kgmid });
    
    // Try using kgmid as place_id in geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        place_id: kgmid,
        key: config.googleMapsApiKey,
      },
      timeout: config.request.timeout,
    });
    
    if (response.data.status === 'OK' && response.data.results?.[0]?.geometry?.location) {
      const { lat, lng } = response.data.results[0].geometry.location;
      
      logger.info('Coordinates retrieved from kgmid', { kgmid, lat, lng });
      
      return {
        lat,
        lng,
        source: 'kgmid_geocoding',
      };
    } else {
      logger.warn('Geocoding API returned no results for kgmid', {
        kgmid,
        status: response.data.status,
      });
      return null;
    }
  } catch (error) {
    logger.error('Geocoding API error for kgmid', {
      kgmid,
      error: error.message,
    });
    // Don't throw, let it fallback to next method
    return null;
  }
};

/**
 * Gets coordinates from Place ID using Google Places API
 */
const getCoordinatesFromPlaceId = async (placeId) => {
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }
  
  try {
    logger.info('Fetching coordinates from Place ID', { placeId });
    
    // Use Geocoding API with place_id instead of legacy Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        place_id: placeId,
        key: config.googleMapsApiKey,
      },
      timeout: config.request.timeout,
    });
    
    if (response.data.status === 'OK' && response.data.results?.[0]?.geometry?.location) {
      const { lat, lng } = response.data.results[0].geometry.location;
      
      logger.info('Coordinates retrieved from Place ID', { placeId, lat, lng });
      
      return {
        lat,
        lng,
        source: 'place_id_geocoding',
      };
    } else {
      logger.warn('Geocoding API returned no results for Place ID', {
        placeId,
        status: response.data.status,
      });
      return null;
    }
  } catch (error) {
    logger.error('Geocoding API error for Place ID', {
      placeId,
      error: error.message,
    });
    // Don't throw, let it fallback to next method
    return null;
  }
};

/**
 * Geocodes an address or place name to get coordinates
 */
const geocodeAddress = async (address) => {
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }
  
  try {
    logger.info('Geocoding address', { address });
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: config.googleMapsApiKey,
      },
      timeout: config.request.timeout,
    });
    
    if (response.data.status === 'OK' && response.data.results?.[0]?.geometry?.location) {
      const { lat, lng } = response.data.results[0].geometry.location;
      
      logger.info('Address geocoded successfully', { address, lat, lng });
      
      return {
        lat,
        lng,
        source: 'geocoding_api',
      };
    } else {
      logger.warn('Geocoding API returned no results', {
        address,
        status: response.data.status,
      });
      return null;
    }
  } catch (error) {
    logger.error('Geocoding API error', {
      address,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Searches for a place and returns coordinates
 */
const searchPlace = async (query) => {
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }
  
  try {
    logger.info('Searching for place', { query });
    
    // Use geocoding API for place search
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: query,
        key: config.googleMapsApiKey,
      },
      timeout: config.request.timeout,
    });
    
    if (response.data.status === 'OK' && response.data.results?.[0]?.geometry?.location) {
      const { lat, lng } = response.data.results[0].geometry.location;
      
      logger.info('Place found successfully', { query, lat, lng });
      
      return {
        lat,
        lng,
        source: 'place_search_geocoding',
      };
    } else {
      logger.warn('Geocoding API returned no results for search', {
        query,
        status: response.data.status,
      });
      return null;
    }
  } catch (error) {
    logger.error('Geocoding API error for search', {
      query,
      error: error.message,
    });
    return null;
  }
};

module.exports = {
  getCoordinatesFromPlaceId,
  getCoordinatesFromKgmid,
  geocodeAddress,
  searchPlace,
};
