/**
 * Collection of regex patterns for extracting coordinates from Google Maps URLs
 */
const COORDINATE_PATTERNS = [
  // Pattern 1: @lat,lng,zoom format
  /@(-?\d+\.?\d*),(-?\d+\.?\d*),/,
  
  // Pattern 2: @lat,lng format (without zoom)
  /@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:[,/]|$)/,
  
  // Pattern 3: !3d<lat>!4d<lng> format (data parameter)
  /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
  
  // Pattern 4: q=lat,lng format
  /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  
  // Pattern 5: ll=lat,lng format
  /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  
  // Pattern 6: query=lat,lng format (Search API)
  /[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  
  // Pattern 7: center=lat,lng format
  /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
];

/**
 * Place ID pattern (ChIJ followed by base64-like string)
 */
const PLACE_ID_PATTERN = /(ChIJ[\w-]{16,})/;

/**
 * Extracts coordinates from Google Maps URL using regex patterns
 */
const extractCoordinatesFromUrl = (url) => {
  for (const pattern of COORDINATE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, source: 'direct_extraction' };
      }
    }
  }
  
  return null;
};

/**
 * Extracts Place ID from Google Maps URL
 */
const extractPlaceId = (url) => {
  const match = url.match(PLACE_ID_PATTERN);
  return match ? match[1] : null;
};

/**
 * Extracts place name from Google Maps URL
 */
const extractPlaceName = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Check /place/ path
    const placeMatch = urlObj.pathname.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }
    
    // Check /search/ path
    const searchMatch = urlObj.pathname.match(/\/search\/([^/@]+)/);
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    }
    
    // Check query parameters
    const qParam = urlObj.searchParams.get('q');
    if (qParam && !qParam.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      return qParam;
    }
    
    const queryParam = urlObj.searchParams.get('query');
    if (queryParam && !queryParam.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      return queryParam;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if URL is a short URL that needs expansion
 */
const isShortUrl = (url) => {
  const shortUrlPatterns = [
    /share\.google/,
    /goo\.gl/,
    /maps\.app\.goo\.gl/,
  ];
  
  return shortUrlPatterns.some(pattern => pattern.test(url));
};

module.exports = {
  extractCoordinatesFromUrl,
  extractPlaceId,
  extractPlaceName,
  isShortUrl,
};
