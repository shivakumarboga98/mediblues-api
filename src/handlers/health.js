const { successResponse, errorResponse } = require('../utils/response.js');

/**
 * Health check handler
 * GET /health
 * 
 * Returns the health status of the API
 */
const handler = async (event) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.STAGE || 'unknown',
      version: '1.0.0'
    };

    return successResponse(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    return errorResponse('Health check failed', 500);
  }
};

module.exports.handler = handler;
