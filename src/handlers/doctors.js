import { successResponse, errorResponse } from '../utils/response.js';
import { Doctor, Location, Department, DoctorSpecialization } from '../models/index.js';

/**
 * GET /doctors - Get all doctors with full details
 */
export const getDoctors = async (event) => {
  try {
    const doctors = await Doctor.findAll({
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
          through: { attributes: [] },
          required: false
        },
        {
          model: DoctorSpecialization,
          as: 'specializations',
          attributes: ['specialization'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedDoctors = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      qualifications: Array.isArray(doc.qualifications) ? doc.qualifications : (doc.qualifications ? JSON.parse(doc.qualifications) : []),
      experience: doc.experience,
      image: doc.image,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      location_id: doc.location_id,
      location: doc.location,
      departments: doc.departments,
      specializations: doc.specializations.map(s => s.specialization)
    }));

    return successResponse(formattedDoctors);
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
    
    const doctor = await Doctor.findByPk(id, {
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
        },
        {
          model: DoctorSpecialization,
          as: 'specializations',
          attributes: ['specialization'],
          required: false
        }
      ]
    });

    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    return successResponse({
      id: doctor.id,
      name: doctor.name,
      qualifications: Array.isArray(doctor.qualifications) ? doctor.qualifications : (doctor.qualifications ? JSON.parse(doctor.qualifications) : []),
      experience: doctor.experience,
      image: doctor.image,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      location_id: doctor.location_id,
      location: doctor.location,
      departments: doctor.departments,
      specializations: doctor.specializations.map(s => s.specialization)
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
 * PUT /doctors/{id} - Update doctor
 */
export const updateDoctor = async (event) => {
  try {
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
 * DELETE /doctors/{id} - Delete doctor
 */
export const deleteDoctor = async (event) => {
  try {
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
