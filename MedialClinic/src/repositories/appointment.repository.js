import Appointment from '../models/appointment.js';
import AppError from '../../utils/appError.js';

/**
 * Appointment Repository - Handles data access for appointments
 */
export class AppointmentRepository {
  /**
   * Find an appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Appointment or null if not found
   */
  static async findById(appointmentId, populate = false) {
    let query = Appointment.findById(appointmentId);
    
    if (populate) {
      query = query.populate('patientId', 'firstName lastName phone email')
                  .populate({
                    path: 'doctorId',
                    populate: {
                      path: 'userId',
                      select: 'username firstName lastName'
                    }
                  })
                  .populate('departmentId', 'name')
                  .populate('createdBy', 'username');
    }
    
    const appointment = await query;
    return appointment;
  }
  
  /**
   * Get all appointments
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options (sort, limit, skip)
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of appointments
   */
  static async findAll(filter = {}, options = {}, populate = false) {
    const { sort = { appointmentDate: 1, appointmentTime: 1 }, limit = 100, skip = 0 } = options;
    
    let query = Appointment.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);
      
    if (populate) {
      query = query.populate('patientId', 'firstName lastName phone email')
                  .populate({
                    path: 'doctorId',
                    populate: {
                      path: 'userId',
                      select: 'username firstName lastName'
                    }
                  })
                  .populate('departmentId', 'name')
                  .populate('createdBy', 'username');
    }
    
    const appointments = await query;
    return appointments;
  }
  
  /**
   * Find appointments by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of appointments
   */
  static async findByPatient(patientId, options = {}, populate = false) {
    return this.findAll({ patientId }, options, populate);
  }
  
  /**
   * Find appointments by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of appointments
   */
  static async findByDoctor(doctorId, options = {}, populate = false) {
    return this.findAll({ doctorId }, options, populate);
  }
  
  /**
   * Find appointments by department ID
   * @param {string} departmentId - Department ID
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of appointments
   */
  static async findByDepartment(departmentId, options = {}, populate = false) {
    return this.findAll({ departmentId }, options, populate);
  }
  
  /**
   * Find appointments by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} additionalFilter - Additional filter criteria
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of appointments
   */
  static async findByDateRange(startDate, endDate, additionalFilter = {}, options = {}, populate = false) {
    const filter = {
      ...additionalFilter,
      appointmentDate: { $gte: startDate, $lte: endDate }
    };
    
    return this.findAll(filter, options, populate);
  }
  
  /**
   * Find appointments by status
   * @param {string} status - Appointment status
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of appointments
   */
  static async findByStatus(status, options = {}, populate = false) {
    return this.findAll({ status }, options, populate);
  }
  
  /**
   * Count total appointments
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} - Total count
   */
  static async count(filter = {}) {
    return Appointment.countDocuments(filter);
  }
  
  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} - Created appointment
   */
  static async create(appointmentData) {
    const appointment = await Appointment.create(appointmentData);
    return appointment;
  }
  
  /**
   * Update an appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated appointment
   * @throws {AppError} - If appointment not found
   */
  static async update(appointmentId, updateData) {
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    );
    
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }
    
    return appointment;
  }
  
  /**
   * Delete an appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If appointment not found
   */
  static async delete(appointmentId) {
    const appointment = await Appointment.findByIdAndDelete(appointmentId);
    
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }
    
    return appointment;
  }
  
  /**
   * Update appointment status
   * @param {string} appointmentId - Appointment ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated appointment
   */
  static async updateStatus(appointmentId, status) {
    return this.update(appointmentId, { status });
  }
  
  /**
   * Check if appointment slot is available
   * @param {string} doctorId - Doctor ID
   * @param {Date} appointmentDate - Appointment date
   * @param {string} appointmentTime - Appointment time
   * @param {string} excludeAppointmentId - Appointment ID to exclude (for updates)
   * @returns {Promise<boolean>} - Whether the slot is available
   */
  static async isSlotAvailable(doctorId, appointmentDate, appointmentTime, excludeAppointmentId = null) {
    const filter = {
      doctorId,
      appointmentDate,
      appointmentTime,
      status: { $ne: 'cancelled' }
    };
    
    if (excludeAppointmentId) {
      filter._id = { $ne: excludeAppointmentId };
    }
    
    const conflictingAppointment = await Appointment.findOne(filter);
    return !conflictingAppointment;
  }
}
