import { DoctorRepository } from '../repositories/doctor.repository.js';
import { DepartmentRepository } from '../repositories/department.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Service class for doctor-related operations
 */
export class DoctorService {
  /**
   * Get a doctor by ID
   * @param {string} doctorId - Doctor ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Doctor data
   */
  static async getDoctorById(doctorId, populate = true) {
    const doctor = await DoctorRepository.findById(doctorId, populate);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    return doctor;
  }
  
  /**
   * Get a doctor by user ID
   * @param {string} userId - User ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Doctor data
   */
  static async getDoctorByUserId(userId, populate = true) {
    const doctor = await DoctorRepository.findByUserId(userId, populate);
    
    if (!doctor) {
      throw new AppError('Doctor not found for this user', 404);
    }
    
    return doctor;
  }
  
  /**
   * Get all doctors
   * @param {boolean} activeOnly - Whether to return only active doctors
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of doctors
   */
  static async getAllDoctors(activeOnly = true, populate = true) {
    if (activeOnly) {
      return DoctorRepository.findActive(populate);
    }
    
    return DoctorRepository.findAll({}, populate);
  }
  
  /**
   * Get doctors by department
   * @param {string} departmentId - Department ID
   * @param {boolean} activeOnly - Whether to return only active doctors
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of doctors
   */
  static async getDoctorsByDepartment(departmentId, activeOnly = true, populate = true) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    return DoctorRepository.findByDepartment(departmentId, activeOnly, populate);
  }
    /**
   * Create a new doctor
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Object>} - Created doctor
   */  static async createDoctor(doctorData) {
    // Check if a userId is provided
    if (doctorData.userId) {
      // Verify that user exists
      const user = await UserRepository.findById(doctorData.userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Check if doctor profile already exists for this user
      const existingDoctor = await DoctorRepository.findByUserId(doctorData.userId);
      
      if (existingDoctor) {
        throw new AppError('Doctor profile already exists for this user', 400);
      }
    } else {
      // If no userId is provided, make sure firstName and lastName are provided
      if (!doctorData.firstName || !doctorData.lastName) {
        throw new AppError('First name and last name are required when creating a doctor without a user', 400);
      }
    }
      // Verify that department exists
    console.log("Department ID received:", doctorData.departmentId);
    
    if (!doctorData.departmentId) {
      throw new AppError('Department ID is required', 400);
    }
    
    try {
      const department = await DepartmentRepository.findById(doctorData.departmentId);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
    } catch (error) {
      console.error("Error finding department:", error);
      throw new AppError('Invalid department ID or department not found', 400);
    }
    
    // Initialize qualifications and specializations as arrays if they're provided as strings
    if (doctorData.qualification && !Array.isArray(doctorData.qualification)) {
      doctorData.qualifications = [doctorData.qualification];
      delete doctorData.qualification;
    } else if (doctorData.qualifications && !Array.isArray(doctorData.qualifications)) {
      doctorData.qualifications = [doctorData.qualifications];
    }
      if (doctorData.specialization && !Array.isArray(doctorData.specialization)) {
      doctorData.specializations = [doctorData.specialization];
      delete doctorData.specialization;
    } else if (doctorData.specializations && !Array.isArray(doctorData.specializations)) {
      doctorData.specializations = [doctorData.specializations];
    }
    
    // Ensure availability is properly formatted
    if (!doctorData.availability) {
      doctorData.availability = [];
    } else if (!Array.isArray(doctorData.availability)) {
      try {
        // Try to parse if it's a JSON string
        doctorData.availability = JSON.parse(doctorData.availability);
      } catch (e) {
        // If parsing fails, wrap it in an array
        doctorData.availability = [doctorData.availability];
      }
    }
    
    return DoctorRepository.create(doctorData);
  }
  
  /**
   * Update a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated doctor
   */
  static async updateDoctor(doctorId, updateData) {
    // First check if doctor exists
    const doctor = await DoctorRepository.findById(doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    // If departmentId is being updated, verify that department exists
    if (updateData.departmentId && updateData.departmentId.toString() !== doctor.departmentId.toString()) {
      const department = await DepartmentRepository.findById(updateData.departmentId);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
    }
    
    return DoctorRepository.update(doctorId, updateData);
  }
  
  /**
   * Delete a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} - Deleted doctor
   */
  static async deleteDoctor(doctorId) {
    // Check if doctor exists
    const doctor = await DoctorRepository.findById(doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    // TODO: Check if doctor has appointments
    // If so, prevent deletion or implement soft delete by deactivating
    
    return DoctorRepository.delete(doctorId);
  }
  
  /**
   * Activate or deactivate a doctor
   * @param {string} doctorId - Doctor ID
   * @param {boolean} active - Whether to activate or deactivate
   * @returns {Promise<Object>} - Updated doctor
   */
  static async setDoctorStatus(doctorId, active) {
    // Check if doctor exists
    const doctor = await DoctorRepository.findById(doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    return DoctorRepository.setActive(doctorId, active);
  }
  
  /**
   * Update doctor availability
   * @param {string} doctorId - Doctor ID
   * @param {Array} availability - Array of availability objects
   * @returns {Promise<Object>} - Updated doctor
   */
  static async updateDoctorAvailability(doctorId, availability) {
    // Check if doctor exists
    const doctor = await DoctorRepository.findById(doctorId);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    // Validate availability data
    if (!Array.isArray(availability) || availability.length === 0) {
      throw new AppError('Availability must be a non-empty array', 400);
    }
    
    // Validate each availability entry
    for (const slot of availability) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        throw new AppError('Each availability slot must have day, startTime, and endTime', 400);
      }
      
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!validDays.includes(slot.day)) {
        throw new AppError(`Invalid day. Must be one of: ${validDays.join(', ')}`, 400);
      }
      
      // TODO: Add time format validation (HH:MM)
    }
    
    return DoctorRepository.updateAvailability(doctorId, availability);
  }
  
  /**
   * Check if doctor is available for appointment
   * @param {string} doctorId - Doctor ID
   * @param {Date} appointmentDate - Appointment date
   * @param {string} appointmentTime - Appointment time
   * @returns {Promise<boolean>} - Whether the doctor is available
   */
  static async checkDoctorAvailability(doctorId, appointmentDate, appointmentTime) {
    // Get day of week from appointment date
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[appointmentDate.getDay()];
    
    // Check if doctor has general availability for this day and time
    const isAvailable = await DoctorRepository.isAvailable(
      doctorId,
      dayOfWeek,
      appointmentTime,
      appointmentTime // Using same time as start and end for simplicity
    );
    
    if (!isAvailable) {
      return false;
    }
    
    // TODO: Also check existing appointments to avoid double-booking
    // This will be implemented when we add the AppointmentService
    
    return true;
  }
  
  /**
   * Reassign a doctor to a different department
   * @param {string} doctorId - Doctor ID
   * @param {string} departmentId - New department ID
   * @returns {Promise<Object>} - Updated doctor
   */
  static async reassignDoctor(doctorId, departmentId) {
    // Verify that doctor exists
    const doctor = await DoctorRepository.findById(doctorId, true);
    
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    
    // Verify that department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    // Check if doctor is already in the specified department
    if (doctor.departmentId.toString() === departmentId.toString()) {
      throw new AppError('Doctor is already assigned to this department', 400);
    }
    
    console.log(`Reassigning doctor ${doctorId} from department ${doctor.departmentId} to ${departmentId}`);
    
    // Update the doctor's department
    return DoctorRepository.update(doctorId, { departmentId });
  }
}
