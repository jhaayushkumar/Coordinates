const express = require('express');
const path = require('path');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const mapsRoutes = require('./routes/mapsRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Apply rate limiting to API routes
app.use('/api', rateLimiter);

// Routes
app.use('/api', mapsRoutes);

// Error handling (must be last)
app.use(errorHandler);

module.exports = app;
