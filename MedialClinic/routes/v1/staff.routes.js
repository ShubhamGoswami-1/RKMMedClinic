import express from 'express';
import { StaffController } from '../../src/controllers/staff.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', StaffController.getAllStaff);
router.get('/:id', StaffController.getStaffById);

// Admin-only routes for leave requests
router.get('/:id/leave-requests', restrictTo('admin'), StaffController.getStaffLeaveRequests);

// Routes accessible only to admin
router.use(restrictTo('admin'));
router.post('/', StaffController.createStaff);
router.patch('/:id', StaffController.updateStaff);
router.delete('/:id', StaffController.deleteStaff);

export default router;
