import Department from '../models/department.js';
import AppError from '../../utils/appError.js';

/**
 * Department Repository - Handles data access for departments
 */
export class DepartmentRepository {  /**
   * Find a department by ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Department or null if not found
   * @throws {AppError} - If department ID is invalid
   */
  static async findById(departmentId) {
    // Check if departmentId is valid
    if (!departmentId || typeof departmentId !== 'string') {
      throw new AppError('Invalid department ID', 400);
    }
    
    try {
      const department = await Department.findById(departmentId);
      return department;
    } catch (error) {
      // If error is due to invalid ObjectId format
      if (error.name === 'CastError') {
        throw new AppError('Invalid department ID format', 400);
      }
      throw error;
    }
  }
  
  /**
   * Find a department by name
   * @param {string} name - Department name
   * @returns {Promise<Object>} - Department or null if not found
   */
  static async findByName(name) {
    const department = await Department.findOne({ name: name.trim() });
    return department;
  }
  
  /**
   * Get all departments
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} - Array of departments
   */
  static async findAll(filter = {}) {
    const departments = await Department.find(filter);
    return departments;
  }
  
  /**
   * Get all active departments
   * @returns {Promise<Array>} - Array of active departments
   */
  static async findActive() {
    return this.findAll({ active: true });
  }
  
  /**
   * Check if department exists with the given name
   * @param {string} name - Department name
   * @returns {Promise<boolean>} - Whether a department exists
   */
  static async exists(name) {
    const department = await Department.findOne({ name: name.trim() });
    return !!department;
  }
    /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} - Created department
   */
  static async create(departmentData) {
    // Ensure active is set to true by default if not provided
    if (departmentData.active === undefined) {
      departmentData.active = true;
    }
    const department = await Department.create(departmentData);
    return department;
  }
  /**
   * Update a department by ID
   * @param {string} departmentId - Department ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated department
   * @throws {AppError} - If department not found or ID is invalid
   */
  static async update(departmentId, updateData) {
    // Check if departmentId is valid
    if (!departmentId || typeof departmentId !== 'string') {
      throw new AppError('Invalid department ID', 400);
    }
    
    // Handle boolean values that might come as strings from forms
    if (updateData.active !== undefined) {
      if (typeof updateData.active === 'string') {
        updateData.active = updateData.active === 'true';
      }
    }
    
    try {
      const department = await Department.findByIdAndUpdate(
        departmentId,
        updateData,
        { new: true }
      );
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      
      return department;
    } catch (error) {
      // If error is due to invalid ObjectId format
      if (error.name === 'CastError') {
        throw new AppError('Invalid department ID format', 400);
      }
      throw error;
    }
  }
    /**
   * Delete a department by ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If department not found or ID is invalid
   */
  static async delete(departmentId) {
    // Check if departmentId is valid
    if (!departmentId || typeof departmentId !== 'string') {
      throw new AppError('Invalid department ID', 400);
    }
    
    try {
      const department = await Department.findByIdAndDelete(departmentId);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      
      return department;
    } catch (error) {
      // If error is due to invalid ObjectId format
      if (error.name === 'CastError') {
        throw new AppError('Invalid department ID format', 400);
      }
      throw error;
    }
  }
  
  /**
   * Activate or deactivate a department
   * @param {string} departmentId - Department ID
   * @param {boolean} active - Active status
   * @returns {Promise<Object>} - Updated department
   */
  static async setActive(departmentId, active) {
    return this.update(departmentId, { active });
  }
}
