import { StaffRepository } from '../repositories/staff.repository.js';
import { DepartmentRepository } from '../repositories/department.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Staff Service - Handles business logic for staff
 */
export class StaffService {
  /**
   * Get all staff with pagination
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated staff
   */
  static async getAllStaff(filters = {}, page = 1, limit = 20) {
    return StaffRepository.findAll(filters, page, limit, true);
  }

  /**
   * Get staff by ID
   * @param {string} id - Staff ID
   * @returns {Promise<Object>} - Staff
   */
  static async getStaffById(id) {
    return StaffRepository.findById(id, true);
  }

  /**
   * Get staff by department
   * @param {string} departmentId - Department ID
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated staff
   */
  static async getStaffByDepartment(departmentId, filters = {}, page = 1, limit = 20) {
    // Verify department exists
    await DepartmentRepository.findById(departmentId);
    
    return StaffRepository.findByDepartment(departmentId, filters, page, limit, true);
  }

  /**
   * Search staff by name
   * @param {string} name - Name to search
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated staff
   */
  static async searchStaffByName(name, filters = {}, page = 1, limit = 20) {
    if (!name || name.trim().length < 2) {
      throw new AppError('Search term must be at least 2 characters', 400);
    }
    
    return StaffRepository.searchByName(name, filters, page, limit, true);
  }

  /**
   * Create a new staff
   * @param {Object} staffData - Staff data
   * @returns {Promise<Object>} - Created staff
   */
  static async createStaff(staffData) {
    // Verify department exists
    if (staffData.department) {
      await DepartmentRepository.findById(staffData.department);
    }
    
    // Create new staff
    const staff = await StaffRepository.create(staffData);
    
    return StaffRepository.findById(staff._id, true);
  }

  /**
   * Update a staff
   * @param {string} id - Staff ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated staff
   */
  static async updateStaff(id, updateData) {
    // Verify staff exists
    await StaffRepository.findById(id);
    
    // Verify department exists if included in update
    if (updateData.department) {
      await DepartmentRepository.findById(updateData.department);
    }
    
    // Check if email is already in use by another staff
    if (updateData.email) {
      const existingStaff = await Staff.findOne({ email: updateData.email, _id: { $ne: id } });
      if (existingStaff) {
        throw new AppError('Email already in use', 400);
      }
    }
    
    // Update staff
    const staff = await StaffRepository.update(id, updateData);
    
    return StaffRepository.findById(staff._id, true);
  }

  /**
   * Delete a staff
   * @param {string} id - Staff ID
   * @returns {Promise<Object>} - Deleted staff
   */
  static async deleteStaff(id) {
    // Verify staff exists
    await StaffRepository.findById(id);
    
    // TODO: Check if staff has any dependencies like leave requests before deletion
    
    return StaffRepository.delete(id);
  }
}
