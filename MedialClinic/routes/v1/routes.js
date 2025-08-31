import express from 'express';
import authRoutes from './auth.routes.js';
import departmentRoutes from './department.routes.js';
import doctorRoutes from './doctor.routes.js';
import patientRoutes from './patient.routes.js';
import appointmentRoutes from './appointment.routes.js';
import medicalServiceRoutes from './medicalService.routes.js';
import serviceRequestRoutes from './serviceRequest.routes.js';
import leaveTypeRoutes from './leaveType.routes.js';
import leaveBalanceRoutes from './leaveBalance.routes.js';
import leaveRequestRoutes from './leaveRequest.routes.js';
import staffRoutes from './staff.routes.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working!'
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-services', medicalServiceRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/leave-types', leaveTypeRoutes);
router.use('/leave-balances', leaveBalanceRoutes);
router.use('/leave-requests', leaveRequestRoutes);
router.use('/staff', staffRoutes);

// Cross-resource routes
router.use('/departments/:departmentId/doctors', (req, res, next) => {
  req.query.departmentId = req.params.departmentId;
  next();
}, doctorRoutes);

router.use('/departments/:departmentId/medical-services', (req, res, next) => {
  req.query.departmentId = req.params.departmentId;
  next();
}, medicalServiceRoutes);

router.use('/departments/:departmentId/appointments', (req, res, next) => {
  req.query.departmentId = req.params.departmentId;
  next();
}, appointmentRoutes);

router.use('/departments/:departmentId/service-requests', (req, res, next) => {
  req.query.departmentId = req.params.departmentId;
  next();
}, serviceRequestRoutes);

router.use('/users/:userId/doctor', (req, res, next) => {
  req.query.userId = req.params.userId;
  next();
}, doctorRoutes);

export default router;