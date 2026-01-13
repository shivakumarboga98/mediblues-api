const { Appointment, Location, Department, Doctor, Package } = require('../models/index.js');
const { successResponse, errorResponse } = require('../utils/response.js');

const createAppointment = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Determine appointment type (1 = normal, 2 = package)
    const type = body.packageId ? 2 : 1;

    // Validate required fields based on type
    const { fullName, mobileNumber } = body;
    if (!fullName || !mobileNumber) {
      return errorResponse('Missing required fields: fullName, mobileNumber', 400);
    }

    // For normal appointments (type 1)
    if (type === 1) {
      const { location, reasonForVisit, message } = body;
      if (!location || !reasonForVisit || !message) {
        return errorResponse('Missing required fields for appointment: location, reasonForVisit, message', 400);
      }

      // Get location ID from location name
      const locationRecord = await Location.findOne({ where: { name: location } });
      if (!locationRecord) {
        return errorResponse('Invalid location', 400);
      }

      // Get department ID if department is provided
      let departmentId = null;
      if (body.department) {
        const departmentRecord = await Department.findOne({ where: { name: body.department } });
        if (departmentRecord) {
          departmentId = departmentRecord.id;
        }
      }

      // Get doctor ID if doctor is provided
      let doctorId = null;
      if (body.doctor) {
        const doctorRecord = await Doctor.findOne({ where: { name: body.doctor } });
        if (doctorRecord) {
          doctorId = doctorRecord.id;
        }
      }

      // Create normal appointment
      const appointment = await Appointment.create({
        fullName: body.fullName,
        mobileNumber: body.mobileNumber,
        email: body.email || null,
        location_id: locationRecord.id,
        department_id: departmentId,
        doctor_id: doctorId,
        reasonForVisit: body.reasonForVisit,
        message: body.message,
        preferredDate: body.preferredDate || null,
        preferredTime: body.preferredTime || null,
        status: 'pending',
        package_id: null,
        type: 1
      });

      console.log('Normal appointment created:', appointment);
      return successResponse({
        success: true,
        message: 'Appointment created successfully',
        data: appointment
      }, 201);
    }
    
    // For package bookings (type 2)
    else {
      const { packageId } = body;
      if (!packageId) {
        return errorResponse('Missing packageId for package booking', 400);
      }

      // Validate package exists
      const pkg = await Package.findByPk(packageId);
      if (!pkg) {
        return errorResponse('Invalid package', 400);
      }

      // Get location ID if location is provided
      let locationId = null;
      if (body.location) {
        const locationRecord = await Location.findOne({ where: { name: body.location } });
        if (locationRecord) {
          locationId = locationRecord.id;
        }
      }

      // Create package booking
      const appointment = await Appointment.create({
        fullName: body.fullName,
        mobileNumber: body.mobileNumber,
        email: body.email || null,
        location_id: locationId,
        department_id: null,
        doctor_id: null,
        reasonForVisit: `Health Check Package: ${pkg.name}`,
        message: body.notes || '',
        preferredDate: body.preferredDate || null,
        preferredTime: body.preferredTime || null,
        status: 'pending',
        package_id: packageId,
        type: 2
      });

      console.log('Package booking created:', appointment);
      return successResponse({
        success: true,
        message: 'Package booking created successfully',
        data: appointment
      }, 201);
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    return errorResponse(error.message, 500);
  }
};

const getAppointments = async (event) => {
  try {
    // Get pagination and filter params from request body
    const body = JSON.parse(event.body || '{}');
    const limit = parseInt(body.limit) || 10;
    const offset = parseInt(body.offset) || 0;

    // Get filter params
    const location_id = body.location_id ? parseInt(body.location_id) : null;
    const department_id = body.department_id ? parseInt(body.department_id) : null;
    const type = body.type ? parseInt(body.type) : null;
    const status = body.status || null;
    const startDate = body.startDate;
    const endDate = body.endDate;

    // Build where clause for filtering
    const where = {};
    if (location_id) where.location_id = location_id;
    if (department_id) where.department_id = department_id;
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate) {
      where.preferredDate = { [require('sequelize').Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      if (where.preferredDate) {
        where.preferredDate[require('sequelize').Op.lte] = endDateTime;
      } else {
        where.preferredDate = { [require('sequelize').Op.lte]: endDateTime };
      }
    }

    // Get total count for pagination
    const total = await Appointment.count({ where });

    // Fetch appointments with pagination and filters
    const appointments = await Appointment.findAll({
      where,
      include: [
        { association: 'location', attributes: ['id', 'name'] },
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'doctor', attributes: ['id', 'name'] },
        { association: 'package', attributes: ['id', 'name', 'price'] }
      ],
      order: [['preferredDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset
    });

    return successResponse({
      success: true,
      data: appointments,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return errorResponse(error.message, 500);
  }
};

const getAppointmentById = async (event) => {
  try {
    const { id } = event.pathParameters;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { association: 'location', attributes: ['id', 'name'] },
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'doctor', attributes: ['id', 'name'] },
        { association: 'package', attributes: ['id', 'name', 'price'] }
      ]
    });

    if (!appointment) {
      return errorResponse('Appointment not found', 404);
    }

    return successResponse({
      success: true,
      data: appointment
    }, 200);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return errorResponse(error.message, 500);
  }
};

const updateAppointment = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return errorResponse('Appointment not found', 404);
    }

    // Update fields if provided
    if (body.fullName) appointment.fullName = body.fullName;
    if (body.mobileNumber) appointment.mobileNumber = body.mobileNumber;
    if (body.email !== undefined) appointment.email = body.email;
    if (body.reasonForVisit) appointment.reasonForVisit = body.reasonForVisit;
    if (body.message) appointment.message = body.message;
    if (body.preferredDate) appointment.preferredDate = body.preferredDate;
    if (body.preferredTime) appointment.preferredTime = body.preferredTime;
    if (body.status) appointment.status = body.status;

    // Update IDs if provided
    if (body.location) {
      const locationRecord = await Location.findOne({ where: { name: body.location } });
      if (locationRecord) appointment.location_id = locationRecord.id;
    }
    if (body.department) {
      const departmentRecord = await Department.findOne({ where: { name: body.department } });
      if (departmentRecord) appointment.department_id = departmentRecord.id;
    }
    if (body.doctor) {
      const doctorRecord = await Doctor.findOne({ where: { name: body.doctor } });
      if (doctorRecord) appointment.doctor_id = doctorRecord.id;
    }

    await appointment.save();

    return successResponse({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    }, 200);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return errorResponse(error.message, 500);
  }
};

const deleteAppointment = async (event) => {
  try {
    const { id } = event.pathParameters;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return errorResponse('Appointment not found', 404);
    }

    await appointment.destroy();

    return successResponse({
      success: true,
      message: 'Appointment deleted successfully'
    }, 200);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return errorResponse(error.message, 500);
  }
};

module.exports.createAppointment = createAppointment;
module.exports.getAppointments = getAppointments;
module.exports.getAppointmentById = getAppointmentById;
module.exports.updateAppointment = updateAppointment;
module.exports.deleteAppointment = deleteAppointment;
