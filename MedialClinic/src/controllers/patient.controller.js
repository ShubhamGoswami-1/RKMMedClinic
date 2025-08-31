import { PatientService } from '../services/patient.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for patient-related endpoints
 */
export class PatientController {
  /**
   * Get all patients with pagination
   * @route GET /api/v1/patients
   */
  static getAllPatients = asyncErrorHandler(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await PatientService.getAllPatients(
      parseInt(page, 10), 
      parseInt(limit, 10)
    );
    
    res.status(200).json({
      status: 'success',
      results: result.patients.length,
      pagination: result.pagination,
      data: { patients: result.patients }
    });
  });
  
  /**
   * Search for patients
   * @route GET /api/v1/patients/search
   */
  static searchPatients = asyncErrorHandler(async (req, res, next) => {
    const { name, email, phone, aadhar, pan } = req.query;
    
    // At least one search parameter is required
    if (!name && !email && !phone && !aadhar && !pan) {
      return next(new AppError('At least one search parameter is required', 400));
    }
    
    const patients = await PatientService.searchPatients({
      name,
      email,
      phone,
      aadhar,
      pan
    });
    
    res.status(200).json({
      status: 'success',
      results: patients.length,
      data: { patients }
    });
  });
  
  /**
   * Get a patient by ID
   * @route GET /api/v1/patients/:id
   */
  static getPatientById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const patient = await PatientService.getPatientById(id);
    
    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  });
  
  /**
   * Create a new patient
   * @route POST /api/v1/patients
   */
  static createPatient = asyncErrorHandler(async (req, res, next) => {
    const patientData = req.body;
    
    const patient = await PatientService.createPatient(patientData);
    
    res.status(201).json({
      status: 'success',
      data: { patient }
    });
  });
  
  /**
   * Update a patient
   * @route PATCH /api/v1/patients/:id
   */
  static updatePatient = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const patient = await PatientService.updatePatient(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  });
  
  /**
   * Delete a patient
   * @route DELETE /api/v1/patients/:id
   */
  static deletePatient = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await PatientService.deletePatient(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Update patient medical history
   * @route PATCH /api/v1/patients/:id/medical-history
   */
  static updateMedicalHistory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { medicalHistory } = req.body;
    
    if (!medicalHistory) {
      return next(new AppError('Medical history is required', 400));
    }
    
    const patient = await PatientService.updateMedicalHistory(id, medicalHistory);
    
    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  });
  
  /**
   * Add allergies to patient
   * @route POST /api/v1/patients/:id/allergies
   */
  static addAllergies = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { allergies } = req.body;
    
    if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
      return next(new AppError('Allergies must be a non-empty array', 400));
    }
    
    const patient = await PatientService.addAllergies(id, allergies);
    
    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  });
}
