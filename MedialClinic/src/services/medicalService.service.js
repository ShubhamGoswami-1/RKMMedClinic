import { MedicalServiceRepository } from '../repositories/medicalService.repository.js';
import { DepartmentRepository } from '../repositories/department.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Service class for medical service-related operations
 */
export class MedicalServiceService {
  /**
   * Get a medical service by ID
   * @param {string} serviceId - Medical service ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Medical service data
   */
  static async getServiceById(serviceId, populate = true) {
    const service = await MedicalServiceRepository.findById(serviceId, populate);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    return service;
  }
  
  /**
   * Get a medical service by code
   * @param {string} code - Service code
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Medical service data
   */
  static async getServiceByCode(code, populate = true) {
    const service = await MedicalServiceRepository.findByCode(code, populate);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    return service;
  }
  
  /**
   * Search for medical services
   * @param {string} searchText - Text to search for
   * @param {boolean} activeOnly - Whether to return only active services
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of matching services
   */
  static async searchServices(searchText, activeOnly = true, populate = true) {
    if (!searchText || searchText.trim() === '') {
      return [];
    }
    
    return MedicalServiceRepository.searchByText(searchText, activeOnly, populate);
  }
  
  /**
   * Get all medical services with pagination
   * @param {Object} filter - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of services per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated services data
   */
  static async getAllServices(filter = {}, page = 1, limit = 20, populate = true) {
    const skip = (page - 1) * limit;
    
    const services = await MedicalServiceRepository.findAll(filter, {
      limit,
      skip,
      sort: { name: 1 }
    }, populate);
    
    const total = await MedicalServiceRepository.count(filter);
    const totalPages = Math.ceil(total / limit);
    
    return {
      services,
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
   * Get all active services
   * @param {number} page - Page number
   * @param {number} limit - Number of services per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated active services data
   */
  static async getActiveServices(page = 1, limit = 20, populate = true) {
    return this.getAllServices({ active: true }, page, limit, populate);
  }
  
  /**
   * Get services by department
   * @param {string} departmentId - Department ID
   * @param {boolean} activeOnly - Whether to return only active services
   * @param {number} page - Page number
   * @param {number} limit - Number of services per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated services data
   */
  static async getServicesByDepartment(departmentId, activeOnly = true, page = 1, limit = 20, populate = true) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    const filter = { departmentId };
    if (activeOnly) {
      filter.active = true;
    }
    
    return this.getAllServices(filter, page, limit, populate);
  }
  
  /**
   * Get services by type (test or procedure)
   * @param {boolean} isTest - Whether to get tests
   * @param {boolean} isProcedure - Whether to get procedures
   * @param {boolean} activeOnly - Whether to return only active services
   * @param {number} page - Page number
   * @param {number} limit - Number of services per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated services data
   */
  static async getServicesByType(isTest, isProcedure, activeOnly = true, page = 1, limit = 20, populate = true) {
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
    
    return this.getAllServices(filter, page, limit, populate);
  }
  
  /**
   * Create a new medical service
   * @param {Object} serviceData - Medical service data
   * @param {string} userId - ID of the user creating the service
   * @returns {Promise<Object>} - Created medical service
   */
  static async createService(serviceData, userId) {
    // Verify that department exists
    const department = await DepartmentRepository.findById(serviceData.departmentId);
    
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    // Check if service with same name or code already exists
    const exists = await MedicalServiceRepository.exists(serviceData.name, serviceData.code);
    
    if (exists) {
      throw new AppError('Medical service with this name or code already exists', 400);
    }
    
    // Set created by user ID
    serviceData.createdBy = userId;
    
    return MedicalServiceRepository.create(serviceData);
  }
  
  /**
   * Update a medical service
   * @param {string} serviceId - Medical service ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated medical service
   */
  static async updateService(serviceId, updateData) {
    // First check if service exists
    const service = await MedicalServiceRepository.findById(serviceId);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    // If departmentId is being updated, verify that department exists
    if (updateData.departmentId && updateData.departmentId.toString() !== service.departmentId.toString()) {
      const department = await DepartmentRepository.findById(updateData.departmentId);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
    }
    
    // If name or code is being updated, check for duplicates
    if ((updateData.name && updateData.name !== service.name) || 
        (updateData.code && updateData.code !== service.code)) {
      
      const checkName = updateData.name || service.name;
      const checkCode = updateData.code || service.code;
      
      // Check if another service has the same name or code
      const duplicate = await MedicalServiceRepository.findOne({
        $or: [
          { name: checkName, _id: { $ne: serviceId } },
          { code: checkCode, _id: { $ne: serviceId } }
        ]
      });
      
      if (duplicate) {
        throw new AppError('Another medical service with this name or code already exists', 400);
      }
    }
    
    return MedicalServiceRepository.update(serviceId, updateData);
  }
  
  /**
   * Delete a medical service
   * @param {string} serviceId - Medical service ID
   * @returns {Promise<Object>} - Deleted medical service
   */
  static async deleteService(serviceId) {
    // Check if service exists
    const service = await MedicalServiceRepository.findById(serviceId);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    // TODO: Check if service is being used by appointments
    // If so, prevent deletion or implement soft delete by deactivating
    
    return MedicalServiceRepository.delete(serviceId);
  }
  
  /**
   * Activate or deactivate a medical service
   * @param {string} serviceId - Medical service ID
   * @param {boolean} active - Whether to activate or deactivate
   * @returns {Promise<Object>} - Updated medical service
   */
  static async setServiceStatus(serviceId, active) {
    // Check if service exists
    const service = await MedicalServiceRepository.findById(serviceId);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    return MedicalServiceRepository.setActive(serviceId, active);
  }
  
  /**
   * Approve a medical service
   * @param {string} serviceId - Medical service ID
   * @param {string} approvedById - ID of the user approving the service
   * @returns {Promise<Object>} - Updated medical service
   */
  static async approveService(serviceId, approvedById) {
    // Check if service exists
    const service = await MedicalServiceRepository.findById(serviceId);
    
    if (!service) {
      throw new AppError('Medical service not found', 404);
    }
    
    return MedicalServiceRepository.approve(serviceId, approvedById);
  }
}
