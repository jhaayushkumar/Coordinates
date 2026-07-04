const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Gets coordinates from Place ID using Google Places API
 */
const getCoordinatesFromPlaceId = async (placeId) => {
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API key not configured');
  }
  
  try {
    logger.info('Fetching coordinates from Place ID', { placeId });
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'geometry',
        key: config.googleMapsApiKey,
      },
      timeout: config.request.timeout,
    });
    
    if (response.data.status === 'OK' && response.data.result?.geometry?.location) {
      const { lat, lng } = response.data.result.geometry.location;
      
      logger.info('Coordinates retrieved from Place ID', { placeId, lat, lng });
      
      return {
        lat,
        lng,
        source: 'place_details_api',
      };
    } else {
      logger.warn('Place Details API returned no results', {
        placeId,
        status: response.data.status,
      });
      return null;
    }
  } catch (error) {
    logger.error('Place Details API error', {
      placeId,
      error: error.message,
    });
    throw error;
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
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: {
        input: query,
        inputtype: 'textquery',
        fields: 'geometry',
        key: config.googleMapsApiKey,
      },
      timeout: config.request.timeout,
    });
    
    if (response.data.status === 'OK' && response.data.candidates?.[0]?.geometry?.location) {
      const { lat, lng } = response.data.candidates[0].geometry.location;
      
      logger.info('Place found successfully', { query, lat, lng });
      
      return {
        lat,
        lng,
        source: 'place_search_api',
      };
    } else {
      logger.warn('Place Search API returned no results', {
        query,
        status: response.data.status,
      });
      return null;
    }
  } catch (error) {
    logger.error('Place Search API error', {
      query,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  getCoordinatesFromPlaceId,
  geocodeAddress,
  searchPlace,
};
