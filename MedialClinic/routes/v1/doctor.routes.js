import express from 'express';
import { DoctorController } from '../../src/controllers/doctor.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', DoctorController.getAllDoctors);
router.get('/:id', DoctorController.getDoctorById);
router.get('/check-availability/:id', DoctorController.checkDoctorAvailability);
router.get('/me', DoctorController.getMyDoctorProfile);

// Admin-only routes for leave requests
router.get('/:id/leave-requests', restrictTo('admin'), DoctorController.getDoctorLeaveRequests);

// Routes restricted to admin, manager, and doctor roles
router.use(restrictTo('admin', 'manager', 'doctor'));
router.patch('/:id/availability', DoctorController.updateDoctorAvailability);

// Routes restricted to admin and manager roles
router.use(restrictTo('admin', 'manager'));
router.post('/', DoctorController.createDoctor);
router.patch('/:id', DoctorController.updateDoctor);
router.patch('/:id/reassign', DoctorController.reassignDoctor);
router.patch('/:id/status', DoctorController.setDoctorStatus);
router.delete('/:id', DoctorController.deleteDoctor);

export default router;
