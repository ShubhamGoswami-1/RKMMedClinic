import express from 'express';
import { AppointmentController } from '../../src/controllers/appointment.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible to all authenticated users with appropriate roles
router.get('/', AppointmentController.getAllAppointments);
router.get('/today', AppointmentController.getTodayAppointments);
router.get('/:id', AppointmentController.getAppointmentById);

// Integrated patient registration and appointment booking
router.post('/register-and-book', 
  restrictTo('admin', 'manager', 'receptionist', 'doctor', 'nurse'),
  AppointmentController.registerAndBook
);

// Routes for staff to manage appointments
router.use(restrictTo('admin', 'manager', 'receptionist', 'doctor', 'nurse'));
router.post('/', AppointmentController.createAppointment);
router.patch('/:id', AppointmentController.updateAppointment);
router.patch('/:id/status', AppointmentController.updateAppointmentStatus);
router.patch('/:id/cancel', AppointmentController.cancelAppointment);
router.patch('/:id/no-show', AppointmentController.markNoShow);

export default router;
