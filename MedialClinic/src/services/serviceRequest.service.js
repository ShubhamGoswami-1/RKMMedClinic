import { ServiceRequestRepository } from '../repositories/serviceRequest.repository.js';
import { DepartmentRepository } from '../repositories/department.repository.js';
import { MedicalServiceRepository } from '../repositories/medicalService.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Service class for service request-related operations
 */
export class ServiceRequestService {
  /**
   * Get a service request by ID
   * @param {string} requestId - Service request ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Service request data
   */
  static async getRequestById(requestId, populate = true) {
    const request = await ServiceRequestRepository.findById(requestId, populate);
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    return request;
  }
  
  /**
   * Get all service requests with pagination
   * @param {Object} filter - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of requests per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated requests data
   */
  static async getAllRequests(filter = {}, page = 1, limit = 20, populate = true) {
    const skip = (page - 1) * limit;
    
    const requests = await ServiceRequestRepository.findAll(filter, {
      limit,
      skip,
      sort: { createdAt: -1 }
    }, populate);
    
    const total = await ServiceRequestRepository.count(filter);
    const totalPages = Math.ceil(total / limit);
    
    return {
      requests,
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
   * Get pending service requests
   * @param {number} page - Page number
   * @param {number} limit - Number of requests per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated pending requests data
   */
  static async getPendingRequests(page = 1, limit = 20, populate = true) {
    return this.getAllRequests({ status: 'pending' }, page, limit, populate);
  }
  
  /**
   * Get service requests by department
   * @param {string} departmentId - Department ID
   * @param {number} page - Page number
   * @param {number} limit - Number of requests per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated requests data
   */
  static async getRequestsByDepartment(departmentId, page = 1, limit = 20, populate = true) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    return this.getAllRequests({ departmentId }, page, limit, populate);
  }
  
  /**
   * Get service requests by user
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Number of requests per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated requests data
   */
  static async getRequestsByUser(userId, page = 1, limit = 20, populate = true) {
    return this.getAllRequests({ requestedBy: userId }, page, limit, populate);
  }
  
  /**
   * Create a new service request
   * @param {Object} requestData - Service request data
   * @param {string} userId - ID of the user creating the request
   * @returns {Promise<Object>} - Created service request
   */
  static async createRequest(requestData, userId) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(requestData.departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    // Check if a similar service already exists
    const existingService = await MedicalServiceRepository.findByName(requestData.name);
    
    if (existingService) {
      throw new AppError('A medical service with this name already exists', 400);
    }
    
    // Check if a similar request is already pending
    const existingRequest = await ServiceRequestRepository.findOne({
      name: requestData.name,
      status: 'pending'
    });
    
    if (existingRequest) {
      throw new AppError('A request for this service is already pending', 400);
    }
    
    // Set requested by user ID
    requestData.requestedBy = userId;
    
    return ServiceRequestRepository.create(requestData);
  }
  
  /**
   * Update a service request
   * @param {string} requestId - Service request ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated service request
   */
  static async updateRequest(requestId, updateData) {
    // First check if request exists
    const request = await ServiceRequestRepository.findById(requestId);
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    // Only allow updates to pending requests
    if (request.status !== 'pending') {
      throw new AppError('Cannot update a request that has already been approved or rejected', 400);
    }
    
    // If departmentId is being updated, verify that department exists
    if (updateData.departmentId && updateData.departmentId.toString() !== request.departmentId.toString()) {
      const department = await DepartmentRepository.findById(updateData.departmentId);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
    }
    
    return ServiceRequestRepository.update(requestId, updateData);
  }
  
  /**
   * Delete a service request
   * @param {string} requestId - Service request ID
   * @returns {Promise<Object>} - Deleted service request
   */
  static async deleteRequest(requestId) {
    // Check if request exists
    const request = await ServiceRequestRepository.findById(requestId);
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    // Only allow deletion of pending requests
    if (request.status !== 'pending') {
      throw new AppError('Cannot delete a request that has already been approved or rejected', 400);
    }
    
    return ServiceRequestRepository.delete(requestId);
  }
  
  /**
   * Approve a service request and create the medical service
   * @param {string} requestId - Service request ID
   * @param {string} reviewedById - ID of the user approving the request
   * @param {string} remarks - Optional approval remarks
   * @param {Object} serviceData - Additional service data (optional)
   * @returns {Promise<Object>} - Approved request and created service
   */
  static async approveRequest(requestId, reviewedById, remarks = null, serviceData = {}) {
    // Check if request exists
    const request = await ServiceRequestRepository.findById(requestId);
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    // Only allow approval of pending requests
    if (request.status !== 'pending') {
      throw new AppError('Request has already been approved or rejected', 400);
    }
    
    // Generate a unique service code if not provided
    const serviceCode = serviceData.code || `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Create the new medical service
    const newService = await MedicalServiceRepository.create({
      name: request.name,
      code: serviceCode,
      description: request.description,
      departmentId: request.departmentId,
      price: serviceData.price || request.suggestedPrice || 0,
      isTest: request.isTest,
      isProcedure: request.isProcedure,
      approvedBy: reviewedById,
      createdBy: request.requestedBy,
      active: true,
      ...serviceData // Allow override of any other fields
    });
    
    // Update the request status to approved
    const updatedRequest = await ServiceRequestRepository.approve(requestId, reviewedById, remarks);
    
    return {
      request: updatedRequest,
      service: newService
    };
  }
  
  /**
   * Reject a service request
   * @param {string} requestId - Service request ID
   * @param {string} reviewedById - ID of the user rejecting the request
   * @param {string} remarks - Rejection remarks
   * @returns {Promise<Object>} - Rejected request
   */
  static async rejectRequest(requestId, reviewedById, remarks) {
    // Check if request exists
    const request = await ServiceRequestRepository.findById(requestId);
    
    if (!request) {
      throw new AppError('Service request not found', 404);
    }
    
    // Only allow rejection of pending requests
    if (request.status !== 'pending') {
      throw new AppError('Request has already been approved or rejected', 400);
    }
    
    // Require remarks for rejection
    if (!remarks) {
      throw new AppError('Remarks are required when rejecting a request', 400);
    }
    
    return ServiceRequestRepository.reject(requestId, reviewedById, remarks);
  }
}
