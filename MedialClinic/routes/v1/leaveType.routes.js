import express from 'express';
import { LeaveTypeController } from '../../src/controllers/leaveType.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', LeaveTypeController.getAllLeaveTypes);
router.get('/:id', LeaveTypeController.getLeaveTypeById);

// Routes accessible only to admin
router.use(restrictTo('admin'));
router.post('/', LeaveTypeController.createLeaveType);
router.patch('/:id', LeaveTypeController.updateLeaveType);
router.delete('/:id', LeaveTypeController.deleteLeaveType);

export default router;
