/**
 * Admin Authentication Handler
 * Handles admin login and JWT token generation
 */

const jwt = require('jsonwebtoken');

// In production, store these in environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mediblues.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123'; // Change this in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Admin Login Handler
 */
module.exports.adminLogin = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'error',
          message: 'Email and password are required',
        }),
      };
    }

    // Verify credentials (in production, hash passwords and store in database)
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      console.warn(`Failed login attempt for email: ${email}`);
      return {
        statusCode: 401,
        body: JSON.stringify({
          status: 'error',
          message: 'Invalid email or password',
        }),
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: ADMIN_EMAIL,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'Login successful',
        token,
        admin: {
          email: ADMIN_EMAIL,
          name: 'Administrator',
          role: 'admin',
        },
      }),
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};

/**
 * JWT Verification Middleware
 * Use this to protect admin endpoints
 */
module.exports.verifyAdminToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Remove "Bearer " prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return { valid: false, error: error.message };
  }
};

/**
 * Protected Endpoint Wrapper
 * Wrap this around admin endpoint handlers
 */
module.exports.protectedEndpoint = (handler) => {
  return async (event) => {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          status: 'error',
          message: 'No authorization token provided',
        }),
      };
    }

    const verification = module.exports.verifyAdminToken(authHeader);

    if (!verification.valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          status: 'error',
          message: 'Invalid or expired token',
          error: verification.error,
        }),
      };
    }

    // Add admin info to event for use in handler
    event.admin = verification.decoded;

    // Call the actual handler
    return handler(event);
  };
};
