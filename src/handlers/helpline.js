import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../utils/database.js';

/**
 * GET /helpline - Get current helpline number
 */
export const getHelpline = async (event) => {
  try {
    const results = await query('SELECT * FROM helpline WHERE isActive = true LIMIT 1');
    
    if (results.length === 0) {
      return successResponse({ phone: null, description: null, isActive: false });
    }
    
    return successResponse(results[0]);
  } catch (error) {
    console.error('Error fetching helpline:', error);
    return errorResponse('Failed to fetch helpline number', 500);
  }
};

/**
 * GET /helpline/all - Get all helpline entries (admin)
 */
export const getAllHelplines = async (event) => {
  try {
    const results = await query('SELECT * FROM helpline ORDER BY createdAt DESC');
    return successResponse(results);
  } catch (error) {
    console.error('Error fetching helplines:', error);
    return errorResponse('Failed to fetch helpline numbers', 500);
  }
};

/**
 * POST /helpline - Create or update helpline
 */
export const createHelpline = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { phone, description, isActive } = body;

    if (!phone) {
      return errorResponse('Phone number is required', 400);
    }

    // Check if helpline already exists
    const existing = await query('SELECT * FROM helpline LIMIT 1');
    
    if (existing.length > 0) {
      // Update existing
      await query(
        'UPDATE helpline SET phone = ?, description = ?, isActive = ? WHERE id = ?',
        [phone, description || null, isActive !== false, existing[0].id]
      );
      return successResponse({ id: existing[0].id, phone, description, isActive: isActive !== false });
    } else {
      // Create new
      const result = await query(
        'INSERT INTO helpline (phone, description, isActive) VALUES (?, ?, ?)',
        [phone, description || null, isActive !== false]
      );
      return successResponse({ 
        id: result.insertId, 
        phone, 
        description, 
        isActive: isActive !== false 
      }, 201);
    }
  } catch (error) {
    console.error('Error saving helpline:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('This phone number already exists', 400);
    }
    return errorResponse('Failed to save helpline number', 500);
  }
};

/**
 * PUT /helpline/{id} - Update specific helpline entry
 */
export const updateHelpline = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');

    // Check if helpline exists
    const existing = await query('SELECT * FROM helpline WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Helpline entry not found', 404);
    }

    const { phone, description, isActive } = body;
    const updateFields = [];
    const updateValues = [];

    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (isActive !== undefined) { updateFields.push('isActive = ?'); updateValues.push(isActive); }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updateValues.push(id);
    await query(`UPDATE helpline SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    return successResponse({ id, ...body });
  } catch (error) {
    console.error('Error updating helpline:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('This phone number already exists', 400);
    }
    return errorResponse('Failed to update helpline number', 500);
  }
};

/**
 * DELETE /helpline/{id} - Delete helpline entry
 */
export const deleteHelpline = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Check if helpline exists
    const existing = await query('SELECT * FROM helpline WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Helpline entry not found', 404);
    }

    await query('DELETE FROM helpline WHERE id = ?', [id]);
    return successResponse({ message: 'Helpline entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting helpline:', error);
    return errorResponse('Failed to delete helpline number', 500);
  }
};
