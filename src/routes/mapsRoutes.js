const express = require('express');
const router = express.Router();
const { getCoordinates, healthCheck } = require('../controllers/mapsController');
const { validateExtractRequest, handleValidationErrors } = require('../middleware/validator');

/**
 * POST /api/extract
 * Extract coordinates from Google Maps URL
 */
router.post(
  '/extract',
  validateExtractRequest,
  handleValidationErrors,
  getCoordinates
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', healthCheck);

module.exports = router;
