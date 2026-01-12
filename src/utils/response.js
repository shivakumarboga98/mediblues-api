/**
 * Utility functions for standardized API responses
 */

/**
 * Create a success response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Lambda response object
 */
const successResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': generateRequestId(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Type, X-Is-Base64'
    },
    body: JSON.stringify(data)
  };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 * @returns {Object} Lambda response object
 */
const errorResponse = (message, statusCode = 500, details = null) => {
  const errorBody = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  if (details) {
    errorBody.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': generateRequestId(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Type, X-Is-Base64'
    },
    body: JSON.stringify(errorBody)
  };
};

/**
 * Generate a unique request ID
 * @returns {string} Unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = { successResponse, errorResponse };
