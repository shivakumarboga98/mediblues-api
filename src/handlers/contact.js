import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Contact form handler
 * POST /contact
 * 
 * Accepts contact form submissions
 * Expected body: { name, email, message }
 */
export const handler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate required fields
    const { name, email, message } = body;
    
    if (!name || !email || !message) {
      return errorResponse('Missing required fields: name, email, message', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Log the contact submission (in production, you'd save to DB or send email)
    console.log('Contact form submission:', {
      name,
      email,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    // TODO: In production, implement:
    // - Save to DynamoDB
    // - Send email via SES
    // - Send notification via SNS

    return successResponse({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        name,
        email,
        receivedAt: new Date().toISOString()
      }
    }, 201);
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }
    
    return errorResponse('Failed to process contact form', 500);
  }
};
