import { LeaveTypeRepository } from '../repositories/leaveType.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Leave Type Service - Handles business logic for leave types
 */
export class LeaveTypeService {
  /**
   * Get all leave types
   * @param {boolean} activeOnly - Whether to return only active leave types
   * @returns {Promise<Array>} - Array of leave types
   */
  static async getAllLeaveTypes(activeOnly = false) {
    return LeaveTypeRepository.findAll(activeOnly);
  }

  /**
   * Get leave type by ID
   * @param {string} id - Leave type ID
   * @returns {Promise<Object>} - Leave type
   */
  static async getLeaveTypeById(id) {
    return LeaveTypeRepository.findById(id);
  }

  /**
   * Create a new leave type
   * @param {Object} data - Leave type data
   * @returns {Promise<Object>} - Created leave type
   */
  static async createLeaveType(data) {
    return LeaveTypeRepository.create(data);
  }

  /**
   * Update a leave type
   * @param {string} id - Leave type ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated leave type
   */
  static async updateLeaveType(id, data) {
    return LeaveTypeRepository.update(id, data);
  }

  /**
   * Delete a leave type
   * @param {string} id - Leave type ID
   * @returns {Promise<Object>} - Deleted leave type
   */
  static async deleteLeaveType(id) {
    // Check if leave type exists
    await LeaveTypeRepository.findById(id);
    
    // TODO: Add check to ensure no leave balances or requests are using this leave type
    
    return LeaveTypeRepository.delete(id);
  }

  /**
   * Toggle leave type active status
   * @param {string} id - Leave type ID
   * @param {boolean} active - Active status
   * @returns {Promise<Object>} - Updated leave type
   */
  static async setLeaveTypeStatus(id, active) {
    return LeaveTypeRepository.update(id, { active });
  }
}
