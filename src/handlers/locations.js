const { successResponse, errorResponse } = require('../utils/response.js');
const { Location, Doctor, Department } = require('../models/index.js');
const { protectedEndpoint } = require('./adminAuth.js');

/**
 * GET /locations - Get all locations with full details (Public read)
 */
const getLocationsHandler = async (event) => {
  try {
    const locations = await Location.findAll({
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
 * GET /locations/list/simple - Get all locations with minimal data (Public read)
 */
const getLocationsSimpleHandler = async (event) => {
  try {
    const locations = await Location.findAll({
      attributes: ['id', 'name', 'address', 'phone', 'email'],
      where: { enabled: true },
      order: [['name', 'ASC']]
    });

    return successResponse(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return errorResponse('Failed to fetch locations', 500);
  }
};

/**
 * GET /locations/{id} - Get single location with related data (Public read)
 */
const getLocationHandler = async (event) => {
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
 * POST /locations - Create new location (Admin only - JWT protected)
 */
const createLocationHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} creating location`);
    
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
 * PUT /locations/{id} or POST /locations/update - Update location (Admin only - JWT protected)
 */
const updateLocationHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} updating location`);
    
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
 * DELETE /locations/{id} - Delete location (Admin only - JWT protected)
 */
const deleteLocationHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} deleting location`);
    
    const { id } = event.pathParameters;

    const location = await Location.findByPk(id);
    if (!location) {
      return errorResponse('Location not found', 404);
    }

    await location.destroy();
    return successResponse({ message: 'Location and all related doctors/relationships deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return errorResponse('Failed to delete location', 500);
  }
};

// Export handlers
module.exports.getLocations = getLocationsHandler;
module.exports.getLocationsSimple = getLocationsSimpleHandler;
module.exports.getLocation = getLocationHandler;
module.exports.createLocation = protectedEndpoint(createLocationHandler);
module.exports.updateLocation = protectedEndpoint(updateLocationHandler);
module.exports.deleteLocation = protectedEndpoint(deleteLocationHandler);
