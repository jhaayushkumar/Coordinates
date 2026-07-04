const ALLOWED_DOMAINS = [
  'google.com',
  'maps.google.com',
  'www.google.com',
  'goo.gl',
  'maps.app.goo.gl',
  'share.google',
];

/**
 * Validates if URL is from allowed Google domains
 * Prevents SSRF attacks
 */
const isValidGoogleUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if domain matches allowed list
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (error) {
    return false;
  }
};

/**
 * Validates coordinate values
 */
const isValidCoordinate = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Sanitizes URL input
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Trim whitespace
  url = url.trim();
  
  // Check length
  if (url.length > 2048) {
    return null;
  }
  
  // Ensure it starts with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
};

module.exports = {
  isValidGoogleUrl,
  isValidCoordinate,
  sanitizeUrl,
};
