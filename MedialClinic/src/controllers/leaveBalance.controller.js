import { LeaveBalanceService } from '../services/leaveBalance.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for leave balance-related endpoints
 */
export class LeaveBalanceController {
  /**
   * Get leave balance for current user
   * @route GET /api/v1/leave-balances/my
   */
  static getMyLeaveBalance = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const leaveBalances = await LeaveBalanceService.getUserLeaveBalance(userId, year);
    
    res.status(200).json({
      status: 'success',
      data: { leaveBalances }
    });
  });

  /**
   * Get leave balance for a specific user (admin only)
   * @route GET /api/v1/leave-balances/user/:userId
   */
  static getUserLeaveBalance = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const leaveBalances = await LeaveBalanceService.getUserLeaveBalance(userId, year);
    
    res.status(200).json({
      status: 'success',
      data: { leaveBalances }
    });
  });

  /**
   * Get leave balances for all users (admin only)
   * @route GET /api/v1/leave-balances
   */
  static getAllUserLeaveBalances = asyncErrorHandler(async (req, res, next) => {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const leaveBalances = await LeaveBalanceService.getAllUserLeaveBalances(year);
    
    res.status(200).json({
      status: 'success',
      results: leaveBalances.length,
      data: { leaveBalances }
    });
  });

  /**
   * Update leave allocation for a user (admin only)
   * @route PATCH /api/v1/leave-balances/user/:userId/allocate
   */
  static updateLeaveAllocation = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { leaveTypeId, days, year = new Date().getFullYear() } = req.body;
    
    // Validate required fields
    if (!leaveTypeId) {
      return next(new AppError('Leave type ID is required', 400));
    }
    
    if (days === undefined || days === null) {
      return next(new AppError('Number of days is required', 400));
    }
    
    const leaveBalance = await LeaveBalanceService.updateLeaveAllocation(
      userId,
      leaveTypeId,
      days,
      parseInt(year)
    );
    
    res.status(200).json({
      status: 'success',
      data: { leaveBalance }
    });
  });

  /**
   * Update carry forward for a user's leave balance (admin only)
   * @route PATCH /api/v1/leave-balances/user/:userId/carry-forward
   */
  static updateLeaveCarryForward = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { leaveTypeId, days, fromYear, toYear } = req.body;
    
    // Validate required fields
    if (!leaveTypeId) {
      return next(new AppError('Leave type ID is required', 400));
    }
    
    if (days === undefined || days === null) {
      return next(new AppError('Number of days is required', 400));
    }
    
    if (!fromYear || !toYear) {
      return next(new AppError('Both fromYear and toYear are required', 400));
    }
    
    const leaveBalance = await LeaveBalanceService.updateLeaveCarryForward(
      userId,
      leaveTypeId,
      days,
      parseInt(fromYear),
      parseInt(toYear)
    );
    
    res.status(200).json({
      status: 'success',
      data: { leaveBalance }
    });
  });
}
