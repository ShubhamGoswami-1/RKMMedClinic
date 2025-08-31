import express from 'express';
import { MedicalServiceController } from '../../src/controllers/medicalService.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', MedicalServiceController.getAllServices);
router.get('/type', MedicalServiceController.getServicesByType);
router.get('/:id', MedicalServiceController.getServiceById);
router.get('/code/:code', MedicalServiceController.getServiceByCode);

// Routes restricted to medical staff and admin roles
router.use(restrictTo('admin', 'manager', 'doctor', 'nurse', 'lab-technician'));
router.post('/', MedicalServiceController.createService);

// Routes restricted to admin and manager roles
router.use(restrictTo('admin', 'manager'));
router.patch('/:id', MedicalServiceController.updateService);
router.delete('/:id', MedicalServiceController.deleteService);
router.patch('/:id/status', MedicalServiceController.setServiceStatus);
router.patch('/:id/approve', MedicalServiceController.approveService);

export default router;
