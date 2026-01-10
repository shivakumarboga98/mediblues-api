import { Appointment, Location, Department, Doctor } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createAppointment = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Validate required fields
    const { fullName, mobileNumber, location, reasonForVisit, message } = body;
    if (!fullName || !mobileNumber || !location || !reasonForVisit || !message) {
      return errorResponse('Missing required fields', 400);
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

    // Create appointment
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
      status: 'pending'
    });

    console.log('Appointment created:', appointment);
    return successResponse({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    }, 201);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return errorResponse(error.message, 500);
  }
};

export const getAppointments = async (event) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { association: 'location', attributes: ['id', 'name'] },
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'doctor', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return successResponse({
      success: true,
      data: appointments
    }, 200);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return errorResponse(error.message, 500);
  }
};

export const getAppointmentById = async (event) => {
  try {
    const { id } = event.pathParameters;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { association: 'location', attributes: ['id', 'name'] },
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'doctor', attributes: ['id', 'name'] }
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

export const updateAppointment = async (event) => {
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

export const deleteAppointment = async (event) => {
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
