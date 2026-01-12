import { Appointment, Location, Department, Doctor, Package } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { Op, fn, col } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const getDashboardStatistics = async (event) => {
  const timeoutMs = 8000; // 8 second timeout
  let timeoutHandle;

  try {
    console.log('Starting getDashboardStatistics...');
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('Database connection timeout - check your network connection to AWS RDS'));
      }, timeoutMs);
    });

    // Race between the actual operations and timeout
    const result = await Promise.race([
      (async () => {
        // Test database connection
        try {
          await sequelize.authenticate();
          console.log('Database connection successful');
        } catch (connError) {
          console.error('Database connection failed:', connError.message);
          throw new Error(`Database connection failed: ${connError.message}`);
        }

        // Get all counts in parallel
        const [totalAppointments, appointmentsByStatus, locationsCount, departmentsCount, activeDoctorsCount, packagesCount] = await Promise.all([
          Appointment.count(),
          Appointment.findAll({
            attributes: [
              'status',
              [fn('COUNT', col('id')), 'count']
            ],
            group: ['status'],
            raw: true
          }),
          Location.count(),
          Department.count(),
          Doctor.count(),
          Package.count()
        ]);

        console.log('All statistics retrieved successfully');

        // Convert to object format
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
      })(),
      timeoutPromise
    ]);

    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    console.error('Error fetching dashboard statistics:', error.message);
    
    // Return mock data if database is unavailable (for development/offline mode)
    if (error.message.includes('timeout') || error.message.includes('ETYMEDOUT') || error.message.includes('connection')) {
      console.log('Database unavailable, returning mock statistics');
      return successResponse({
        success: true,
        data: {
          totalAppointments: 0,
          appointmentsByStatus: {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
          },
          locationsCount: 0,
          departmentsCount: 0,
          activeDoctorsCount: 0,
          packagesCount: 0
        },
        warning: 'Database unavailable - displaying empty dashboard'
      }, 200);
    }
    
    return errorResponse(error.message || 'Failed to fetch statistics', 500);
  }
};
