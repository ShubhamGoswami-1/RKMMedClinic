import { DepartmentService } from '../services/department.service.js';
import { DoctorService } from '../services/doctor.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for department-related endpoints
 */
export class DepartmentController {
  /**
   * Get all departments
   * @route GET /api/v1/departments
   */
  static getAllDepartments = asyncErrorHandler(async (req, res, next) => {
    const { activeOnly } = req.query;
    
    // Convert query param to boolean
    const showActiveOnly = activeOnly === 'true';
    
    const departments = await DepartmentService.getAllDepartments(showActiveOnly);
    
    res.status(200).json({
      status: 'success',
      results: departments.length,
      data: {
        departments
      }
    });
  });
  
  /**
   * Get a department by ID
   * @route GET /api/v1/departments/:id
   */
  static getDepartmentById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const department = await DepartmentService.getDepartmentById(id);
    
    res.status(200).json({
      status: 'success',
      data: {
        department
      }
    });
  });
  
  /**
   * Create a new department
   * @route POST /api/v1/departments
   */
  static createDepartment = asyncErrorHandler(async (req, res, next) => {
    const departmentData = req.body;
    
    const department = await DepartmentService.createDepartment(departmentData);
    
    res.status(201).json({
      status: 'success',
      data: {
        department
      }
    });
  });
  
  /**
   * Update a department
   * @route PATCH /api/v1/departments/:id
   */
  static updateDepartment = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const department = await DepartmentService.updateDepartment(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: {
        department
      }
    });
  });
  
  /**
   * Delete a department
   * @route DELETE /api/v1/departments/:id
   */
  static deleteDepartment = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await DepartmentService.deleteDepartment(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Activate or deactivate a department
   * @route PATCH /api/v1/departments/:id/status
   */
  static setDepartmentStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { active } = req.body;
    
    if (typeof active !== 'boolean') {
      return next(new AppError('Active status must be a boolean', 400));
    }
    
    const department = await DepartmentService.setDepartmentStatus(id, active);
    
    res.status(200).json({
      status: 'success',
      data: {
        department
      }
    });
  });
  
  /**
   * Get department statistics with doctor counts
   * @route GET /api/v1/departments/:id/statistics
   */
  static getDepartmentStatistics = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Get department with statistics
    const result = await DepartmentService.getDepartmentWithStatistics(id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  });
}
