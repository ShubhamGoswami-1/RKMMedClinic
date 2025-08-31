import express from 'express';
import { LeaveRequestController } from '../../src/controllers/leaveRequest.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes accessible to all authenticated staff and doctors
router.get('/my', LeaveRequestController.getMyLeaveRequests);
router.post('/', LeaveRequestController.createLeaveRequest);
router.get('/:id', LeaveRequestController.getLeaveRequestById);
router.patch('/:id', LeaveRequestController.updateLeaveRequest);
router.patch('/:id/cancel', LeaveRequestController.cancelLeaveRequest);

// Routes accessible only to admin
router.use(restrictTo('admin'));
router.get('/', LeaveRequestController.getAllLeaveRequests);
router.get('/user/:id', LeaveRequestController.getUserLeaveRequests);
router.get('/staff/:id', LeaveRequestController.getStaffLeaveRequests);
router.get('/doctor/:id', LeaveRequestController.getDoctorLeaveRequests);
router.patch('/:id/approve', LeaveRequestController.approveLeaveRequest);
router.patch('/:id/reject', LeaveRequestController.rejectLeaveRequest);

export default router;
