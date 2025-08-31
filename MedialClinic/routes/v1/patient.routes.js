import express from 'express';
import { PatientController } from '../../src/controllers/patient.controller.js';
import { AppointmentController } from '../../src/controllers/appointment.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible to authenticated users with appropriate roles
router.get('/', PatientController.getAllPatients);
router.get('/search', PatientController.searchPatients);
router.get('/:id', PatientController.getPatientById);

// Patient appointments
router.get('/:patientId/appointments', AppointmentController.getAppointmentsByPatient);

// Routes restricted to medical staff (doctor, nurse, lab-technician) and admin/manager
router.use(restrictTo('admin', 'manager', 'doctor', 'nurse', 'lab-technician'));
router.post('/', PatientController.createPatient);
router.patch('/:id', PatientController.updatePatient);
router.patch('/:id/medical-history', PatientController.updateMedicalHistory);
router.post('/:id/allergies', PatientController.addAllergies);

// Routes restricted to admin and manager roles
router.use(restrictTo('admin', 'manager'));
router.delete('/:id', PatientController.deletePatient);

export default router;
