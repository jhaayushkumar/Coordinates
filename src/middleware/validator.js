const { body, validationResult } = require('express-validator');

/**
 * Validation rules for coordinate extraction
 */
const validateExtractRequest = [
  body('url')
    .exists().withMessage('URL is required')
    .notEmpty().withMessage('URL cannot be empty')
    .isString().withMessage('URL must be a string')
    .trim()
    .isLength({ max: 2048 }).withMessage('URL is too long'),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  
  next();
};

module.exports = {
  validateExtractRequest,
  handleValidationErrors,
};
