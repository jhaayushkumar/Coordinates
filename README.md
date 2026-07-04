# Google Maps Coordinate Extractor

A production-ready Node.js + Express backend service that extracts latitude and longitude coordinates from Google Maps share URLs.

## 🎯 Features

- ✅ Supports all major Google Maps URL formats
- ✅ Automatic short URL expansion (share.google, goo.gl, maps.app.goo.gl)
- ✅ Direct coordinate extraction (no API calls needed for most URLs)
- ✅ Intelligent fallback system using Google Maps Platform APIs
- ✅ In-memory caching to minimize API costs
- ✅ Rate limiting and security protections (SSRF prevention)
- ✅ Comprehensive error handling
- ✅ Clean, modular architecture
- ✅ Production-ready with logging and monitoring

## 📋 Supported URL Formats

```
https://share.google/xxxxx
https://maps.app.goo.gl/xxxxx
https://goo.gl/maps/xxxxx
https://www.google.com/maps/@lat,lng,zoom
https://www.google.com/maps/place/Name/@lat,lng,zoom
https://www.google.com/maps?q=lat,lng
https://www.google.com/maps?ll=lat,lng
https://www.google.com/maps/search/Place+Name
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Google Maps API key:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Get API Key:** https://console.cloud.google.com/
- Enable: Places API, Geocoding API

### 3. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will start on `http://localhost:3000`

## 🧪 Quick Test Scripts

### Test All URLs
```bash
node test-api.js
```
Runs automated tests on multiple URL formats and shows summary.

### Test Single URL
```bash
node test-single.js "YOUR_GOOGLE_MAPS_URL"
```

**Examples:**
```bash
# Test direct coordinates
node test-single.js "https://www.google.com/maps/@28.6139,77.2090,15z"

# Test query parameter
node test-single.js "https://www.google.com/maps?q=19.0760,72.8777"

# Test place URL
node test-single.js "https://www.google.com/maps/place/Taj+Mahal/@27.1751,78.0421,17z"
```

## 📡 API Usage

### Extract Coordinates

**Endpoint:** `POST /api/extract`

**Request:**
```json
{
  "url": "https://share.google/9xuXQOOJ7kyVJG2Fz"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "latitude": 37.4224764,
    "longitude": -122.0842499,
    "source": "direct_extraction"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Coordinates not found",
  "message": "Could not extract coordinates from this URL"
}
```

### Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 12345.67,
  "cache": {
    "keys": 42,
    "hits": 156,
    "misses": 24,
    "hitRate": "86.67%"
  }
}
```

## 🏗️ Architecture

### Request Flow

```
1. User submits URL
2. Validate & sanitize input (SSRF protection)
3. Check cache (Redis/in-memory)
4. Expand short URLs if needed
5. Extract coordinates directly from URL (FREE)
   ├─ Success → Return result
   └─ Fail → Continue to fallback
6. Extract Place ID → Call Places API
   ├─ Success → Return result
   └─ Fail → Continue to fallback
7. Extract place name → Call Geocoding API
   ├─ Success → Return result
   └─ Fail → Return error
```

### Coordinate Extraction Strategies

1. **Direct Extraction (FREE)** - 90% success rate
   - Regex patterns for `@lat,lng`, `!3d!4d`, `q=`, `ll=`
   - No API calls required
   - Instant response

2. **Place ID Lookup** - When Place ID detected
   - Google Places API (Place Details)
   - Cost: $17/1000 requests

3. **Geocoding** - For place names/addresses
   - Google Geocoding API
   - Cost: $5/1000 requests
   - Most economical API option

### Project Structure

```
project/
├── src/
│   ├── config/
│   │   └── env.js                    # Environment configuration
│   ├── middleware/
│   │   ├── errorHandler.js           # Global error handling
│   │   ├── rateLimiter.js            # Rate limiting
│   │   └── validator.js              # Input validation
│   ├── services/
│   │   ├── urlExpander.js            # Short URL expansion
│   │   ├── coordinateExtractor.js    # Main extraction logic
│   │   ├── googleMapsAPI.js          # Google API integration
│   │   └── cacheService.js           # Caching layer
│   ├── utils/
│   │   ├── urlParser.js              # URL parsing & regex
│   │   ├── validators.js             # Validation helpers
│   │   └── logger.js                 # Logging utility
│   ├── controllers/
│   │   └── mapsController.js         # Request handlers
│   ├── routes/
│   │   └── mapsRoutes.js             # API routes
│   └── app.js                        # Express app
├── public/
│   ├── index.html                    # Frontend UI
│   ├── styles.css                    # Styling
│   └── script.js                     # Frontend logic
└── server.js                         # Entry point
```

## 💰 Cost Optimization

### Caching Strategy
- In-memory cache (Node-Cache)
- 30-day TTL for coordinates
- Expected 80-90% cache hit rate
- Reduces API costs by 80-90%

### Expected Costs (10,000 requests/month)
- **With 90% cache hit rate:** $5-10/month
- **Without caching:** $50-100/month
- **Direct extraction (no API):** FREE

## 🔒 Security Features

- ✅ SSRF protection (domain whitelist)
- ✅ Input validation and sanitization
- ✅ Rate limiting (100 req/hour per IP)
- ✅ Request timeout protection
- ✅ API key environment variables
- ✅ Error logging without exposing internals

## 📊 Monitoring & Logging

All logs are JSON-formatted for easy parsing:

```json
{
  "level": "info",
  "message": "Coordinate extraction request",
  "timestamp": "2026-07-03T10:30:45.123Z",
  "url": "https://share.google/xxxxx"
}
```

## 🧪 Testing

### Manual Test with cURL

```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com/maps/@37.4224764,-122.0842499,15z"}'
```

### Test Different URL Formats

```bash
# Short URL
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://share.google/9xuXQOOJ7kyVJG2Fz"}'

# Place URL
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com/maps/place/Taj+Mahal/@27.1751496,78.0399535,17z"}'
```

## 🐛 Troubleshooting

### Issue: "Google Maps API key not configured"
**Solution:** Add `GOOGLE_MAPS_API_KEY` to your `.env` file

### Issue: URL expansion fails
**Solution:** Check network connectivity, verify URL is accessible

### Issue: High API costs
**Solution:** Ensure caching is working (check `/api/health` for cache stats)

### Issue: Rate limiting triggered
**Solution:** Wait 1 hour or adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `GOOGLE_MAPS_API_KEY` | - | **Required** Google Maps API key |
| `CACHE_TTL` | 2592000 | Cache TTL in seconds (30 days) |
| `RATE_LIMIT_WINDOW_MS` | 3600000 | Rate limit window (1 hour) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `REQUEST_TIMEOUT` | 10000 | Request timeout (10 seconds) |

## 🚦 Production Deployment

1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd)
3. Set up HTTPS with reverse proxy (nginx)
4. Configure production logging
5. Monitor API usage and costs
6. Set up alerts for errors and rate limits

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please follow the existing code structure and patterns.
