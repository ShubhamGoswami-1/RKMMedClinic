import { LeaveRequestService } from '../services/leaveRequest.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';
import { format, parseISO } from 'date-fns';

/**
 * Helper function to convert a date from IST to UTC
 * @param {string|Date} date - The date to convert
 * @returns {Date} The UTC date
 */
const convertISTtoUTC = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Date(dateObj.getTime() - (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
};

/**
 * Controller for leave request-related endpoints
 */
export class LeaveRequestController {
  /**
   * Get all leave requests (admin only)
   * @route GET /api/v1/leave-requests
   */  static getAllLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    const { 
      status, 
      startDate, 
      endDate, 
      leaveTypeId,
      userId
    } = req.query;
    
    const filters = {};
    
    if (status) filters.status = status;
    
    if (leaveTypeId) {
      // Validate MongoDB ObjectId format for leaveTypeId if provided
      if (!/^[0-9a-fA-F]{24}$/.test(leaveTypeId)) {
        return next(new AppError('Invalid leave type ID format', 400));
      }
      filters.leaveTypeId = leaveTypeId;
    }
    
    if (userId) {
      // Validate MongoDB ObjectId format for userId if provided
      if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        return next(new AppError('Invalid user ID format', 400));
      }
      filters.userId = userId;
    }
    
    if (startDate) {
      filters.startDate = convertISTtoUTC(startDate);
    }
    
    if (endDate) {
      filters.endDate = convertISTtoUTC(endDate);
    }
    
    const leaveRequests = await LeaveRequestService.getAllLeaveRequests(filters);
    
    res.status(200).json({
      status: 'success',
      results: leaveRequests.length,
      data: { leaveRequests }
    });
  });
  
  /**
   * Get leave requests for a specific user
   * @route GET /api/v1/users/:userId/leave-requests
   */  static getUserLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { status, startDate, endDate, leaveTypeId } = req.query;
    
    // Validate MongoDB ObjectId format for userId
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return next(new AppError('Invalid user ID format', 400));
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
      filters.startDate = convertISTtoUTC(startDate);
    }
    
    if (endDate) {
      filters.endDate = convertISTtoUTC(endDate);
    }
    
    const leaveRequests = await LeaveRequestService.getUserLeaveRequests(userId, filters);
    
    res.status(200).json({
      status: 'success',
      results: leaveRequests.length,
      data: { leaveRequests }
    });
  });
  
  /**
   * Get current user's leave requests
   * @route GET /api/v1/me/leave-requests
   */  static getMyLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { status, startDate, endDate, leaveTypeId } = req.query;
    
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
      filters.startDate = convertISTtoUTC(startDate);
    }
    
    if (endDate) {
      filters.endDate = convertISTtoUTC(endDate);
    }
    
    const leaveRequests = await LeaveRequestService.getUserLeaveRequests(userId, filters);
    
    res.status(200).json({
      status: 'success',
      results: leaveRequests.length,
      data: { leaveRequests }
    });});
  
  /**
   * Get a specific leave request by ID
   * @route GET /api/v1/leave-requests/:id
   */  static getLeaveRequestById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid leave request ID format', 400));
    }
    
    const leaveRequest = await LeaveRequestService.getLeaveRequestById(id);
    
    if (!leaveRequest) {
      return next(new AppError('No leave request found with that ID', 404));
    }
    
    // Check if the user is authorized to view this leave request
    // Only allow if the user is the owner of the request or an admin
    if (req.user.role !== 'admin' && leaveRequest.userId.toString() !== req.user.id.toString()) {
      return next(new AppError('You are not authorized to view this leave request', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: { leaveRequest }
    });
  });
  
  /**
   * Create a new leave request
   * @route POST /api/v1/leave-requests
   */
  static createLeaveRequest = asyncErrorHandler(async (req, res, next) => {
    const requestedById = req.user.id;
    const { 
      leaveTypeId, 
      startDate, 
      endDate, 
      reason, 
      dates, 
      staffId, 
      doctorId, 
      userId 
    } = req.body;
    
    // Validate required fields
    if (!leaveTypeId) {
      return next(new AppError('Leave type ID is required', 400));
    }
    
    // Validate MongoDB ObjectId format for leaveTypeId
    if (!/^[0-9a-fA-F]{24}$/.test(leaveTypeId)) {
      return next(new AppError('Invalid leave type ID format', 400));
    }
    
    // Validate entity IDs if provided
    if (staffId && !/^[0-9a-fA-F]{24}$/.test(staffId)) {
      return next(new AppError('Invalid staff ID format', 400));
    }
    
    if (doctorId && !/^[0-9a-fA-F]{24}$/.test(doctorId)) {
      return next(new AppError('Invalid doctor ID format', 400));
    }
    
    if (userId && !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return next(new AppError('Invalid user ID format', 400));
    }
    
    // Ensure at least one entity ID is provided
    if (!staffId && !doctorId && !userId) {
      return next(new AppError('At least one of staffId, doctorId, or userId must be provided', 400));
    }
    
    // Validate date inputs
    if ((!startDate || !endDate) && (!dates || !dates.length)) {
      return next(new AppError('Either startDate and endDate or specific dates are required', 400));
    }
    
    // Process dates in IST timezone
    let processedStartDate, processedEndDate, processedDates;
    
    if (dates && dates.length) {
      // Handle multiple specific dates
      processedDates = dates.map(date => convertISTtoUTC(date));
    } else {
      // Handle date range
      processedStartDate = convertISTtoUTC(startDate);
      processedEndDate = convertISTtoUTC(endDate);
    }
    
    const requestData = {
      leaveTypeId,
      staffId,
      doctorId,
      userId,
      startDate: processedStartDate,
      endDate: processedEndDate,
      dates: processedDates,
      reason
    };
    
    const leaveRequest = await LeaveRequestService.createLeaveRequest(requestedById, requestData);
    
    res.status(201).json({
      status: 'success',
      data: { leaveRequest }
    });
  });
  
  /**
   * Update a leave request
   * @route PATCH /api/v1/leave-requests/:id
   */  static updateLeaveRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { leaveTypeId, startDate, endDate, reason, dates, status, contactDetails } = req.body;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid leave request ID format', 400));
    }
    
    const updateData = {};
    
    if (leaveTypeId) {
      // Validate MongoDB ObjectId format for leaveTypeId if provided
      if (!/^[0-9a-fA-F]{24}$/.test(leaveTypeId)) {
        return next(new AppError('Invalid leave type ID format', 400));
      }
      updateData.leaveTypeId = leaveTypeId;
    }
    if (reason) updateData.reason = reason;
    if (contactDetails) updateData.contactDetails = contactDetails;
    if (status) updateData.status = status;
    
    // Process dates in IST timezone
    if (dates && dates.length) {
      // Handle multiple specific dates
      updateData.dates = dates.map(date => convertISTtoUTC(date));
      // Clear start and end dates when using specific dates
      updateData.startDate = null;
      updateData.endDate = null;
    } else if (startDate && endDate) {
      // Handle date range
      updateData.startDate = convertISTtoUTC(startDate);
      updateData.endDate = convertISTtoUTC(endDate);
      // Clear specific dates when using date range
      updateData.dates = null;
    }
      const leaveRequest = await LeaveRequestService.updateLeaveRequest(id, req.user.id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { leaveRequest }
    });
  });
  
  /**
   * Delete a leave request
   * @route DELETE /api/v1/leave-requests/:id
   */  static deleteLeaveRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid leave request ID format', 400));
    }
    
    await LeaveRequestService.deleteLeaveRequest(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Approve a leave request
   * @route PATCH /api/v1/leave-requests/:id/approve
   */  static approveLeaveRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { comments } = req.body;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid leave request ID format', 400));
    }
    
    const leaveRequest = await LeaveRequestService.approveLeaveRequest(id, req.user.id, comments);
    
    res.status(200).json({
      status: 'success',
      data: { leaveRequest }
    });
  });
  
  /**
   * Reject a leave request
   * @route PATCH /api/v1/leave-requests/:id/reject
   */  static rejectLeaveRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { comments } = req.body;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid leave request ID format', 400));
    }
    
    const leaveRequest = await LeaveRequestService.rejectLeaveRequest(id, req.user.id, comments);
    
    res.status(200).json({
      status: 'success',
      data: { leaveRequest }
    });
  });
  
  /**
   * Cancel a leave request
   * @route PATCH /api/v1/leave-requests/:id/cancel
   */  static cancelLeaveRequest = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid leave request ID format', 400));
    }
    
    // Ensure the cancellation reason is provided
    if (!reason) {
      return next(new AppError('Cancellation reason is required', 400));
    }
    
    const leaveRequest = await LeaveRequestService.cancelLeaveRequest(id, req.user.id, reason);
    
    res.status(200).json({
      status: 'success',
      data: { leaveRequest }
    });
  });

  /**
   * Get leave requests for a specific entity (staff or doctor)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   * @param {string} entityType - Type of entity ('staff' or 'doctor')
   */
  static getEntityLeaveRequests = async (req, res, next, entityType) => {
    const { id: entityId } = req.params;
    const { status, startDate, endDate, leaveTypeId } = req.query;
    
    // Validate MongoDB ObjectId format for entityId
    if (!/^[0-9a-fA-F]{24}$/.test(entityId)) {
      return next(new AppError(`Invalid ${entityType} ID format`, 400));
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
      filters.startDate = convertISTtoUTC(startDate);
    }
    
    if (endDate) {
      filters.endDate = convertISTtoUTC(endDate);
    }
    
    try {
      const result = await LeaveRequestService.getEntityLeaveRequests(entityType, entityId, filters);
      
      res.status(200).json({
        status: 'success',
        results: result.requests.length,
        data: { leaveRequests: result.requests, pagination: result.pagination }
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get leave requests for a specific staff member
   * @route GET /api/v1/staff/:id/leave-requests
   */
  static getStaffLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    await this.getEntityLeaveRequests(req, res, next, 'staff');
  });
  
  /**
   * Get leave requests for a specific doctor
   * @route GET /api/v1/doctors/:id/leave-requests
   */
  static getDoctorLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    await this.getEntityLeaveRequests(req, res, next, 'doctor');
  });
}
