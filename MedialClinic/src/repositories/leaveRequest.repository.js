import LeaveRequest from '../models/leaveRequest.js';
import AppError from '../../utils/appError.js';

/**
 * Leave Request Repository - Handles data access for leave requests
 */
export class LeaveRequestRepository {
  /**
   * Find all leave requests with pagination
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated leave requests
   */
  static async findAll(filters = {}, page = 1, limit = 20, populate = false) {
    const skip = (page - 1) * limit;
      let query = LeaveRequest.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    if (populate) {
      query = query
                   .populate('userId', 'username firstName lastName email role')
                   .populate('staffId', 'firstName lastName email department designation')
                   .populate('doctorId', 'firstName lastName email departmentId')
                   .populate('requestedBy', 'username firstName lastName email role')
                   .populate('leaveTypeId')
                   .populate('reviewedBy', 'username firstName lastName email role');
    }
    
    const [requests, total] = await Promise.all([
      query.exec(),
      LeaveRequest.countDocuments(filters)
    ]);
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    return { requests, pagination };
  }

  /**
   * Find leave request by ID
   * @param {string} id - Leave request ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Leave request
   * @throws {AppError} - If leave request not found
   */
  static async findById(id, populate = false) {
    let query = LeaveRequest.findById(id);
      if (populate) {
      query = query
                   .populate('userId', 'username firstName lastName email role')
                   .populate('staffId', 'firstName lastName email department designation')
                   .populate('doctorId', 'firstName lastName email departmentId')
                   .populate('requestedBy', 'username firstName lastName email role')
                   .populate('leaveTypeId')
                   .populate('reviewedBy', 'username firstName lastName email role');
    }
    
    const leaveRequest = await query.exec();
    
    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }
    
    return leaveRequest;
  }
  /**
   * Find leave requests by entity
   * @param {string} entityType - Entity type ('staff', 'doctor', or 'user')
   * @param {string} entityId - Entity ID
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated leave requests
   */
  static async findByEntity(entityType, entityId, filters = {}, page = 1, limit = 20, populate = false) {
    const combinedFilters = { ...filters };
    combinedFilters[`${entityType}Id`] = entityId;
    return this.findAll(combinedFilters, page, limit, populate);
  }
  
  /**
   * Find leave requests by user (legacy method)
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated leave requests
   */
  static async findByUser(userId, filters = {}, page = 1, limit = 20, populate = false) {
    return this.findByEntity('user', userId, filters, page, limit, populate);
  }

  /**
   * Create a new leave request
   * @param {Object} data - Leave request data
   * @returns {Promise<Object>} - Created leave request
   */
  static async create(data) {
    const leaveRequest = await LeaveRequest.create(data);
    return leaveRequest;
  }

  /**
   * Update a leave request
   * @param {string} id - Leave request ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated leave request
   * @throws {AppError} - If leave request not found
   */
  static async update(id, data) {
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }
    
    return leaveRequest;
  }

  /**
   * Delete a leave request
   * @param {string} id - Leave request ID
   * @returns {Promise<Object>} - Deleted leave request
   * @throws {AppError} - If leave request not found
   */
  static async delete(id) {
    const leaveRequest = await LeaveRequest.findByIdAndDelete(id);
    
    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }
    
    return leaveRequest;
  }
  /**
   * Find overlapping leave requests for an entity (staff, doctor, or user)
   * @param {Object} entityFilter - Entity filter object containing staffId, doctorId, or userId
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeId - Leave request ID to exclude
   * @returns {Promise<Array>} - Array of overlapping leave requests
   */
  static async findOverlapping(entityFilter, startDate, endDate, excludeId = null) {
    const query = {
      ...entityFilter,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const overlapping = await LeaveRequest.find(query);
    return overlapping;
  }
  
  /**
   * Legacy method for backward compatibility
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeId - Leave request ID to exclude
   * @returns {Promise<Array>} - Array of overlapping leave requests
   */
  static async findOverlappingByUser(userId, startDate, endDate, excludeId = null) {
    return this.findOverlapping({ userId }, startDate, endDate, excludeId);
  }
}
