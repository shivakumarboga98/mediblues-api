const { successResponse, errorResponse } = require('../utils/response.js');
const { Department, Location, Doctor } = require('../models/index.js');
const { protectedEndpoint } = require('./adminAuth.js');

/**
 * GET /departments - Get all departments with full details (Public read - excludes soft-deleted)
 */
const getDepartmentsHandler = async (event) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'expertise', 'whyChoose', 'faqs', 'isActive', 'createdAt', 'updatedAt'],
      where: { isActive: true },
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
 * GET /admin/departments - Get all departments including soft-deleted (Admin only - JWT protected)
 */
const getAdminDepartmentsHandler = async (event) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'expertise', 'whyChoose', 'faqs', 'isActive', 'createdAt', 'updatedAt'],
      // NO where clause - returns all departments (active and deleted)
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
 * GET /departments/{id} - Get single department (Public read - excludes soft-deleted)
 */
const getDepartmentHandler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { id } = body;

    if (!id) {
      return errorResponse('Department ID is required', 400);
    }

    const department = await Department.findByPk(id, {
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'expertise', 'whyChoose', 'faqs', 'isActive', 'createdAt', 'updatedAt'],
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

    // Check if department is soft-deleted (public access only)
    if (!department.isActive) {
      return errorResponse('Department not found', 404);
    }

    return successResponse(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return errorResponse('Failed to fetch department', 500);
  }
};

/**
 * POST /departments - Create new department (Admin only - JWT protected)
 */
const createDepartmentHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} creating department`);
    
    const body = JSON.parse(event.body || '{}');
    const { 
      name, 
      heading,
      description, 
      image,
      overview,
      achievements,
      legacy,
      treatments,
      facilities,
      expertise,
      whyChoose,
      faqs,
      locations 
    } = body;

    if (!name) {
      return errorResponse('Department name is required', 400);
    }

    const department = await Department.create({
      name,
      heading: heading || null,
      description: description || null,
      image: image || null,
      overview: overview || null,
      achievements: achievements || null,
      legacy: legacy || null,
      treatments: treatments || [],
      facilities: facilities || [],
      expertise: expertise || null,
      whyChoose: whyChoose || [],
      faqs: faqs || []
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

    // Fetch created department with all associations
    const createdDepartment = await Department.findByPk(department.id, {
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'expertise', 'whyChoose', 'faqs', 'isActive', 'createdAt', 'updatedAt'],
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

    return successResponse(createdDepartment, 201);
  } catch (error) {
    console.error('Error creating department:', error);
    return errorResponse('Failed to create department', 500);
  }
};

/**
 * PUT /departments/update - Update department (Admin only - JWT protected)
 */
const updateDepartmentHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} updating department`);
    
    let body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body;
    const { id } = body;

    if (!id) {
      return errorResponse('Department ID is required', 400);
    }

    console.log('Updating department with ID:', id, 'Data:', body);

    const department = await Department.findOne({ where: { id: id } });
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    const { 
      name, 
      heading, 
      description, 
      image, 
      overview,
      achievements,
      legacy,
      treatments,
      facilities,
      expertise,
      whyChoose,
      faqs,
      locations, 
      isActive 
    } = body;

    // Update department fields (including isActive for soft delete/restore)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (heading !== undefined) updateData.heading = heading;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (overview !== undefined) updateData.overview = overview;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (legacy !== undefined) updateData.legacy = legacy;
    if (treatments !== undefined) updateData.treatments = treatments;
    if (facilities !== undefined) updateData.facilities = facilities;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (whyChoose !== undefined) updateData.whyChoose = whyChoose;
    if (faqs !== undefined) updateData.faqs = faqs;
    if (isActive !== undefined) updateData.isActive = isActive;

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
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'expertise', 'whyChoose', 'faqs', 'isActive', 'createdAt', 'updatedAt'],
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
 * POST /admin/departments/{id} - Update department content (Admin only - JWT protected)
 */
const updateDepartmentContentHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} updating department content`);
    
    const body = JSON.parse(event.body || '{}');
    const { id } = body;

    if (!id) {
      return errorResponse('Department ID is required', 400);
    }

    const department = await Department.findByPk(id);
    if (!department) {
      return errorResponse('Department not found', 404);
    }

    const { overview, achievements, legacy, treatments, facilities, expertise, whyChoose, faqs } = body;

    // Update fields if provided
    const updateData = {};
    if (overview !== undefined) updateData.overview = overview;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (legacy !== undefined) updateData.legacy = legacy;
    if (treatments !== undefined) updateData.treatments = treatments;
    if (facilities !== undefined) updateData.facilities = facilities;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (whyChoose !== undefined) updateData.whyChoose = whyChoose;
    if (faqs !== undefined) updateData.faqs = faqs;

    if (Object.keys(updateData).length > 0) {
      await department.update(updateData);
    }

    // Fetch and return updated department
    const updatedDepartment = await Department.findByPk(id, {
      attributes: ['id', 'name', 'heading', 'description', 'image', 'overview', 'achievements', 'legacy', 'treatments', 'facilities', 'expertise', 'whyChoose', 'faqs', 'isActive', 'createdAt', 'updatedAt']
    });

    return successResponse(updatedDepartment);
  } catch (error) {
    console.error('Error updating department content:', error);
    return errorResponse('Failed to update department content', 500);
  }
};

// Export handlers
module.exports.getDepartments = getDepartmentsHandler;
module.exports.getAdminDepartments = protectedEndpoint(getAdminDepartmentsHandler);
module.exports.getDepartment = getDepartmentHandler;
module.exports.createDepartment = protectedEndpoint(createDepartmentHandler);
module.exports.updateDepartment = protectedEndpoint(updateDepartmentHandler);
module.exports.updateDepartmentContent = protectedEndpoint(updateDepartmentContentHandler);
