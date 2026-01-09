import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../utils/database.js';

/**
 * GET /doctors - Get all doctors
 */
export const getDoctors = async (event) => {
  try {
    const results = await query('SELECT * FROM doctors ORDER BY createdAt DESC');
    
    // Get location and departments for each doctor
    const doctorsWithDetails = await Promise.all(results.map(async (doctor) => {
      const location = await query('SELECT * FROM locations WHERE id = ?', [doctor.location_id]);
      
      const departments = await query(`
        SELECT d.* FROM departments d
        INNER JOIN doctor_departments dd ON d.id = dd.department_id
        WHERE dd.doctor_id = ?
      `, [doctor.id]);
      
      const specializations = await query(`
        SELECT specialization FROM doctor_specializations WHERE doctor_id = ?
      `, [doctor.id]);
      
      return {
        ...doctor,
        location: location.length > 0 ? location[0] : null,
        departments: departments,
        specializations: specializations.map(s => s.specialization),
        qualifications: Array.isArray(doctor.qualifications) ? doctor.qualifications : (doctor.qualifications ? JSON.parse(doctor.qualifications) : [])
      };
    }));
    
    return successResponse(doctorsWithDetails);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return errorResponse('Failed to fetch doctors', 500);
  }
};

/**
 * GET /doctors/{id} - Get single doctor
 */
export const getDoctor = async (event) => {
  try {
    const { id } = event.pathParameters;
    const results = await query('SELECT * FROM doctors WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return errorResponse('Doctor not found', 404);
    }
    
    const doctor = results[0];
    
    // Get location
    const location = await query('SELECT * FROM locations WHERE id = ?', [doctor.location_id]);
    
    // Get departments
    const departments = await query(`
      SELECT d.* FROM departments d
      INNER JOIN doctor_departments dd ON d.id = dd.department_id
      WHERE dd.doctor_id = ?
    `, [doctor.id]);
    
    // Get specializations
    const specializations = await query(`
      SELECT specialization FROM doctor_specializations WHERE doctor_id = ?
    `, [doctor.id]);
    
    return successResponse({
      ...doctor,
      location: location.length > 0 ? location[0] : null,
      departments: departments,
      specializations: specializations.map(s => s.specialization),
      qualifications: Array.isArray(doctor.qualifications) ? doctor.qualifications : (doctor.qualifications ? JSON.parse(doctor.qualifications) : [])
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return errorResponse('Failed to fetch doctor', 500);
  }
};

/**
 * POST /doctors - Create new doctor
 */
export const createDoctor = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, qualifications, experience, location_id, departments, specializations, image } = body;

    if (!name) {
      return errorResponse('Doctor name is required', 400);
    }
    
    if (!location_id) {
      return errorResponse('Location ID is required', 400);
    }

    // Verify location exists
    const locResults = await query('SELECT id FROM locations WHERE id = ?', [location_id]);
    if (locResults.length === 0) {
      return errorResponse('Location not found', 404);
    }

    const result = await query(
      'INSERT INTO doctors (name, qualifications, experience, location_id, image) VALUES (?, ?, ?, ?, ?)',
      [
        name,
        JSON.stringify(qualifications || []),
        experience || null,
        location_id,
        image || null
      ]
    );

    const doctorId = result.insertId;

    // Add departments via junction table
    if (departments && departments.length > 0) {
      for (const deptId of departments) {
        // Verify department exists
        const deptResults = await query('SELECT id FROM departments WHERE id = ?', [deptId]);
        if (deptResults.length > 0) {
          await query(
            'INSERT INTO doctor_departments (doctor_id, department_id) VALUES (?, ?)',
            [doctorId, deptId]
          );
        }
      }
    }

    // Add specializations
    if (specializations && specializations.length > 0) {
      for (const spec of specializations) {
        await query(
          'INSERT INTO doctor_specializations (doctor_id, specialization) VALUES (?, ?)',
          [doctorId, spec]
        );
      }
    }

    return successResponse({ 
      id: doctorId, 
      ...body
    }, 201);
  } catch (error) {
    console.error('Error creating doctor:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return errorResponse('Invalid location_id or department_id', 400);
    }
    return errorResponse('Failed to create doctor', 500);
  }
};

/**
 * PUT /doctors/{id} - Update doctor
 */
export const updateDoctor = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');

    // Check if doctor exists
    const existing = await query('SELECT * FROM doctors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Doctor not found', 404);
    }

    const { name, qualifications, experience, location_id, departments, specializations, image } = body;
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (qualifications !== undefined) { updateFields.push('qualifications = ?'); updateValues.push(JSON.stringify(qualifications)); }
    if (experience !== undefined) { updateFields.push('experience = ?'); updateValues.push(experience); }
    if (location_id !== undefined) {
      // Verify location exists
      const locResults = await query('SELECT id FROM locations WHERE id = ?', [location_id]);
      if (locResults.length === 0) {
        return errorResponse('Location not found', 404);
      }
      updateFields.push('location_id = ?');
      updateValues.push(location_id);
    }
    if (image !== undefined) { updateFields.push('image = ?'); updateValues.push(image); }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await query(`UPDATE doctors SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    // Update departments if provided
    if (departments !== undefined) {
      // Delete existing departments
      await query('DELETE FROM doctor_departments WHERE doctor_id = ?', [id]);
      
      // Add new departments
      if (departments.length > 0) {
        for (const deptId of departments) {
          // Verify department exists
          const deptResults = await query('SELECT id FROM departments WHERE id = ?', [deptId]);
          if (deptResults.length > 0) {
            await query(
              'INSERT INTO doctor_departments (doctor_id, department_id) VALUES (?, ?)',
              [id, deptId]
            );
          }
        }
      }
    }

    // Update specializations if provided
    if (specializations !== undefined) {
      // Delete existing specializations
      await query('DELETE FROM doctor_specializations WHERE doctor_id = ?', [id]);
      
      // Add new specializations
      if (specializations.length > 0) {
        for (const spec of specializations) {
          await query(
            'INSERT INTO doctor_specializations (doctor_id, specialization) VALUES (?, ?)',
            [id, spec]
          );
        }
      }
    }

    return successResponse({ id, ...body });
  } catch (error) {
    console.error('Error updating doctor:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return errorResponse('Invalid location_id or department_id', 400);
    }
    return errorResponse('Failed to update doctor', 500);
  }
};

/**
 * DELETE /doctors/{id} - Delete doctor
 */
export const deleteDoctor = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Check if doctor exists
    const existing = await query('SELECT * FROM doctors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Doctor not found', 404);
    }

    await query('DELETE FROM doctors WHERE id = ?', [id]);
    return successResponse({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return errorResponse('Failed to delete doctor', 500);
  }
};
