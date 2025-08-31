import ServiceRequest from '../models/serviceRequest.js';
import AppError from '../../utils/appError.js';

/**
 * ServiceRequest Repository - Handles data access for service requests
 */
export class ServiceRequestRepository {
  /**
   * Find a service request by ID
   * @param {string} requestId - Service request ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Service request or null if not found
   */
  static async findById(requestId, populate = false) {
    let query = ServiceRequest.findById(requestId);
    
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('requestedBy', 'username')
                  .populate('reviewedBy', 'username');
    }
    
    const request = await query;
    return request;
  }
  
  /**
   * Get all service requests
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options (sort, limit, skip)
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of service requests
   */
  static async findAll(filter = {}, options = {}, populate = false) {
    const { sort = { createdAt: -1 }, limit = 100, skip = 0 } = options;
    
    let query = ServiceRequest.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);
      
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('requestedBy', 'username')
                  .populate('reviewedBy', 'username');
    }
    
    const requests = await query;
    return requests;
  }
  
  /**
   * Find service requests by status
   * @param {string} status - Request status
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of service requests
   */
  static async findByStatus(status, options = {}, populate = false) {
    return this.findAll({ status }, options, populate);
  }
  
  /**
   * Find pending service requests
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of pending service requests
   */
  static async findPending(options = {}, populate = false) {
    return this.findByStatus('pending', options, populate);
  }
  
  /**
   * Find service requests by department ID
   * @param {string} departmentId - Department ID
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of service requests
   */
  static async findByDepartment(departmentId, options = {}, populate = false) {
    return this.findAll({ departmentId }, options, populate);
  }
  
  /**
   * Find service requests by requested user
   * @param {string} userId - User ID who requested
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of service requests
   */
  static async findByRequestedUser(userId, options = {}, populate = false) {
    return this.findAll({ requestedBy: userId }, options, populate);
  }
  
  /**
   * Count total service requests
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} - Total count
   */
  static async count(filter = {}) {
    return ServiceRequest.countDocuments(filter);
  }
  
  /**
   * Create a new service request
   * @param {Object} requestData - Service request data
   * @returns {Promise<Object>} - Created service request
   */
  static async create(requestData) {
    const request = await ServiceRequest.create(requestData);
    return request;
  }
  
  /**
   * Update a service request by ID
   * @param {string} requestId - Service request ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated service request
   * @throws {AppError} - If request not found
   */
  static async update(requestId, updateData) {
    const request = await ServiceRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    );
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    return request;
  }
  
  /**
   * Delete a service request by ID
   * @param {string} requestId - Service request ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If request not found
   */
  static async delete(requestId) {
    const request = await ServiceRequest.findByIdAndDelete(requestId);
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    return request;
  }
  
  /**
   * Update service request status
   * @param {string} requestId - Service request ID
   * @param {string} status - New status (pending, approved, rejected)
   * @param {string} reviewedBy - ID of the user who reviewed
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} - Updated service request
   */
  static async updateStatus(requestId, status, reviewedBy, remarks = null) {
    const updateData = {
      status,
      reviewedBy
    };
    
    if (remarks) {
      updateData.remarks = remarks;
    }
    
    return this.update(requestId, updateData);
  }
  
  /**
   * Approve a service request
   * @param {string} requestId - Service request ID
   * @param {string} reviewedBy - ID of the user who approved
   * @param {string} remarks - Optional approval remarks
   * @returns {Promise<Object>} - Updated service request
   */
  static async approve(requestId, reviewedBy, remarks = null) {
    return this.updateStatus(requestId, 'approved', reviewedBy, remarks);
  }
  
  /**
   * Reject a service request
   * @param {string} requestId - Service request ID
   * @param {string} reviewedBy - ID of the user who rejected
   * @param {string} remarks - Rejection remarks
   * @returns {Promise<Object>} - Updated service request
   */
  static async reject(requestId, reviewedBy, remarks) {
    return this.updateStatus(requestId, 'rejected', reviewedBy, remarks);
  }
}
