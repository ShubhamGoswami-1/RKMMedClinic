import { PatientRepository } from '../repositories/patient.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Service class for patient-related operations
 */
export class PatientService {
  /**
   * Get a patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} - Patient data
   */
  static async getPatientById(patientId) {
    const patient = await PatientRepository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    return patient;
  }
  
  /**
   * Search for patients
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.name - Name to search for
   * @param {string} searchParams.email - Email to search for
   * @param {string} searchParams.phone - Phone to search for
   * @param {string} searchParams.aadhar - Aadhar number to search for
   * @param {string} searchParams.pan - PAN number to search for
   * @returns {Promise<Array>} - Array of matching patients
   */
  static async searchPatients({ name, email, phone, aadhar, pan }) {
    // If name is provided, search by name
    if (name) {
      return PatientRepository.searchByName(name);
    }
    
    // If email is provided, search by email
    if (email) {
      const patient = await PatientRepository.findByEmail(email);
      return patient ? [patient] : [];
    }
    
    // If phone is provided, search by phone
    if (phone) {
      const patient = await PatientRepository.findByPhone(phone);
      return patient ? [patient] : [];
    }
    
    // If aadhar is provided, search by aadhar
    if (aadhar) {
      const patient = await PatientRepository.findByAadhar(aadhar);
      return patient ? [patient] : [];
    }
    
    // If pan is provided, search by pan
    if (pan) {
      const patient = await PatientRepository.findByPAN(pan);
      return patient ? [patient] : [];
    }
    
    // If no search parameters provided, return empty array
    return [];
  }
  
  /**
   * Get all patients with pagination
   * @param {number} page - Page number
   * @param {number} limit - Number of patients per page
   * @returns {Promise<Object>} - Paginated patients data
   */
  static async getAllPatients(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const patients = await PatientRepository.findAll({}, {
      limit,
      skip,
      sort: { createdAt: -1 }
    });
    
    const total = await PatientRepository.count();
    const totalPages = Math.ceil(total / limit);
    
    return {
      patients,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
  
  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} - Created patient
   */
  static async createPatient(patientData) {
    // Check if patient with same identifiers already exists
    const exists = await PatientRepository.existsByIdentifiers({
      email: patientData.email,
      phone: patientData.phone,
      aadhar: patientData.identifiers?.aadhar,
      pan: patientData.identifiers?.pan
    });
    
    if (exists) {
      throw new AppError('Patient with these details already exists', 400);
    }
    
    // Calculate age from date of birth
    if (patientData.dateOfBirth) {
      const dob = new Date(patientData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      patientData.age = age;
    }
    
    return PatientRepository.create(patientData);
  }
  
  /**
   * Update a patient
   * @param {string} patientId - Patient ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated patient
   */
  static async updatePatient(patientId, updateData) {
    // First check if patient exists
    const patient = await PatientRepository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    // If any identifier is being updated, check for duplicates
    if (updateData.email || updateData.phone || 
        updateData.identifiers?.aadhar || updateData.identifiers?.pan) {
      
      // Only check the identifiers that are being updated
      const identifiersToCheck = {
        email: updateData.email || undefined,
        phone: updateData.phone || undefined,
        aadhar: updateData.identifiers?.aadhar || undefined,
        pan: updateData.identifiers?.pan || undefined
      };
      
      // If any identifier already exists for another patient, throw error
      const exists = await PatientRepository.existsByIdentifiers(identifiersToCheck);
      
      if (exists) {
        throw new AppError('Another patient with these details already exists', 400);
      }
    }
    
    // If date of birth is being updated, recalculate age
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      updateData.age = age;
    }
    
    return PatientRepository.update(patientId, updateData);
  }
  
  /**
   * Delete a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} - Deleted patient
   */
  static async deletePatient(patientId) {
    // Check if patient exists
    const patient = await PatientRepository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    // TODO: Check if patient has appointments
    // If so, prevent deletion or implement soft delete
    
    return PatientRepository.delete(patientId);
  }
  
  /**
   * Update patient medical history
   * @param {string} patientId - Patient ID
   * @param {string} medicalHistory - New medical history
   * @returns {Promise<Object>} - Updated patient
   */
  static async updateMedicalHistory(patientId, medicalHistory) {
    // Check if patient exists
    const patient = await PatientRepository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    return PatientRepository.updateMedicalHistory(patientId, medicalHistory);
  }
  
  /**
   * Add allergies to patient
   * @param {string} patientId - Patient ID
   * @param {Array} allergies - Array of allergies to add
   * @returns {Promise<Object>} - Updated patient
   */
  static async addAllergies(patientId, allergies) {
    // Check if patient exists
    const patient = await PatientRepository.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    if (!Array.isArray(allergies) || allergies.length === 0) {
      throw new AppError('Allergies must be a non-empty array', 400);
    }
    
    return PatientRepository.addAllergies(patientId, allergies);
  }
}
