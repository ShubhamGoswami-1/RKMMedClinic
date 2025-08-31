import express from 'express';
import { DepartmentController } from '../../src/controllers/department.controller.js';
import { DoctorController } from '../../src/controllers/doctor.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', DepartmentController.getAllDepartments);
router.get('/:id', DepartmentController.getDepartmentById);
router.get('/:departmentId/doctors', DoctorController.getDoctorsByDepartment);
router.get('/:id/statistics', DepartmentController.getDepartmentStatistics);

// Routes restricted to admin and manager roles
router.use(restrictTo('admin', 'manager'));
router.post('/', DepartmentController.createDepartment);
router.patch('/:id', DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);
router.patch('/:id/status', DepartmentController.setDepartmentStatus);

export default router;
