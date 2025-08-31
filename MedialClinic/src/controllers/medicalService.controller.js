import { MedicalServiceService } from '../services/medicalService.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for medical service-related endpoints
 */
export class MedicalServiceController {
  /**
   * Get all medical services with pagination and filtering
   * @route GET /api/v1/medical-services
   */
  static getAllServices = asyncErrorHandler(async (req, res, next) => {
    const { 
      page = 1, 
      limit = 20, 
      active,
      isTest,
      isProcedure,
      departmentId,
      searchText
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    if (isTest !== undefined) {
      filter.isTest = isTest === 'true';
    }
    
    if (isProcedure !== undefined) {
      filter.isProcedure = isProcedure === 'true';
    }
    
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    // If search text is provided, perform a search instead of regular filtering
    if (searchText) {
      const results = await MedicalServiceService.searchServices(
        searchText, 
        active === 'true' || active === undefined, // Default to active only if not specified
        true // Populate references
      );
      
      return res.status(200).json({
        status: 'success',
        results: results.length,
        data: { services: results }
      });
    }
    
    // Regular pagination-based query
    const result = await MedicalServiceService.getAllServices(
      filter, 
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.services.length,
      pagination: result.pagination,
      data: { services: result.services }
    });
  });
  
  /**
   * Get services by department
   * @route GET /api/v1/departments/:departmentId/medical-services
   */
  static getServicesByDepartment = asyncErrorHandler(async (req, res, next) => {
    const { departmentId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      active = 'true' 
    } = req.query;
    
    const result = await MedicalServiceService.getServicesByDepartment(
      departmentId, 
      active === 'true', 
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.services.length,
      pagination: result.pagination,
      data: { services: result.services }
    });
  });
  
  /**
   * Get a medical service by ID
   * @route GET /api/v1/medical-services/:id
   */
  static getServiceById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const service = await MedicalServiceService.getServiceById(id, true);
    
    res.status(200).json({
      status: 'success',
      data: { service }
    });
  });
  
  /**
   * Get a medical service by code
   * @route GET /api/v1/medical-services/code/:code
   */
  static getServiceByCode = asyncErrorHandler(async (req, res, next) => {
    const { code } = req.params;
    
    const service = await MedicalServiceService.getServiceByCode(code, true);
    
    res.status(200).json({
      status: 'success',
      data: { service }
    });
  });
  
  /**
   * Create a new medical service
   * @route POST /api/v1/medical-services
   */
  static createService = asyncErrorHandler(async (req, res, next) => {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const serviceData = req.body;
    
    const service = await MedicalServiceService.createService(serviceData, userId);
    
    res.status(201).json({
      status: 'success',
      data: { service }
    });
  });
  
  /**
   * Update a medical service
   * @route PATCH /api/v1/medical-services/:id
   */
  static updateService = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const service = await MedicalServiceService.updateService(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { service }
    });
  });
  
  /**
   * Delete a medical service
   * @route DELETE /api/v1/medical-services/:id
   */
  static deleteService = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await MedicalServiceService.deleteService(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Activate or deactivate a medical service
   * @route PATCH /api/v1/medical-services/:id/status
   */
  static setServiceStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return next(new AppError('Active status is required', 400));
    }
    
    const service = await MedicalServiceService.setServiceStatus(id, active);
    
    res.status(200).json({
      status: 'success',
      data: { service }
    });
  });
  
  /**
   * Approve a medical service
   * @route PATCH /api/v1/medical-services/:id/approve
   */
  static approveService = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    // Get approver ID from authenticated user
    const approverId = req.user._id;
    
    if (!approverId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const service = await MedicalServiceService.approveService(id, approverId);
    
    res.status(200).json({
      status: 'success',
      data: { service }
    });
  });
  
  /**
   * Get all services of a specific type (test or procedure)
   * @route GET /api/v1/medical-services/type
   */
  static getServicesByType = asyncErrorHandler(async (req, res, next) => {
    const { 
      isTest,
      isProcedure,
      page = 1, 
      limit = 20, 
      active = 'true' 
    } = req.query;
    
    // Must specify at least one type
    if (isTest === undefined && isProcedure === undefined) {
      return next(new AppError('At least one service type (isTest or isProcedure) must be specified', 400));
    }
    
    const result = await MedicalServiceService.getServicesByType(
      isTest === 'true',
      isProcedure === 'true',
      active === 'true',
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.services.length,
      pagination: result.pagination,
      data: { services: result.services }
    });
  });
}
