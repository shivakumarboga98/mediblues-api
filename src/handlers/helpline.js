const { successResponse, errorResponse } = require('../utils/response.js');
const { Helpline } = require('../models/index.js');

/**
 * GET /contact-info - Get all active contact information
 */
const getContact = async (event) => {
  try {
    const results = await Helpline.findAll({
      where: { is_active: true },
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
    const results = await Helpline.findAll({
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
    const { name, phone, is_active } = body;

    if (!name || !phone) {
      return errorResponse('Name and phone are required', 400);
    }

    // Validate phone format
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return errorResponse('Invalid phone number format', 400);
    }

    const helpline = await Helpline.create({
      name,
      phone,
      is_active: is_active !== false
    });

    return successResponse({ 
      id: helpline.id, 
      name, 
      phone,
      is_active: is_active !== false 
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
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');

    const helpline = await Helpline.findByPk(id);
    if (!helpline) {
      return errorResponse('Contact entry not found', 404);
    }

    const { name, phone, is_active } = body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return errorResponse('Invalid phone number format', 400);
      }
      updateData.phone = phone;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    await helpline.update(updateData);
    return successResponse({ id, ...body });
  } catch (error) {
    console.error('Error updating contact:', error);
    return errorResponse('Failed to update contact information', 500);
  }
};

/**
 * DELETE /contact/{id} - Delete contact entry
 */
const deleteContact = async (event) => {
  try {
    const { id } = event.pathParameters;

    const helpline = await Helpline.findByPk(id);
    if (!helpline) {
      return errorResponse('Contact entry not found', 404);
    }

    await helpline.destroy();
    return successResponse({ message: 'Contact entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return errorResponse('Failed to delete contact information', 500);
  }
};

module.exports.getContact = getContact;
module.exports.getAllContacts = getAllContacts;
module.exports.createContact = createContact;
module.exports.updateContact = updateContact;
module.exports.deleteContact = deleteContact;
