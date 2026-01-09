import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../utils/database.js';

/**
 * GET /departments - Get all departments
 */
export const getDepartments = async (event) => {
  try {
    const results = await query('SELECT * FROM departments ORDER BY createdAt DESC');
    
    // Get locations for each department
    const departmentsWithLocations = await Promise.all(results.map(async (dept) => {
      const locations = await query(`
        SELECT l.* FROM locations l
        INNER JOIN department_locations dl ON l.id = dl.location_id
        WHERE dl.department_id = ?
      `, [dept.id]);
      
      return {
        ...dept,
        locations: locations
      };
    }));
    
    return successResponse(departmentsWithLocations);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return errorResponse('Failed to fetch departments', 500);
  }
};

/**
 * GET /departments/{id} - Get single department
 */
export const getDepartment = async (event) => {
  try {
    const { id } = event.pathParameters;
    const results = await query('SELECT * FROM departments WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return errorResponse('Department not found', 404);
    }
    
    const dept = results[0];
    const locations = await query(`
      SELECT l.* FROM locations l
      INNER JOIN department_locations dl ON l.id = dl.location_id
      WHERE dl.department_id = ?
    `, [dept.id]);
    
    return successResponse({
      ...dept,
      locations: locations
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return errorResponse('Failed to fetch department', 500);
  }
};

/**
 * POST /departments - Create new department
 */
export const createDepartment = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, heading, description, locations, image } = body;

    if (!name) {
      return errorResponse('Department name is required', 400);
    }

    const result = await query(
      'INSERT INTO departments (name, heading, description, image) VALUES (?, ?, ?, ?)',
      [name, heading || null, description || null, image || null]
    );

    const deptId = result.insertId;

    // Add locations via junction table
    if (locations && locations.length > 0) {
      for (const locationId of locations) {
        await query(
          'INSERT INTO department_locations (department_id, location_id) VALUES (?, ?)',
          [deptId, locationId]
        );
      }
    }

    return successResponse({ 
      id: deptId, 
      ...body,
      locations: locations || []
    }, 201);
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('Department name already exists', 400);
    }
    return errorResponse('Failed to create department', 500);
  }
};

/**
 * PUT /departments/{id} - Update department
 */
export const updateDepartment = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');

    // Check if department exists
    const existing = await query('SELECT * FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Department not found', 404);
    }

    const { name, heading, description, locations, image } = body;
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (heading !== undefined) { updateFields.push('heading = ?'); updateValues.push(heading); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (image !== undefined) { updateFields.push('image = ?'); updateValues.push(image); }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await query(`UPDATE departments SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    // Update locations if provided
    if (locations !== undefined) {
      // Delete existing locations
      await query('DELETE FROM department_locations WHERE department_id = ?', [id]);
      
      // Add new locations
      if (locations.length > 0) {
        for (const locationId of locations) {
          await query(
            'INSERT INTO department_locations (department_id, location_id) VALUES (?, ?)',
            [id, locationId]
          );
        }
      }
    }

    return successResponse({ id, ...body });
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('Department name already exists', 400);
    }
    return errorResponse('Failed to update department', 500);
  }
};

/**
 * DELETE /departments/{id} - Delete department
 */
export const deleteDepartment = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Check if department exists
    const existing = await query('SELECT * FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Department not found', 404);
    }

    // Delete will cascade to department_locations and doctor_departments via FK
    await query('DELETE FROM departments WHERE id = ?', [id]);
    return successResponse({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return errorResponse('Failed to delete department', 500);
  }
};
