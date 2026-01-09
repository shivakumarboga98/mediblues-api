import { successResponse, errorResponse } from '../utils/response.js';
import { Location, Doctor, Department } from '../models/index.js';

/**
 * GET /locations - Get all locations with full details
 */
export const getLocations = async (event) => {
  try {
    const locations = await Location.findAll({
      attributes: ['id', 'name', 'address', 'phone', 'email', 'enabled', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Doctor,
          as: 'doctors',
          attributes: ['id', 'name'],  // Keep this
          required: false
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name'],
          through: { attributes: [] }, // This is correct for departments, since many-to-many
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });


    return successResponse(locations);
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

    const location = await Location.findByPk(id, {
      attributes: ['id', 'name', 'address', 'phone', 'email', 'enabled', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Doctor,
          as: 'doctors',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    if (!location) {
      return errorResponse('Location not found', 404);
    }

    return successResponse(location);
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
    const { name, address, phone, email } = body;

    if (!name || !address || !phone || !email) {
      return errorResponse('Missing required fields', 400);
    }

    const location = await Location.create({
      name,
      address,
      phone,
      email
    });

    return successResponse({
      id: location.id,
      name: location.name,
      address: location.address,
      phone: location.phone,
      email: location.email,
      doctors: [],
      departments: []
    }, 201);
  } catch (error) {
    console.error('Error creating location:', error);
    return errorResponse('Failed to create location', 500);
  }
};

/**
 * PUT /locations/{id} or POST /locations/update - Update location
 */
export const updateLocation = async (event) => {
  try {
    // Get ID from path parameter or request body
    let id = event.pathParameters?.id;
    let body = JSON.parse(event.body || '{}');

    // If ID not in path, it should be in the body
    if (!id && body.id) {
      id = body.id;
    }

    if (!id) {
      return errorResponse('Location ID is required', 400);
    }

    const location = await Location.findByPk(id);
    if (!location) {
      return errorResponse('Location not found', 404);
    }

    const { name, address, phone, email, enabled } = body;

    // Update location fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (enabled !== undefined) updateData.enabled = enabled;

    if (Object.keys(updateData).length > 0) {
      await location.update(updateData);
    }

    // Fetch updated location with all attributes
    const updatedLocation = await Location.findByPk(id, {
      attributes: ['id', 'name', 'address', 'phone', 'email', 'enabled', 'createdAt', 'updatedAt']
    });

    return successResponse(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    return errorResponse('Failed to update location', 500);
  }
};

/**
 * DELETE /locations/{id} - Delete location (cascades to all related doctors and their relationships)
 */
export const deleteLocation = async (event) => {
  try {
    const { id } = event.pathParameters;

    const location = await Location.findByPk(id);
    if (!location) {
      return errorResponse('Location not found', 404);
    }

    // Delete will cascade to:
    // - doctors assigned to this location
    // - doctor_departments (via cascade delete of doctors)
    // - doctor_specializations (via cascade delete of doctors)
    // - department_locations entries
    await location.destroy();
    return successResponse({ message: 'Location and all related doctors/relationships deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return errorResponse('Failed to delete location', 500);
  }
};
