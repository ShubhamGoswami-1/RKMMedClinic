import MedicalService from '../models/medicalService.js';
import AppError from '../../utils/appError.js';

/**
 * MedicalService Repository - Handles data access for medical services
 */
export class MedicalServiceRepository {
  /**
   * Find a medical service by ID
   * @param {string} serviceId - Medical service ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Medical service or null if not found
   */
  static async findById(serviceId, populate = false) {
    let query = MedicalService.findById(serviceId);
    
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('createdBy', 'username')
                  .populate('approvedBy', 'username');
    }
    
    const service = await query;
    return service;
  }
  
  /**
   * Find a medical service by code
   * @param {string} code - Service code
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Medical service or null if not found
   */
  static async findByCode(code, populate = false) {
    let query = MedicalService.findOne({ code: code.trim() });
    
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('createdBy', 'username')
                  .populate('approvedBy', 'username');
    }
    
    const service = await query;
    return service;
  }
  
  /**
   * Find a medical service by name
   * @param {string} name - Service name
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Medical service or null if not found
   */
  static async findByName(name, populate = false) {
    let query = MedicalService.findOne({ name: name.trim() });
    
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('createdBy', 'username')
                  .populate('approvedBy', 'username');
    }
    
    const service = await query;
    return service;
  }
  
  /**
   * Search medical services by text query
   * @param {string} searchText - Text to search for
   * @param {boolean} activeOnly - Whether to return only active services
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of matching services
   */
  static async searchByText(searchText, activeOnly = true, populate = false) {
    if (!searchText) return [];
    
    const filter = { $text: { $search: searchText } };
    
    if (activeOnly) {
      filter.active = true;
    }
    
    let query = MedicalService.find(filter)
      .sort({ score: { $meta: 'textScore' } });
    
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('createdBy', 'username')
                  .populate('approvedBy', 'username');
    }
    
    const services = await query;
    return services;
  }
  
  /**
   * Get all medical services
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options (sort, limit, skip)
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of medical services
   */
  static async findAll(filter = {}, options = {}, populate = false) {
    const { sort = { name: 1 }, limit = 100, skip = 0 } = options;
    
    let query = MedicalService.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);
      
    if (populate) {
      query = query.populate('departmentId', 'name')
                  .populate('createdBy', 'username')
                  .populate('approvedBy', 'username');
    }
    
    const services = await query;
    return services;
  }
  
  /**
   * Get all active medical services
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of active services
   */
  static async findActive(options = {}, populate = false) {
    return this.findAll({ active: true }, options, populate);
  }
  
  /**
   * Find medical services by department ID
   * @param {string} departmentId - Department ID
   * @param {boolean} activeOnly - Whether to return only active services
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of medical services
   */
  static async findByDepartment(departmentId, activeOnly = true, options = {}, populate = false) {
    const filter = { departmentId };
    
    if (activeOnly) {
      filter.active = true;
    }
    
    return this.findAll(filter, options, populate);
  }
  
  /**
   * Find medical services by type (test or procedure)
   * @param {boolean} isTest - Whether to find tests
   * @param {boolean} isProcedure - Whether to find procedures
   * @param {boolean} activeOnly - Whether to return only active services
   * @param {Object} options - Query options
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of medical services
   */
  static async findByType(isTest, isProcedure, activeOnly = true, options = {}, populate = false) {
    const filter = {};
    
    if (isTest) {
      filter.isTest = true;
    }
    
    if (isProcedure) {
      filter.isProcedure = true;
    }
    
    if (activeOnly) {
      filter.active = true;
    }
    
    return this.findAll(filter, options, populate);
  }
  
  /**
   * Count total medical services
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} - Total count
   */
  static async count(filter = {}) {
    return MedicalService.countDocuments(filter);
  }
  
  /**
   * Check if medical service exists with the given name or code
   * @param {string} name - Service name
   * @param {string} code - Service code
   * @returns {Promise<boolean>} - Whether a service exists
   */
  static async exists(name, code) {
    const service = await MedicalService.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim() }
      ]
    });
    
    return !!service;
  }
  
  /**
   * Create a new medical service
   * @param {Object} serviceData - Medical service data
   * @returns {Promise<Object>} - Created medical service
   */
  static async create(serviceData) {
    const service = await MedicalService.create(serviceData);
    return service;
  }
  
  /**
   * Update a medical service by ID
   * @param {string} serviceId - Medical service ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated medical service
   * @throws {AppError} - If service not found
   */
  static async update(serviceId, updateData) {
    const service = await MedicalService.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true }
    );
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    return service;
  }
  
  /**
   * Delete a medical service by ID
   * @param {string} serviceId - Medical service ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If service not found
   */
  static async delete(serviceId) {
    const service = await MedicalService.findByIdAndDelete(serviceId);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    return service;
  }
  
  /**
   * Activate or deactivate a medical service
   * @param {string} serviceId - Medical service ID
   * @param {boolean} active - Active status
   * @returns {Promise<Object>} - Updated medical service
   */
  static async setActive(serviceId, active) {
    return this.update(serviceId, { active });
  }
  
  /**
   * Approve a medical service
   * @param {string} serviceId - Medical service ID
   * @param {string} approvedById - ID of the user who approved
   * @returns {Promise<Object>} - Updated medical service
   */
  static async approve(serviceId, approvedById) {
    return this.update(serviceId, {
      approvedBy: approvedById,
      active: true
    });
  }
}
