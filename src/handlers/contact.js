const { successResponse, errorResponse } = require('../utils/response.js');
const { ContactInfo } = require('../models/index.js');

/**
 * GET /contact-info - Get all active contact information
 */
const getContact = async (event) => {
  try {
    const results = await ContactInfo.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']]
    });
    
    if (results.length === 0) {
      return successResponse([]);
    }
    
    return successResponse(results);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return errorResponse('Failed to fetch contact information', 500);
  }
};

/**
 * GET /contact-info/all - Get all contact entries (admin)
 */
const getAllContacts = async (event) => {
  try {
    const results = await ContactInfo.findAll({
      order: [['createdAt', 'DESC']]
    });
    return successResponse(results);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return errorResponse('Failed to fetch contact information', 500);
  }
};

/**
 * POST /contact-info - Create new contact entry
 */
const createContact = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { contact_type, contact_value, description, isActive } = body;

    if (!contact_type || !contact_value) {
      return errorResponse('Contact type and value are required', 400);
    }

    if (!['email', 'mobile'].includes(contact_type)) {
      return errorResponse('Contact type must be either email or mobile', 400);
    }

    // Validate phone format for mobile
    if (contact_type === 'mobile') {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(contact_value.replace(/\s/g, ''))) {
        return errorResponse('Invalid phone number format', 400);
      }
    }

    // Validate email format for email
    if (contact_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact_value)) {
        return errorResponse('Invalid email format', 400);
      }
    }

    const contact = await ContactInfo.create({
      contact_type,
      contact_value,
      description: description || null,
      isActive: isActive !== false
    });

    return successResponse({ 
      id: contact.id, 
      contact_type,
      contact_value,
      description: description || null,
      isActive: isActive !== false
    }, 201);
  } catch (error) {
    console.error('Error saving contact:', error);
    return errorResponse('Failed to save contact information', 500);
  }
};

/**
 * PUT /contact-info/{id} - Update specific contact entry
 */
const updateContact = async (event) => {
  try {
    // Get ID from path parameter or request body
    let id = event.pathParameters?.id;
    let body = JSON.parse(event.body || '{}');
    
    // If ID not in path, it should be in the body
    if (!id && body.id) {
      id = body.id;
    }

    if (!id) {
      return errorResponse('Contact ID is required', 400);
    }

    const contact = await ContactInfo.findByPk(id);
    if (!contact) {
      return errorResponse('Contact entry not found', 404);
    }

    const { contact_type, contact_value, description, isActive } = body;
    const updateData = {};

    if (contact_type !== undefined) {
      if (!['email', 'mobile'].includes(contact_type)) {
        return errorResponse('Contact type must be either email or mobile', 400);
      }
      updateData.contact_type = contact_type;
    }

    if (contact_value !== undefined) {
      // Validate based on type
      const typeToCheck = contact_type || contact.contact_type;
      if (typeToCheck === 'mobile') {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(contact_value.replace(/\s/g, ''))) {
          return errorResponse('Invalid phone number format', 400);
        }
      } else if (typeToCheck === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact_value)) {
          return errorResponse('Invalid email format', 400);
        }
      }
      updateData.contact_value = contact_value;
    }

    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    await contact.update(updateData);

    // Fetch updated contact with all attributes
    const updatedContact = await ContactInfo.findByPk(id, {
      attributes: ['id', 'contact_type', 'contact_value', 'description', 'isActive', 'createdAt', 'updatedAt']
    });

    return successResponse(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return errorResponse('Failed to update contact information', 500);
  }
};

/**
 * DELETE /contact-info/{id} - Delete contact entry
 */
const deleteContact = async (event) => {
  try {
    const { id } = event.pathParameters;

    const contact = await ContactInfo.findByPk(id);
    if (!contact) {
      return errorResponse('Contact entry not found', 404);
    }

    await contact.destroy();
    return successResponse({ message: 'Contact entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return errorResponse('Failed to delete contact information', 500);
  }
};

/**
 * POST /contact - Contact form handler
 * Accepts contact form submissions
 * Expected body: { name, email, message }
 */
const handler = async (event) => {
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

    // Log the contact submission
    console.log('Contact form submission:', {
      name,
      email,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

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
    console.error('Error processing contact form:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }
    
    return errorResponse('Failed to process contact form', 500);
  }
};

module.exports.getContact = getContact;
module.exports.getAllContacts = getAllContacts;
module.exports.createContact = createContact;
module.exports.updateContact = updateContact;
module.exports.deleteContact = deleteContact;
module.exports.handler = handler;
