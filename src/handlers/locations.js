import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../utils/database.js';

/**
 * GET /locations - Get all locations with related data
 */
export const getLocations = async (event) => {
  try {
    const results = await query('SELECT * FROM locations ORDER BY createdAt DESC');
    
    // Get doctors and departments for each location
    const locationsWithDetails = await Promise.all(results.map(async (loc) => {
      const doctors = await query(`
        SELECT d.* FROM doctors d WHERE d.location_id = ?
      `, [loc.id]);
      
      const departments = await query(`
        SELECT d.* FROM departments d
        INNER JOIN department_locations dl ON d.id = dl.department_id
        WHERE dl.location_id = ?
      `, [loc.id]);
      
      return {
        ...loc,
        doctors: doctors,
        departments: departments
      };
    }));
    
    return successResponse(locationsWithDetails);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return errorResponse('Failed to fetch locations', 500);
  }
};

/**
 * GET /locations/{id} - Get single location with related data
 */
export const getLocation = async (event) => {
  try {
    const { id } = event.pathParameters;
    const results = await query('SELECT * FROM locations WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return errorResponse('Location not found', 404);
    }
    
    const loc = results[0];
    
    // Get doctors at this location
    const doctors = await query(`
      SELECT d.* FROM doctors d WHERE d.location_id = ?
    `, [loc.id]);
    
    // Get departments at this location
    const departments = await query(`
      SELECT d.* FROM departments d
      INNER JOIN department_locations dl ON d.id = dl.department_id
      WHERE dl.location_id = ?
    `, [loc.id]);
    
    return successResponse({
      ...loc,
      doctors: doctors,
      departments: departments
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return errorResponse('Failed to fetch location', 500);
  }
};

/**
 * POST /locations - Create new location
 */
export const createLocation = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, address, phone, email, image, enabled } = body;

    if (!name || !address || !phone || !email) {
      return errorResponse('Missing required fields', 400);
    }

    const result = await query(
      'INSERT INTO locations (name, address, phone, email, image, enabled) VALUES (?, ?, ?, ?, ?, ?)',
      [name, address, phone, email, image || null, enabled !== false]
    );

    return successResponse({ 
      id: result.insertId, 
      name, 
      address, 
      phone, 
      email, 
      image, 
      enabled: enabled !== false 
    }, 201);
  } catch (error) {
    console.error('Error creating location:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('Location name already exists', 400);
    }
    return errorResponse('Failed to create location', 500);
  }
};

/**
 * PUT /locations/{id} - Update location
 */
export const updateLocation = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');
    const { name, address, phone, email, image, enabled } = body;

    // Check if location exists
    const existing = await query('SELECT * FROM locations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Location not found', 404);
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (address !== undefined) { updateFields.push('address = ?'); updateValues.push(address); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email); }
    if (image !== undefined) { updateFields.push('image = ?'); updateValues.push(image); }
    if (enabled !== undefined) { updateFields.push('enabled = ?'); updateValues.push(enabled); }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updateValues.push(id);
    await query(`UPDATE locations SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    return successResponse({ id, ...body });
  } catch (error) {
    console.error('Error updating location:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('Location name already exists', 400);
    }
    return errorResponse('Failed to update location', 500);
  }
};

/**
 * DELETE /locations/{id} - Delete location (cascades to all related doctors and their relationships)
 */
export const deleteLocation = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Check if location exists
    const existing = await query('SELECT * FROM locations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Location not found', 404);
    }

    // Delete will cascade to:
    // - doctors assigned to this location
    // - doctor_departments (via cascade delete of doctors)
    // - doctor_specializations (via cascade delete of doctors)
    // - department_locations entries
    await query('DELETE FROM locations WHERE id = ?', [id]);
    return successResponse({ message: 'Location and all related doctors/relationships deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return errorResponse('Failed to delete location', 500);
  }
};
