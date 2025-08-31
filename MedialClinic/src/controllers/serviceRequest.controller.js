import { ServiceRequestService } from '../services/serviceRequest.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for service request-related endpoints
 */
export class ServiceRequestController {
  /**
   * Get all service requests with pagination and filtering
   * @route GET /api/v1/service-requests
   */
  static getAllRequests = asyncErrorHandler(async (req, res, next) => {
    const { 
      page = 1, 
      limit = 20, 
      status,
      departmentId,
      requestedBy 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    if (requestedBy) {
      filter.requestedBy = requestedBy;
    }
    
    const result = await ServiceRequestService.getAllRequests(
      filter, 
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { requests: result.requests }
    });
  });
  
  /**
   * Get pending service requests
   * @route GET /api/v1/service-requests/pending
   */
  static getPendingRequests = asyncErrorHandler(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await ServiceRequestService.getPendingRequests(
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { requests: result.requests }
    });
  });
  
  /**
   * Get service requests by department
   * @route GET /api/v1/departments/:departmentId/service-requests
   */
  static getRequestsByDepartment = asyncErrorHandler(async (req, res, next) => {
    const { departmentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await ServiceRequestService.getRequestsByDepartment(
      departmentId,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { requests: result.requests }
    });
  });
  
  /**
   * Get service requests by user
   * @route GET /api/v1/users/:userId/service-requests
   */
  static getRequestsByUser = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await ServiceRequestService.getRequestsByUser(
      userId,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { requests: result.requests }
    });
  });
  
  /**
   * Get my service requests (for current authenticated user)
   * @route GET /api/v1/service-requests/my-requests
   */
  static getMyRequests = asyncErrorHandler(async (req, res, next) => {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const { page = 1, limit = 20 } = req.query;
    
    const result = await ServiceRequestService.getRequestsByUser(
      userId,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { requests: result.requests }
    });
  });
  
  /**
   * Get a service request by ID
   * @route GET /api/v1/service-requests/:id
   */
  static getRequestById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const request = await ServiceRequestService.getRequestById(id, true);
    
    res.status(200).json({
      status: 'success',
      data: { request }
    });
  });
  
  /**
   * Create a new service request
   * @route POST /api/v1/service-requests
   */
  static createRequest = asyncErrorHandler(async (req, res, next) => {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const requestData = req.body;
    
    const request = await ServiceRequestService.createRequest(requestData, userId);
    
    res.status(201).json({
      status: 'success',
      data: { request }
    });
  });
  
  /**
   * Update a service request
   * @route PATCH /api/v1/service-requests/:id
   */
  static updateRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const request = await ServiceRequestService.updateRequest(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { request }
    });
  });
  
  /**
   * Delete a service request
   * @route DELETE /api/v1/service-requests/:id
   */
  static deleteRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await ServiceRequestService.deleteRequest(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Approve a service request
   * @route PATCH /api/v1/service-requests/:id/approve
   */
  static approveRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    // Get reviewer ID from authenticated user
    const reviewerId = req.user._id;
    
    if (!reviewerId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const { remarks, serviceData } = req.body;
    
    const result = await ServiceRequestService.approveRequest(id, reviewerId, remarks, serviceData);
    
    res.status(200).json({
      status: 'success',
      data: { 
        request: result.request,
        service: result.service
      }
    });
  });
  
  /**
   * Reject a service request
   * @route PATCH /api/v1/service-requests/:id/reject
   */
  static rejectRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    // Get reviewer ID from authenticated user
    const reviewerId = req.user._id;
    
    if (!reviewerId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const { remarks } = req.body;
    
    if (!remarks) {
      return next(new AppError('Remarks are required when rejecting a request', 400));
    }
    
    const request = await ServiceRequestService.rejectRequest(id, reviewerId, remarks);
    
    res.status(200).json({
      status: 'success',
      data: { request }
    });
  });
}
