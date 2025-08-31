import express from 'express';
import { LeaveBalanceController } from '../../src/controllers/leaveBalance.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes accessible to all authenticated users
router.get('/my', LeaveBalanceController.getMyLeaveBalance);

// Routes accessible only to admin
router.use(restrictTo('admin'));
router.get('/', LeaveBalanceController.getAllUserLeaveBalances);
router.get('/user/:userId', LeaveBalanceController.getUserLeaveBalance);
router.patch('/user/:userId/allocate', LeaveBalanceController.updateLeaveAllocation);
router.patch('/user/:userId/carry-forward', LeaveBalanceController.updateLeaveCarryForward);

export default router;
