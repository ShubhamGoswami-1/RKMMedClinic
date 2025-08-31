import { LeaveTypeService } from '../services/leaveType.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for leave type-related endpoints
 */
export class LeaveTypeController {
  /**
   * Get all leave types
   * @route GET /api/v1/leave-types
   */
  static getAllLeaveTypes = asyncErrorHandler(async (req, res, next) => {
    const { activeOnly = 'false' } = req.query;
    const activeOnlyBool = activeOnly === 'true';
    
    const leaveTypes = await LeaveTypeService.getAllLeaveTypes(activeOnlyBool);
    
    res.status(200).json({
      status: 'success',
      results: leaveTypes.length,
      data: { leaveTypes }
    });
  });

  /**
   * Get leave type by ID
   * @route GET /api/v1/leave-types/:id
   */
  static getLeaveTypeById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const leaveType = await LeaveTypeService.getLeaveTypeById(id);
    
    res.status(200).json({
      status: 'success',
      data: { leaveType }
    });
  });

  /**
   * Create a new leave type
   * @route POST /api/v1/leave-types
   */
  static createLeaveType = asyncErrorHandler(async (req, res, next) => {
    const { name, description, defaultDays, color } = req.body;
    
    // Validate required fields
    if (!name) {
      return next(new AppError('Leave type name is required', 400));
    }
    
    const leaveType = await LeaveTypeService.createLeaveType({
      name,
      description,
      defaultDays: defaultDays || 0,
      color: color || '#3498db'
    });
    
    res.status(201).json({
      status: 'success',
      data: { leaveType }
    });
  });

  /**
   * Update a leave type
   * @route PATCH /api/v1/leave-types/:id
   */
  static updateLeaveType = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, description, defaultDays, color } = req.body;
    
    const updatedData = {};
    
    if (name !== undefined) updatedData.name = name;
    if (description !== undefined) updatedData.description = description;
    if (defaultDays !== undefined) updatedData.defaultDays = defaultDays;
    if (color !== undefined) updatedData.color = color;
    
    const leaveType = await LeaveTypeService.updateLeaveType(id, updatedData);
    
    res.status(200).json({
      status: 'success',
      data: { leaveType }
    });
  });

  /**
   * Delete a leave type
   * @route DELETE /api/v1/leave-types/:id
   */
  static deleteLeaveType = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await LeaveTypeService.deleteLeaveType(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  /**
   * Set leave type status
   * @route PATCH /api/v1/leave-types/:id/status
   */
  static setLeaveTypeStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return next(new AppError('Active status is required', 400));
    }
    
    const leaveType = await LeaveTypeService.setLeaveTypeStatus(id, active);
    
    res.status(200).json({
      status: 'success',
      data: { leaveType }
    });
  });
}
