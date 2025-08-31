import LeaveType from '../models/leaveType.js';
import AppError from '../../utils/appError.js';

/**
 * Leave Type Repository - Handles data access for leave types
 */
export class LeaveTypeRepository {
  /**
   * Find all leave types
   * @param {boolean} activeOnly - Whether to return only active leave types
   * @returns {Promise<Array>} - Array of leave types
   */
  static async findAll(activeOnly = false) {
    const query = activeOnly ? { active: true } : {};
    const leaveTypes = await LeaveType.find(query).sort({ name: 1 });
    return leaveTypes;
  }

  /**
   * Find leave type by ID
   * @param {string} id - Leave type ID
   * @returns {Promise<Object>} - Leave type
   * @throws {AppError} - If leave type not found
   */
  static async findById(id) {
    const leaveType = await LeaveType.findById(id);
    
    if (!leaveType) {
      throw new AppError('Leave type not found', 404);
    }
    
    return leaveType;
  }

  /**
   * Create a new leave type
   * @param {Object} data - Leave type data
   * @returns {Promise<Object>} - Created leave type
   */
  static async create(data) {
    const leaveType = await LeaveType.create(data);
    return leaveType;
  }

  /**
   * Update a leave type
   * @param {string} id - Leave type ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated leave type
   * @throws {AppError} - If leave type not found
   */
  static async update(id, data) {
    const leaveType = await LeaveType.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!leaveType) {
      throw new AppError('Leave type not found', 404);
    }
    
    return leaveType;
  }

  /**
   * Delete a leave type
   * @param {string} id - Leave type ID
   * @returns {Promise<Object>} - Deleted leave type
   * @throws {AppError} - If leave type not found
   */
  static async delete(id) {
    const leaveType = await LeaveType.findByIdAndDelete(id);
    
    if (!leaveType) {
      throw new AppError('Leave type not found', 404);
    }
    
    return leaveType;
  }
}
