import { AppointmentRepository } from '../repositories/appointment.repository.js';
import { PatientRepository } from '../repositories/patient.repository.js';
import { DoctorRepository } from '../repositories/doctor.repository.js';
import { DepartmentRepository } from '../repositories/department.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Service class for appointment-related operations
 */
export class AppointmentService {
  /**
   * Get an appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Appointment data
   */
  static async getAppointmentById(appointmentId, populate = true) {
    const appointment = await AppointmentRepository.findById(appointmentId, populate);
    
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }
    
    return appointment;
  }
  
  /**
   * Get all appointments with pagination
   * @param {Object} filter - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getAllAppointments(filter = {}, page = 1, limit = 20, populate = true) {
    const skip = (page - 1) * limit;
    
    const appointments = await AppointmentRepository.findAll(filter, {
      limit,
      skip,
      sort: { appointmentDate: 1, appointmentTime: 1 }
    }, populate);
    
    const total = await AppointmentRepository.count(filter);
    const totalPages = Math.ceil(total / limit);
    
    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
  
  /**
   * Get appointments by patient ID
   * @param {string} patientId - Patient ID
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getAppointmentsByPatient(patientId, page = 1, limit = 20, populate = true) {
    // Verify that patient exists
    const patient = await PatientRepository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    return this.getAllAppointments({ patientId }, page, limit, populate);
  }
  
  /**
   * Get appointments by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getAppointmentsByDoctor(doctorId, page = 1, limit = 20, populate = true) {
    // Verify that doctor exists
    const doctor = await DoctorRepository.findById(doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    return this.getAllAppointments({ doctorId }, page, limit, populate);
  }
  
  /**
   * Get appointments by department ID
   * @param {string} departmentId - Department ID
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getAppointmentsByDepartment(departmentId, page = 1, limit = 20, populate = true) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    return this.getAllAppointments({ departmentId }, page, limit, populate);
  }
  
  /**
   * Get appointments by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} additionalFilter - Additional filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getAppointmentsByDateRange(startDate, endDate, additionalFilter = {}, page = 1, limit = 20, populate = true) {
    const filter = {
      ...additionalFilter,
      appointmentDate: { $gte: startDate, $lte: endDate }
    };
    
    return this.getAllAppointments(filter, page, limit, populate);
  }
  
  /**
   * Get appointments by status
   * @param {string} status - Appointment status
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getAppointmentsByStatus(status, page = 1, limit = 20, populate = true) {
    return this.getAllAppointments({ status }, page, limit, populate);
  }
  
  /**
   * Get today's appointments
   * @param {Object} additionalFilter - Additional filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of appointments per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated appointments data
   */
  static async getTodayAppointments(additionalFilter = {}, page = 1, limit = 20, populate = true) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getAppointmentsByDateRange(today, tomorrow, additionalFilter, page, limit, populate);
  }
  
  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @param {string} userId - ID of the user creating the appointment
   * @returns {Promise<Object>} - Created appointment
   */
  static async createAppointment(appointmentData, userId) {
    // Verify that patient exists
    const patient = await PatientRepository.findById(appointmentData.patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    // Verify that doctor exists and is active
    const doctor = await DoctorRepository.findById(appointmentData.doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    if (!doctor.active) {
      throw new AppError('Doctor is not active', 400);
    }
    
    // Verify that department exists and is active
    const department = await DepartmentRepository.findById(appointmentData.departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    if (!department.active) {
      throw new AppError('Department is not active', 400);
    }
    
    // Check if the appointment date is in the past
    const appointmentDate = new Date(appointmentData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      throw new AppError('Cannot create appointment for a past date', 400);
    }
    
    // Check if the appointment slot is available
    const isSlotAvailable = await AppointmentRepository.isSlotAvailable(
      appointmentData.doctorId,
      appointmentDate,
      appointmentData.appointmentTime
    );
    
    if (!isSlotAvailable) {
      throw new AppError('Appointment slot is not available', 400);
    }
    
    // Check if doctor is available on that day and time
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDate.getDay()];
    const isDocAvailable = doctor.availability.some(a => 
      a.day === dayOfWeek && 
      a.isAvailable && 
      a.startTime <= appointmentData.appointmentTime && 
      a.endTime >= appointmentData.appointmentTime
    );
    
    if (!isDocAvailable) {
      throw new AppError('Doctor is not available at this time', 400);
    }
    
    // Set created by user ID
    appointmentData.createdBy = userId;
    
    // Create the appointment
    const appointment = await AppointmentRepository.create(appointmentData);
    
    return appointment;
  }
  
  /**
   * Update an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated appointment
   */
  static async updateAppointment(appointmentId, updateData) {
    // First check if appointment exists
    const appointment = await AppointmentRepository.findById(appointmentId);
    
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }
      // Don't allow updates to cancelled appointments
    if (appointment.status === 'cancelled') {
      throw new AppError(`Cannot update a cancelled appointment`, 400);
    }
    
    // If changing doctor, department, date, or time, need to check availability
    if (updateData.doctorId || updateData.appointmentDate || updateData.appointmentTime) {
      const doctorId = updateData.doctorId || appointment.doctorId;
      const appointmentDate = updateData.appointmentDate 
        ? new Date(updateData.appointmentDate) 
        : appointment.appointmentDate;
      const appointmentTime = updateData.appointmentTime || appointment.appointmentTime;
      
      // Check if the appointment date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new AppError('Cannot update appointment to a past date', 400);
      }
      
      // Check if the appointment slot is available
      const isSlotAvailable = await AppointmentRepository.isSlotAvailable(
        doctorId,
        appointmentDate,
        appointmentTime,
        appointmentId // Exclude current appointment when checking availability
      );
      
      if (!isSlotAvailable) {
        throw new AppError('Appointment slot is not available', 400);
      }
      
      // Check if doctor is available on that day and time
      if (updateData.doctorId) {
        const doctor = await DoctorRepository.findById(doctorId);
        
        if (!doctor) {
          throw new AppError('Doctor not found', 404);
        }
        
        if (!doctor.active) {
          throw new AppError('Doctor is not active', 400);
        }
        
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDate.getDay()];
        const isDocAvailable = doctor.availability.some(a => 
          a.day === dayOfWeek && 
          a.isAvailable && 
          a.startTime <= appointmentTime && 
          a.endTime >= appointmentTime
        );
        
        if (!isDocAvailable) {
          throw new AppError('Doctor is not available at this time', 400);
        }
      }
    }
    
    // If changing department, verify that department exists and is active
    if (updateData.departmentId) {
      const department = await DepartmentRepository.findById(updateData.departmentId);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      
      if (!department.active) {
        throw new AppError('Department is not active', 400);
      }
    }
    
    return AppointmentRepository.update(appointmentId, updateData);
  }
    /**
   * Update appointment status
   * @param {string} appointmentId - Appointment ID
   * @param {string} status - New status (active, cancelled, no-show)
   * @returns {Promise<Object>} - Updated appointment
   */
  static async updateAppointmentStatus(appointmentId, status) {
    if (!['active', 'cancelled', 'no-show'].includes(status)) {
      throw new AppError(`Invalid status: ${status}. Valid statuses are: active, cancelled, no-show`, 400);
    }
    
    const appointment = await AppointmentRepository.findById(appointmentId);
    
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }
    
    // Don't allow cancelled appointments to be modified
    if (appointment.status === 'cancelled') {
      throw new AppError('Cannot update a cancelled appointment', 400);
    }
    
    return AppointmentRepository.update(appointmentId, { status });
  }
    /**
   * Cancel an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} - Cancelled appointment
   */
  static async cancelAppointment(appointmentId) {
    return this.updateAppointmentStatus(appointmentId, 'cancelled');
  }
  
  /**
   * Mark an appointment as no-show
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} - No-show appointment
   */
  static async markNoShow(appointmentId) {
    return this.updateAppointmentStatus(appointmentId, 'no-show');
  }
  
  /**
   * Integrated patient registration and appointment booking
   * @param {Object} patientData - Patient data for new or existing patient
   * @param {Object} appointmentData - Appointment data
   * @param {string} userId - ID of the user creating the appointment
   * @returns {Promise<Object>} - Created patient and appointment
   */
  static async registerPatientAndBookAppointment(patientData, appointmentData, userId) {
    let patient;
    
    // Check if patient already exists
    if (patientData.id) {
      // Use existing patient
      patient = await PatientRepository.findById(patientData.id);
      
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }
      
      // Update patient data if provided
      if (Object.keys(patientData).length > 1) { // If there are fields besides 'id'
        patient = await PatientRepository.update(patientData.id, patientData);
      }
    } else {
      // Check if patient exists by identifiers
      const existingPatient = await PatientRepository.findOne({
        $or: [
          { email: patientData.email },
          { phone: patientData.phone },
          { 'identifiers.aadhar': patientData.identifiers?.aadhar },
          { 'identifiers.pan': patientData.identifiers?.pan }
        ]
      });
      
      if (existingPatient) {
        // Use existing patient but update with new data
        patient = await PatientRepository.update(existingPatient._id, patientData);
      } else {
        // Create new patient
        patient = await PatientRepository.create(patientData);
      }
    }
    
    // Set patient ID in appointment data
    appointmentData.patientId = patient._id;
    
    // Create the appointment
    const appointment = await this.createAppointment(appointmentData, userId);
    
    return {
      patient,
      appointment
    };
  }
}
