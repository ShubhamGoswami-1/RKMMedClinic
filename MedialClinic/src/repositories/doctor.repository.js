import Doctor from '../models/doctor.js';
import AppError from '../../utils/appError.js';

/**
 * Doctor Repository - Handles data access for doctors
 */
export class DoctorRepository {
  /**
   * Find a doctor by ID
   * @param {string} doctorId - Doctor ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Doctor or null if not found
   */
  static async findById(doctorId, populate = false) {
    let query = Doctor.findById(doctorId);
    
    if (populate) {
      query = query.populate('userId', 'username email firstName lastName')
                  .populate('departmentId', 'name');
    }
    
    const doctor = await query;
    return doctor;
  }
  
  /**
   * Find a doctor by user ID
   * @param {string} userId - User ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Doctor or null if not found
   */
  static async findByUserId(userId, populate = false) {
    let query = Doctor.findOne({ userId });
    
    if (populate) {
      query = query.populate('userId', 'username email firstName lastName')
                  .populate('departmentId', 'name');
    }
    
    const doctor = await query;
    return doctor;
  }
  
  /**
   * Get all doctors
   * @param {Object} filter - Filter criteria
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of doctors
   */
  static async findAll(filter = {}, populate = false) {
    let query = Doctor.find(filter);
    
    if (populate) {
      query = query.populate('userId', 'username email firstName lastName')
                  .populate('departmentId', 'name');
    }
    
    const doctors = await query;
    return doctors;
  }
  
  /**
   * Get all active doctors
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of active doctors
   */
  static async findActive(populate = false) {
    return this.findAll({ active: true }, populate);
  }
  
  /**
   * Find doctors by department ID
   * @param {string} departmentId - Department ID
   * @param {boolean} activeOnly - Whether to return only active doctors
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of doctors
   */  static async findByDepartment(departmentId, activeOnly = true, populate = false) {
    try {
      const filter = { departmentId };
      
      if (activeOnly) {
        filter.active = true;
      }
      
      let query = Doctor.find(filter);
      
      if (populate) {
        query = query.populate('userId', 'username email firstName lastName')
                    .populate('departmentId', 'name');
      }
      
      const doctors = await query;
      return doctors;
    } catch (error) {
      console.error('Error finding doctors by department:', error);
      throw new AppError('Failed to fetch doctors by department', 500);
    }
  }
  
  /**
   * Create a new doctor
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Object>} - Created doctor
   */  static async create(doctorData) {
    try {
      // Create a new doctor document
      const doctor = await Doctor.create(doctorData);
      
      // Populate the doctor with user and department details for the response
      const populatedDoctor = await this.findById(doctor._id, true);
      
      return populatedDoctor;
    } catch (error) {
      // If there's a validation error, provide a more detailed message
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        throw new AppError(`Validation Error: ${messages.join(', ')}`, 400);
      }
      
      // For other errors, re-throw with a generic message
      throw new AppError('Failed to create doctor profile', 500);
    }
  }
  
  /**
   * Update a doctor by ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated doctor
   * @throws {AppError} - If doctor not found
   */
  static async update(doctorId, updateData) {
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      updateData,
      { new: true }
    );
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    return doctor;
  }
  
  /**
   * Delete a doctor by ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If doctor not found
   */
  static async delete(doctorId) {
    const doctor = await Doctor.findByIdAndDelete(doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    return doctor;
  }
  
  /**
   * Activate or deactivate a doctor
   * @param {string} doctorId - Doctor ID
   * @param {boolean} active - Active status
   * @returns {Promise<Object>} - Updated doctor
   */
  static async setActive(doctorId, active) {
    return this.update(doctorId, { active });
  }
  
  /**
   * Add or update doctor availability
   * @param {string} doctorId - Doctor ID
   * @param {Array} availability - Array of availability objects
   * @returns {Promise<Object>} - Updated doctor
   */
  static async updateAvailability(doctorId, availability) {
    return this.update(doctorId, { availability });
  }
  
  /**
   * Check if doctor has available slot for appointment
   * @param {string} doctorId - Doctor ID
   * @param {string} day - Day of the week
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {Promise<boolean>} - Whether the doctor is available
   */
  static async isAvailable(doctorId, day, startTime, endTime) {
    const doctor = await this.findById(doctorId);
    
    if (!doctor || !doctor.active) {
      return false;
    }
    
    const dayAvailability = doctor.availability.find(
      a => a.day === day && a.isAvailable
    );
    
    if (!dayAvailability) {
      return false;
    }
    
    // Check if the appointment time is within doctor's availability hours
    if (startTime >= dayAvailability.startTime && endTime <= dayAvailability.endTime) {
      return true;
    }
    
    return false;
  }
}
