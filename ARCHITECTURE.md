# Architecture Documentation

## System Overview

This document provides a detailed architectural overview of the Google Maps Coordinate Extractor service.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                            │
│                     (Simple HTML Form + JS)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ POST /api/extract
                             │ { url: "..." }
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPRESS MIDDLEWARE                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Rate Limiter (100 req/hour)                                    │
│  2. JSON Body Parser                                                │
│  3. Input Validator (express-validator)                            │
│  4. SSRF Protection (domain whitelist)                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MAPS CONTROLLER                                │
│                   (mapsController.js)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 COORDINATE EXTRACTOR SERVICE                        │
│              (coordinateExtractor.js - Main Logic)                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│    CACHE SERVICE         │   │   INPUT VALIDATION       │
│   (node-cache)           │   │   (validators.js)        │
│                          │   │                          │
│  • Check cache first     │   │  • Sanitize URL          │
│  • 30-day TTL            │   │  • Domain whitelist      │
│  • 80-90% hit rate       │   │  • Length limits         │
└──────────────────────────┘   └──────────────────────────┘
                │
                │ Cache Miss
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      URL PROCESSING FLOW                            │
└─────────────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │  Is Short URL?          │
                │  (share.google,         │
                │   goo.gl, etc.)         │
                └────┬──────────────┬─────┘
                     │ Yes          │ No
                     ▼              │
        ┌─────────────────────┐    │
        │  URL EXPANDER       │    │
        │  (urlExpander.js)   │    │
        │                     │    │
        │  • Follow redirects │    │
        │  • Max 10 redirects │    │
        │  • Retry logic      │    │
        │  • Exponential      │    │
        │    backoff          │    │
        └──────────┬──────────┘    │
                   │                │
                   └────────┬───────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │   DIRECT COORDINATE EXTRACTION     │
        │        (urlParser.js)              │
        │                                    │
        │  Regex Patterns:                  │
        │  /@(-?\d+\.?\d*),(-?\d+\.?\d*)/  │
        │  /!3d(-?\d+\.?\d*)!4d.../        │
        │  /[?&]q=(-?\d+\.?\d*),.../       │
        │  /[?&]ll=(-?\d+\.?\d*),.../      │
        │                                    │
        │  ✅ FREE - No API calls            │
        │  ✅ 90% success rate               │
        │  ✅ Instant response               │
        └────────────┬───────────────────────┘
                     │
        ┌────────────┴────────────┐
        │ Coordinates Found?      │
        └────┬────────────────┬───┘
             │ Yes            │ No
             │                ▼
             │    ┌──────────────────────────┐
             │    │  EXTRACT PLACE ID        │
             │    │  (urlParser.js)          │
             │    │                          │
             │    │  Pattern:                │
             │    │  ChIJ[\w-]{16,}         │
             │    └──────────┬───────────────┘
             │               │
             │               │ Place ID Found?
             │               ▼
             │    ┌──────────────────────────┐
             │    │  GOOGLE PLACES API       │
             │    │  (Place Details)         │
             │    │                          │
             │    │  Cost: $17/1000 req     │
             │    │  Fields: geometry only   │
             │    └──────────┬───────────────┘
             │               │
             │               │ Not Found?
             │               ▼
             │    ┌──────────────────────────┐
             │    │  EXTRACT PLACE NAME      │
             │    │  (urlParser.js)          │
             │    │                          │
             │    │  From:                   │
             │    │  • /place/Name           │
             │    │  • /search/Name          │
             │    │  • ?q=Name               │
             │    └──────────┬───────────────┘
             │               │
             │               ▼
             │    ┌──────────────────────────┐
             │    │  GOOGLE GEOCODING API    │
             │    │  (googleMapsAPI.js)      │
             │    │                          │
             │    │  Cost: $5/1000 req      │
             │    │  Cheapest option         │
             │    └──────────┬───────────────┘
             │               │
             │               │ Not Found?
             │               ▼
             │    ┌──────────────────────────┐
             │    │  ERROR:                  │
             │    │  "Could not extract      │
             │    │   coordinates"           │
             │    └──────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SAVE TO CACHE                                │
│                     (cacheService.js)                               │
│                                                                      │
│  Key: sha256(url)                                                   │
│  Value: { lat, lng, source, cached_at }                            │
│  TTL: 30 days                                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     RESPONSE TO CLIENT                              │
│                                                                      │
│  Success:                                                           │
│  {                                                                  │
│    "success": true,                                                 │
│    "data": {                                                        │
│      "latitude": 37.4224764,                                        │
│      "longitude": -122.0842499,                                     │
│      "source": "direct_extraction"                                  │
│    }                                                                │
│  }                                                                  │
│                                                                      │
│  Error:                                                             │
│  {                                                                  │
│    "success": false,                                                │
│    "error": "...",                                                  │
│    "message": "..."                                                 │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Frontend Layer (public/)
- **index.html**: Simple form interface
- **script.js**: Handles form submission and API calls
- **styles.css**: Modern, responsive UI styling

### 2. API Layer (src/routes, src/controllers)
- **mapsRoutes.js**: Route definitions
- **mapsController.js**: Request handling and response formatting
- **validator.js**: Input validation middleware
- **rateLimiter.js**: Rate limiting (100 req/hour)

### 3. Service Layer (src/services)
- **coordinateExtractor.js**: Main orchestration logic
  - Implements complete fallback chain
  - Manages cache lookups
  - Coordinates all extraction strategies

- **urlExpander.js**: Short URL resolution
  - Follows HTTP redirects
  - Retry logic with exponential backoff
  - Handles share.google, goo.gl, maps.app.goo.gl

- **googleMapsAPI.js**: Google Maps Platform integration
  - Place Details API (Place ID → Coordinates)
  - Geocoding API (Address → Coordinates)
  - Place Search API (Name → Coordinates)

- **cacheService.js**: Caching layer
  - In-memory cache (node-cache)
  - 30-day TTL
  - SHA-256 hashed keys

### 4. Utility Layer (src/utils)
- **urlParser.js**: URL parsing and pattern matching
  - 7 regex patterns for coordinate extraction
  - Place ID extraction
  - Place name extraction

- **validators.js**: Security and validation
  - SSRF protection (domain whitelist)
  - Input sanitization
  - Coordinate range validation

- **logger.js**: Structured logging
  - JSON-formatted logs
  - Different log levels (info, error, warn, debug)

### 5. Middleware (src/middleware)
- **errorHandler.js**: Global error handling
  - Specific error type handling
  - User-friendly error messages
  - Security (no internal details exposed)

## Data Flow

### Happy Path (90% of requests)
```
User Input → Validation → Cache Check (miss) → Direct Extraction → Cache Save → Response
Time: ~50-100ms
Cost: $0 (no API calls)
```

### Fallback Path 1: Place ID
```
User Input → Validation → Cache Check (miss) → Direct Extraction (fail) 
→ Place ID Extraction → Places API → Cache Save → Response
Time: ~200-500ms
Cost: $0.017 per request
```

### Fallback Path 2: Geocoding
```
User Input → Validation → Cache Check (miss) → Direct Extraction (fail)
→ Place ID Extraction (fail) → Place Name Extraction → Geocoding API 
→ Cache Save → Response
Time: ~200-500ms
Cost: $0.005 per request (cheapest)
```

### Short URL Path
```
User Input → Validation → Cache Check (miss) → URL Expansion (redirects)
→ Direct Extraction → Cache Save → Response
Time: ~300-800ms
Cost: $0 (no API calls if coordinates in expanded URL)
```

## Performance Characteristics

### Response Times
- **Cache Hit**: 5-10ms
- **Direct Extraction**: 50-100ms
- **URL Expansion**: 300-800ms
- **API Calls**: 200-500ms additional

### Cache Effectiveness
- Expected hit rate: 80-90%
- TTL: 30 days (coordinates rarely change)
- Memory usage: ~100 bytes per cached URL

### Cost Analysis (10,000 requests/month)

| Scenario | Cache Hit Rate | API Calls | Monthly Cost |
|----------|----------------|-----------|--------------|
| Optimized | 90% | 1,000 | $5-10 |
| Average | 70% | 3,000 | $15-30 |
| No Cache | 0% | 10,000 | $50-100 |

## Security Measures

### SSRF Protection
- Whitelist of allowed domains
- Validates all URLs before processing
- Prevents internal network access

### Rate Limiting
- 100 requests per hour per IP
- Sliding window implementation
- Prevents abuse and DoS

### Input Validation
- URL length limit: 2048 characters
- Required field validation
- Type checking

### API Key Protection
- Stored in environment variables
- Never committed to version control
- Restricted API key permissions

## Error Handling Strategy

### Error Types & Responses

| Error | HTTP Code | Client Message | Action |
|-------|-----------|----------------|--------|
| Invalid URL | 400 | "Please provide a valid URL" | Fix input |
| Invalid domain | 400 | "Only Google Maps URLs supported" | Use Google URL |
| Rate limit | 429 | "Too many requests" | Wait & retry |
| Timeout | 504 | "Request took too long" | Retry |
| Not found | 404 | "Coordinates not found" | Check URL |
| API error | 502 | "Unexpected error occurred" | Retry later |

### Retry Strategy
- URL expansion: 3 attempts with exponential backoff
- API calls: Single attempt (rely on caching for reliability)
- Network errors: User-initiated retry

## Scalability Considerations

### Current Architecture
- Single server instance
- In-memory cache
- Suitable for: 1-10k requests/day

### Scaling Options

#### Horizontal Scaling
1. Add Redis for distributed cache
2. Load balancer across multiple instances
3. Session-less design (stateless)

#### Vertical Scaling
1. Increase server resources
2. Optimize regex patterns
3. Add connection pooling

#### Database Addition (Optional)
- Store historical URLs and coordinates
- Analytics on popular locations
- Offline fallback data

## Monitoring & Observability

### Key Metrics
- Request rate (requests/second)
- Cache hit rate (should be >80%)
- API call rate (should be <20% of requests)
- Error rate (should be <5%)
- Response time (p50, p95, p99)

### Health Check Endpoint
```
GET /api/health

Response:
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

### Logging
- Structured JSON logs
- Request/response logging
- Error tracking with stack traces
- API call tracking for cost monitoring

## Future Enhancements

### Phase 2 Improvements
1. **Redis Cache**: Replace in-memory with Redis
2. **Batch Processing**: Process multiple URLs in parallel
3. **Webhook Support**: Async processing with callbacks
4. **Admin Dashboard**: Monitor usage and costs
5. **Analytics**: Track popular locations

### Phase 3 Features
1. **Database Storage**: Persistent coordinate storage
2. **User Accounts**: API key management
3. **Usage Quotas**: Tiered pricing
4. **Additional APIs**: Support other mapping services
5. **Export Formats**: CSV, JSON, GeoJSON

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `GOOGLE_MAPS_API_KEY`
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up process manager (PM2)
- [ ] Configure log rotation
- [ ] Set up monitoring alerts
- [ ] Test rate limiting
- [ ] Review API quotas and billing alerts

## Limitations

### Technical Limitations
1. **Expired URLs**: Some share links expire after time
2. **Private Places**: Business-specific URLs may not resolve
3. **Directions**: Multi-point routes not supported
4. **Street View**: Street view URLs may not have coordinates

### API Limitations
1. **Rate Limits**: Google API quotas apply
2. **Cost**: API calls incur costs (mitigated by caching)
3. **Accuracy**: Geocoded locations may vary slightly

### Workarounds
- Cache aggressively to reduce API calls
- Clear error messages for unsupported formats
- Fallback chain ensures maximum success rate
