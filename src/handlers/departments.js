import { successResponse, errorResponse } from '../utils/response.js';
import { Department, Location, Doctor } from '../models/index.js';

/**
 * GET /departments - Get all departments with full details
 */
export const getDepartments = async (event) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'address', 'phone', 'email'],
          through: { attributes: [] },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return successResponse(departments);
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

    const department = await Department.findByPk(id, {
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'address', 'phone', 'email'],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    if (!department) {
      return errorResponse('Department not found', 404);
    }

    return successResponse(department);
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
    const { name, description, locations } = body;

    if (!name) {
      return errorResponse('Department name is required', 400);
    }

    const department = await Department.create({
      name,
      description: description || null
    });

    // Add locations if provided
    if (locations && locations.length > 0) {
      const validLocations = await Location.findAll({
        where: { id: locations },
        attributes: ['id']
      });

      if (validLocations.length > 0) {
        await department.addLocations(validLocations.map(l => l.id));
      }
    }

    return successResponse({
      id: department.id,
      name: department.name,
      description: department.description,
      locations: [],
      doctors: []
    }, 201);
  } catch (error) {
    console.error('Error creating department:', error);
    return errorResponse('Failed to create department', 500);
  }
};

/**
 * PUT /departments/{id} - Update department
 */
export const updateDepartment = async (event) => {
  try {
    // Get ID from path parameter or request body
    let id = event.pathParameters?.id;
    let body = JSON.parse(event.body || '{}');

    console.log('Update Department - Event:', { pathParameters: event.pathParameters, body });

    // If ID not in path, it should be in the body
    if (!id && body.id) {
      id = body.id;
    }

    if (!id) {
      return errorResponse('Department ID is required', 400);
    }

    console.log('Updating department with ID:', id, 'Data:', body);

    const department = await Department.findOne({ where: { id: id } });
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    const { name, heading, description, locations } = body;

    // Update department fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (heading !== undefined) updateData.heading = heading;
    if (description !== undefined) updateData.description = description;

    console.log('Update data to apply:', updateData);

    if (Object.keys(updateData).length > 0) {
      await department.update(updateData);
      console.log('Department updated successfully');
    }

    // Update locations if provided
    if (locations !== undefined) {
      const validLocations = await Location.findAll({
        where: { id: locations },
        attributes: ['id']
      });
      await department.setLocations(validLocations.map(l => l.id));
    }

    // Fetch updated department with all associations
    const updatedDepartment = await Department.findByPk(id, {
      attributes: ['id', 'name', 'heading', 'description', 'image', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'address', 'phone', 'email'],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    return successResponse(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    return errorResponse('Failed to update department', 500);
  }
};

/**
 * PATCH /admin/departments/{id} - Update department content (achievements, treatments, facilities)
 */
export const updateDepartmentContent = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id } = body;

    if (!id) {
      return errorResponse('Department ID is required', 400);
    }

    const department = await Department.findByPk(id);
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    const { overview, achievements, legacy, treatments, facilities } = body;

    // Update fields if provided
    const updateData = {};
    if (overview !== undefined) updateData.overview = overview;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (legacy !== undefined) updateData.legacy = legacy;
    if (treatments !== undefined) updateData.treatments = treatments;
    if (facilities !== undefined) updateData.facilities = facilities;

    if (Object.keys(updateData).length > 0) {
      await department.update(updateData);
    }

    // Fetch and return updated department
    const updatedDepartment = await Department.findByPk(id, {
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'createdAt', 'updatedAt']
    });

    return successResponse(updatedDepartment);
  } catch (error) {
    console.error('Error updating department content:', error);
    return errorResponse('Failed to update department content', 500);
  }
};

/**
 * DELETE /departments/{id} - Delete department
 */
export const deleteDepartment = async (event) => {
  try {
    const { id } = event.pathParameters;

    const department = await Department.findByPk(id);
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    await department.destroy();
    return successResponse({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return errorResponse('Failed to delete department', 500);
  }
};
