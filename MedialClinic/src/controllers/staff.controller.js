import { StaffService } from '../services/staff.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for staff-related endpoints
 */
export class StaffController {
  /**
   * Get all staff
   * @route GET /api/v1/staff
   */
  static getAllStaff = asyncErrorHandler(async (req, res, next) => {
    const { name, department, status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    
    if (department) filters.department = department;
    if (status) filters.status = status;
    
    let result;
    
    if (name) {
      result = await StaffService.searchStaffByName(name, filters, page, limit);
    } else {
      result = await StaffService.getAllStaff(filters, page, limit);
    }
    
    res.status(200).json({
      status: 'success',
      results: result.staff.length,
      pagination: result.pagination,
      data: { staff: result.staff }
    });
  });
  
  /**
   * Get staff by ID
   * @route GET /api/v1/staff/:id
   */
  static getStaffById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const staff = await StaffService.getStaffById(id);
    
    res.status(200).json({
      status: 'success',
      data: { staff }
    });
  });
  
  /**
   * Get staff by department
   * @route GET /api/v1/departments/:departmentId/staff
   */
  static getStaffByDepartment = asyncErrorHandler(async (req, res, next) => {
    const { departmentId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    
    if (status) filters.status = status;
    
    const result = await StaffService.getStaffByDepartment(departmentId, filters, page, limit);
    
    res.status(200).json({
      status: 'success',
      results: result.staff.length,
      pagination: result.pagination,
      data: { staff: result.staff }
    });
  });
  
  /**
   * Create a new staff
   * @route POST /api/v1/staff
   */
  static createStaff = asyncErrorHandler(async (req, res, next) => {
    const staffData = req.body;
    
    const staff = await StaffService.createStaff(staffData);
    
    res.status(201).json({
      status: 'success',
      data: { staff }
    });
  });
  
  /**
   * Update a staff
   * @route PATCH /api/v1/staff/:id
   */
  static updateStaff = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const staff = await StaffService.updateStaff(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { staff }
    });
  });
  
  /**
   * Delete a staff
   * @route DELETE /api/v1/staff/:id
   */
  static deleteStaff = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await StaffService.deleteStaff(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  /**
   * Get leave requests for a staff member
   * @route GET /api/v1/staff/:id/leave-requests
   */
  static getStaffLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status, startDate, endDate, leaveTypeId, page = 1, limit = 20 } = req.query;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid staff ID format', 400));
    }
    
    const filters = {};
    
    if (status) filters.status = status;
    if (leaveTypeId) {
      // Validate MongoDB ObjectId format for leaveTypeId if provided
      if (!/^[0-9a-fA-F]{24}$/.test(leaveTypeId)) {
        return next(new AppError('Invalid leave type ID format', 400));
      }
      filters.leaveTypeId = leaveTypeId;
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    
    const { LeaveRequestService } = await import('../services/leaveRequest.service.js');
    const result = await LeaveRequestService.getEntityLeaveRequests('staff', id, filters, page, limit);
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { leaveRequests: result.requests }
    });
  });
}
