import { Appointment, Location, Department, Doctor, Package } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { Op, fn, col } from 'sequelize';

export const getDashboardStatistics = async (event) => {
  try {
    // Get total appointments count
    const totalAppointments = await Appointment.count();

    // Get appointment counts by status
    const appointmentsByStatus = await Appointment.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Convert to object format for easier access
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    appointmentsByStatus.forEach(item => {
      if (item.status in statusCounts) {
        statusCounts[item.status] = parseInt(item.count);
      }
    });

    // Get locations count
    const locationsCount = await Location.count();

    // Get departments count
    const departmentsCount = await Department.count();

    // Get doctors count
    const activeDoctorsCount = await Doctor.count();

    // Get packages count
    const packagesCount = await Package.count();

    return successResponse({
      success: true,
      data: {
        totalAppointments,
        appointmentsByStatus: statusCounts,
        locationsCount,
        departmentsCount,
        activeDoctorsCount,
        packagesCount
      }
    }, 200);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return errorResponse(error.message, 500);
  }
};
