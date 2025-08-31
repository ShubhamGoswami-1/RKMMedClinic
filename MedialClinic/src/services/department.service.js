import { DepartmentRepository } from '../repositories/department.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Service class for department-related operations
 */
export class DepartmentService {
  /**
   * Get a department by ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Department data
   */
  static async getDepartmentById(departmentId) {
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    return department;
  }
  
  /**
   * Get all departments
   * @param {boolean} activeOnly - Whether to return only active departments
   * @returns {Promise<Array>} - Array of departments
   */
  static async getAllDepartments(activeOnly = false) {
    if (activeOnly) {
      return DepartmentRepository.findActive();
    }
    
    return DepartmentRepository.findAll();
  }
  
  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} - Created department
   */
  static async createDepartment(departmentData) {
    // Check if department with same name already exists
    const exists = await DepartmentRepository.exists(departmentData.name);
    
    if (exists) {
      throw new AppError('Department with this name already exists', 400);
    }
    
    return DepartmentRepository.create(departmentData);
  }
  
  /**
   * Update a department
   * @param {string} departmentId - Department ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated department
   */
  static async updateDepartment(departmentId, updateData) {
    // First check if department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== department.name) {
      const nameExists = await DepartmentRepository.exists(updateData.name);
      
      if (nameExists) {
        throw new AppError('Department with this name already exists', 400);
      }
    }
    
    return DepartmentRepository.update(departmentId, updateData);
  }
  
  /**
   * Delete a department
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Deleted department
   */
  static async deleteDepartment(departmentId) {
    // Check if department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    // TODO: Check if department is being used by doctors or medical services
    // If so, prevent deletion or implement soft delete by deactivating
    
    return DepartmentRepository.delete(departmentId);
  }
  
  /**
   * Activate or deactivate a department
   * @param {string} departmentId - Department ID
   * @param {boolean} active - Whether to activate or deactivate
   * @returns {Promise<Object>} - Updated department
   */
  static async setDepartmentStatus(departmentId, active) {
    // Check if department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    return DepartmentRepository.setActive(departmentId, active);
  }

  /**
   * Get department details with doctor statistics
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Department with doctor statistics
   */
  static async getDepartmentWithStatistics(departmentId) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    // Get all doctors in this department
    const doctors = await DoctorRepository.findByDepartment(departmentId, false, true);
    
    // Calculate statistics
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(doc => doc.active).length;
    
    // Group doctors by specialization
    const doctorsBySpecialization = {};
    for (const doctor of doctors) {
      if (doctor.specializations && doctor.specializations.length > 0) {
        for (const spec of doctor.specializations) {
          if (!doctorsBySpecialization[spec]) {
            doctorsBySpecialization[spec] = 0;
          }
          doctorsBySpecialization[spec] += 1;
        }
      }
    }
    
    // Return department with statistics
    return {
      department,
      statistics: {
        totalDoctors,
        activeDoctors,
        inactiveDoctors: totalDoctors - activeDoctors,
        doctorsBySpecialization
      },
      doctors
    };
  }
}
