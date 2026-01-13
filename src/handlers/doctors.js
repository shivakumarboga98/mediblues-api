const { successResponse, errorResponse } = require('../utils/response.js');
const { Doctor, Location, Department, DoctorSpecialization } = require('../models/index.js');
const { protectedEndpoint } = require('./adminAuth.js');

/**
 * GET /doctors - Get all doctors with full details (Public read)
 * Supports pagination via query parameters: limit and offset
 */
const getDoctorsHandler = async (event) => {
  try {
    // Get pagination parameters from query string
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : null;
    const offset = event.queryStringParameters?.offset ? parseInt(event.queryStringParameters.offset) : 0;

    const queryOptions = {
      attributes: ['id', 'name', 'qualifications', 'experience', 'image', 'availability', 'location_id', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false
        },
        {
          model: DoctorSpecialization,
          as: 'specializations',
          attributes: ['specialization'],
          required: false,
          raw: false
        }
      ],
      order: [['experience', 'DESC']],
      subQuery: false,
      raw: false
    };

    // Add pagination if limit is provided
    if (limit !== null) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    // Get total count for pagination info
    const totalCount = await Doctor.count();

    const doctors = await Doctor.findAll(queryOptions);

    const formattedDoctors = doctors.map(doc => {
      const docData = doc.toJSON ? doc.toJSON() : doc;
      return {
        id: docData.id,
        name: docData.name,
        qualifications: Array.isArray(docData.qualifications) ? docData.qualifications : (docData.qualifications ? JSON.parse(docData.qualifications) : []),
        experience: docData.experience,
        image: docData.image,
        availability: docData.availability,
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
        location_id: docData.location_id,
        location: docData.location || null,
        departments: Array.isArray(docData.departments) ? docData.departments : [],
        specializations: Array.isArray(docData.specializations) 
          ? docData.specializations.map(s => s.specialization || s)
          : []
      };
    });

    // Return with pagination metadata if limit was used
    if (limit !== null) {
      return successResponse({
        doctors: formattedDoctors,
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          hasMore: (offset + limit) < totalCount
        }
      });
    }

    return successResponse(formattedDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return errorResponse('Failed to fetch doctors', 500, { message: error.message });
  }
};

/**
 * GET /doctors/{id} - Get single doctor (Public read)
 */
const getDoctorHandler = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const doctor = await Doctor.findByPk(id, {
      attributes: ['id', 'name', 'qualifications', 'experience', 'image', 'availability', 'location_id', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false
        },
        {
          model: DoctorSpecialization,
          as: 'specializations',
          attributes: ['specialization'],
          required: false,
          raw: false
        }
      ],
      subQuery: false,
      raw: false
    });

    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    const docData = doctor.toJSON ? doctor.toJSON() : doctor;
    return successResponse({
      id: docData.id,
      name: docData.name,
      qualifications: Array.isArray(docData.qualifications) ? docData.qualifications : (docData.qualifications ? JSON.parse(docData.qualifications) : []),
      experience: docData.experience,
      image: docData.image,
      availability: docData.availability,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
      location_id: docData.location_id,
      location: docData.location || null,
      departments: Array.isArray(docData.departments) ? docData.departments : [],
      specializations: Array.isArray(docData.specializations)
        ? docData.specializations.map(s => s.specialization || s)
        : []
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return errorResponse('Failed to fetch doctor', 500, { message: error.message });
  }
};

/**
 * GET /doctors/search - Search doctors by name, specialization, department, or location
 * Query parameters: q (search query), department (department ID), location (location ID)
 */
const searchDoctorsHandler = async (event) => {
  try {
    const query = event.queryStringParameters?.q || '';
    const departmentId = event.queryStringParameters?.department;
    const locationId = event.queryStringParameters?.location;

    // Build where clause for search
    const { Op } = require('sequelize');
    const whereClause = {};

    // Search by doctor name (using Op.like for MySQL compatibility)
    if (query) {
      whereClause.name = { [Op.like]: `%${query}%` };
    }

    // Filter by location
    if (locationId) {
      whereClause.location_id = locationId;
    }

    const queryOptions = {
      attributes: ['id', 'name', 'qualifications', 'experience', 'image', 'availability', 'location_id', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false
        },
        {
          model: DoctorSpecialization,
          as: 'specializations',
          attributes: ['specialization'],
          required: false,
          raw: false
        }
      ],
      where: whereClause,
      order: [['id', 'DESC']],
      subQuery: false,
      raw: false,
      distinct: true
    };

    // Add department filter if provided - this requires the department relation
    if (departmentId) {
      queryOptions.include[1] = {
        model: Department,
        as: 'departments',
        attributes: ['id', 'name'],
        where: { id: departmentId },
        through: { attributes: [] },
        required: true
      };
    }

    // Search in specializations if query provided
    if (query) {
      queryOptions.include[2] = {
        model: DoctorSpecialization,
        as: 'specializations',
        attributes: ['specialization'],
        where: { specialization: { [Op.like]: `%${query}%` } },
        required: false,
        raw: false
      };
    }

    let doctors = await Doctor.findAll(queryOptions);

    // If query provided, filter by specialization match as well (to handle OR condition)
    if (query) {
      // First, find doctors by name (already done via where clause)
      // Now also find doctors by specialization
      const docsBySpecialization = await Doctor.findAll({
        attributes: ['id', 'name', 'qualifications', 'experience', 'image', 'availability', 'location_id', 'createdAt', 'updatedAt'],
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'address', 'phone', 'email']
          },
          {
            model: Department,
            as: 'departments',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            required: departmentId ? true : false,
            where: departmentId ? { id: departmentId } : undefined
          },
          {
            model: DoctorSpecialization,
            as: 'specializations',
            attributes: ['specialization'],
            where: { specialization: { [Op.like]: `%${query}%` } },
            required: true,
            raw: false
          }
        ],
        where: locationId ? { location_id: locationId } : {},
        order: [['id', 'DESC']],
        subQuery: false,
        raw: false,
        distinct: true
      });

      // Combine results and remove duplicates
      const doctorMap = new Map();
      [...doctors, ...docsBySpecialization].forEach(doc => {
        const docId = doc.id;
        if (!doctorMap.has(docId)) {
          doctorMap.set(docId, doc);
        }
      });
      doctors = Array.from(doctorMap.values());
    }

    const formattedDoctors = doctors.map(doc => {
      const docData = doc.toJSON ? doc.toJSON() : doc;
      return {
        id: docData.id,
        name: docData.name,
        qualifications: Array.isArray(docData.qualifications) ? docData.qualifications : (docData.qualifications ? JSON.parse(docData.qualifications) : []),
        experience: docData.experience,
        image: docData.image,
        availability: docData.availability,
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
        location_id: docData.location_id,
        location: docData.location || null,
        departments: Array.isArray(docData.departments) ? docData.departments : [],
        specializations: Array.isArray(docData.specializations) 
          ? docData.specializations.map(s => s.specialization || s)
          : []
      };
    });

    return successResponse(formattedDoctors);
  } catch (error) {
    console.error('Error searching doctors:', error);
    return errorResponse('Failed to search doctors', 500, { message: error.message });
  }
};

/**
 * POST /doctors - Create new doctor (Admin only - JWT protected)
 */
const createDoctorHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} creating doctor`);
    
    const body = JSON.parse(event.body || '{}');
    const { name, qualifications, experience, location_id, departments, specializations, image } = body;

    if (!name) {
      return errorResponse('Doctor name is required', 400);
    }
    
    if (!location_id) {
      return errorResponse('Location ID is required', 400);
    }

    // Verify location exists
    const location = await Location.findByPk(location_id);
    if (!location) {
      return errorResponse('Location not found', 404);
    }

    // Create doctor
    const doctor = await Doctor.create({
      name,
      qualifications: qualifications || [],
      experience: experience || null,
      location_id,
      image: image || null
    });

    // Add departments
    if (departments && departments.length > 0) {
      const validDepts = await Department.findAll({
        where: { id: departments },
        attributes: ['id']
      });
      
      if (validDepts.length > 0) {
        await doctor.addDepartments(validDepts.map(d => d.id));
      }
    }

    // Add specializations
    if (specializations && specializations.length > 0) {
      for (const spec of specializations) {
        await DoctorSpecialization.create({
          doctor_id: doctor.id,
          specialization: spec
        });
      }
    }

    return successResponse({ 
      id: doctor.id,
      name: doctor.name,
      qualifications: doctor.qualifications,
      experience: doctor.experience,
      location_id: doctor.location_id,
      image: doctor.image,
      departments: [],
      specializations: specializations || []
    }, 201);
  } catch (error) {
    console.error('Error creating doctor:', error);
    return errorResponse('Failed to create doctor', 500);
  }
};

/**
 * PUT /doctors/{id} - Update doctor (Admin only - JWT protected)
 */
const updateDoctorHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} updating doctor`);
    
    // Get ID from path parameter or request body
    let id = event.pathParameters?.id;
    let body = JSON.parse(event.body || '{}');
    
    // If ID not in path, it should be in the body
    if (!id && body.id) {
      id = body.id;
    }

    if (!id) {
      return errorResponse('Doctor ID is required', 400);
    }

    // Check if doctor exists
    const doctor = await Doctor.findByPk(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    const { name, qualifications, experience, location_id, departments, specializations, image } = body;

    // Validate location if provided
    if (location_id !== undefined) {
      const location = await Location.findByPk(location_id);
      if (!location) {
        return errorResponse('Location not found', 404);
      }
    }

    // Update doctor fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (experience !== undefined) updateData.experience = experience;
    if (location_id !== undefined) updateData.location_id = location_id;
    if (image !== undefined) updateData.image = image;

    if (Object.keys(updateData).length > 0) {
      await doctor.update(updateData);
    }

    // Update departments if provided
    if (departments !== undefined) {
      const validDepts = await Department.findAll({
        where: { id: departments },
        attributes: ['id']
      });
      await doctor.setDepartments(validDepts.map(d => d.id));
    }

    // Update specializations if provided
    if (specializations !== undefined) {
      await DoctorSpecialization.destroy({ where: { doctor_id: id } });
      
      if (specializations.length > 0) {
        for (const spec of specializations) {
          await DoctorSpecialization.create({
            doctor_id: id,
            specialization: spec
          });
        }
      }
    }

    // Fetch updated doctor with all associations and return formatted object
    const updatedDoctor = await Doctor.findByPk(id, {
      attributes: ['id', 'name', 'qualifications', 'experience', 'image', 'location_id', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    return successResponse({
      id: updatedDoctor.id,
      name: updatedDoctor.name,
      qualifications: Array.isArray(updatedDoctor.qualifications) ? updatedDoctor.qualifications : (updatedDoctor.qualifications ? JSON.parse(updatedDoctor.qualifications) : []),
      experience: updatedDoctor.experience,
      image: updatedDoctor.image,
      createdAt: updatedDoctor.createdAt,
      updatedAt: updatedDoctor.updatedAt,
      location_id: updatedDoctor.location_id,
      location: updatedDoctor.location,
      departments: updatedDoctor.departments,
      specializations: updatedDoctor.specializations ? updatedDoctor.specializations.map(s => s.specialization) : []
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return errorResponse('Failed to update doctor', 500);
  }
};

/**
 * DELETE /doctors/{id} - Delete doctor (Admin only - JWT protected)
 */
const deleteDoctorHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} deleting doctor`);
    
    const { id } = event.pathParameters;

    // Check if doctor exists
    const doctor = await Doctor.findByPk(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    await doctor.destroy();
    return successResponse({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return errorResponse('Failed to delete doctor', 500);
  }
};

// Export handlers
module.exports.getDoctors = getDoctorsHandler;
module.exports.getDoctor = getDoctorHandler;
module.exports.searchDoctors = searchDoctorsHandler;
module.exports.createDoctor = protectedEndpoint(createDoctorHandler);
module.exports.updateDoctor = protectedEndpoint(updateDoctorHandler);
module.exports.deleteDoctor = protectedEndpoint(deleteDoctorHandler);
