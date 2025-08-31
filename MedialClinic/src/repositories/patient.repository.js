import Patient from '../models/patient.js';
import AppError from '../../utils/appError.js';

/**
 * Patient Repository - Handles data access for patients
 */
export class PatientRepository {
  /**
   * Find a patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} - Patient or null if not found
   */
  static async findById(patientId) {
    const patient = await Patient.findById(patientId);
    return patient;
  }
  
  /**
   * Find a patient by email
   * @param {string} email - Email to search for
   * @returns {Promise<Object>} - Patient or null if not found
   */
  static async findByEmail(email) {
    const patient = await Patient.findOne({ email: email.toLowerCase() });
    return patient;
  }
  
  /**
   * Find a patient by phone number
   * @param {string} phone - Phone number
   * @returns {Promise<Object>} - Patient or null if not found
   */
  static async findByPhone(phone) {
    const patient = await Patient.findOne({ phone });
    return patient;
  }
  
  /**
   * Find a patient by Aadhar number
   * @param {string} aadhar - Aadhar number
   * @returns {Promise<Object>} - Patient or null if not found
   */
  static async findByAadhar(aadhar) {
    const patient = await Patient.findOne({ 'identifiers.aadhar': aadhar });
    return patient;
  }
  
  /**
   * Find a patient by PAN number
   * @param {string} pan - PAN number
   * @returns {Promise<Object>} - Patient or null if not found
   */
  static async findByPAN(pan) {
    const patient = await Patient.findOne({ 'identifiers.pan': pan });
    return patient;
  }
  
  /**
   * Search patients by name (first name or last name)
   * @param {string} name - Name to search for
   * @returns {Promise<Array>} - Array of matching patients
   */
  static async searchByName(name) {
    if (!name) return [];
    
    const patients = await Patient.find({
      $or: [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } }
      ]
    });
    
    return patients;
  }
  
  /**
   * Get all patients
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options (sort, limit, skip)
   * @returns {Promise<Array>} - Array of patients
   */
  static async findAll(filter = {}, options = {}) {
    const { sort = { createdAt: -1 }, limit = 100, skip = 0 } = options;
    
    const patients = await Patient.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);
      
    return patients;
  }
  
  /**
   * Count total patients
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} - Total count
   */
  static async count(filter = {}) {
    return Patient.countDocuments(filter);
  }
  
  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} - Created patient
   */
  static async create(patientData) {
    const patient = await Patient.create(patientData);
    return patient;
  }
  
  /**
   * Update a patient by ID
   * @param {string} patientId - Patient ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated patient
   * @throws {AppError} - If patient not found
   */
  static async update(patientId, updateData) {
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      updateData,
      { new: true }
    );
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    return patient;
  }
  
  /**
   * Delete a patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If patient not found
   */
  static async delete(patientId) {
    const patient = await Patient.findByIdAndDelete(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    return patient;
  }
  
  /**
   * Update patient medical history
   * @param {string} patientId - Patient ID
   * @param {string} medicalHistory - New medical history
   * @returns {Promise<Object>} - Updated patient
   */
  static async updateMedicalHistory(patientId, medicalHistory) {
    return this.update(patientId, { medicalHistory });
  }
  
  /**
   * Add allergies to patient
   * @param {string} patientId - Patient ID
   * @param {Array} allergies - Array of allergies to add
   * @returns {Promise<Object>} - Updated patient
   */
  static async addAllergies(patientId, allergies) {
    const patient = await this.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
    
    // Add new allergies (avoiding duplicates)
    const existingAllergies = patient.allergies || [];
    const newAllergies = [...new Set([...existingAllergies, ...allergies])];
    
    return this.update(patientId, { allergies: newAllergies });
  }
    /**
   * Check if patient exists with given identifiers (email, aadhar, or PAN)
   * @param {Object} identifiers - Identifier values
   * @returns {Promise<boolean>} - Whether patient exists
   */
  static async existsByIdentifiers({ email, phone, aadhar, pan }) {
    const filters = [];
    
    if (email) filters.push({ email: email.toLowerCase() });
    // Removing phone from uniqueness check as per requirements
    // if (phone) filters.push({ phone });
    if (aadhar) filters.push({ 'identifiers.aadhar': aadhar });
    if (pan) filters.push({ 'identifiers.pan': pan });
    
    if (filters.length === 0) return false;
    
    const patient = await Patient.findOne({ $or: filters });
    return !!patient;
  }
}
