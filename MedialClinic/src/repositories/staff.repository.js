import Staff from '../models/staff.js';
import AppError from '../../utils/appError.js';

/**
 * Staff Repository - Handles data access for staff
 */
export class StaffRepository {
  /**
   * Find all staff with pagination
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated staff
   */
  static async findAll(filters = {}, page = 1, limit = 20, populate = false) {
    const skip = (page - 1) * limit;
    
    let query = Staff.find(filters)
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit);
    
    if (populate) {
      query = query.populate('department')
                   .populate('linkedUserId', 'username email role');
    }
    
    const [staff, total] = await Promise.all([
      query.exec(),
      Staff.countDocuments(filters)
    ]);
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    return { staff, pagination };
  }

  /**
   * Find staff by ID
   * @param {string} id - Staff ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Staff
   * @throws {AppError} - If staff not found
   */
  static async findById(id, populate = false) {
    let query = Staff.findById(id);
    
    if (populate) {
      query = query.populate('department')
                   .populate('linkedUserId', 'username email role');
    }
    
    const staff = await query.exec();
    
    if (!staff) {
      throw new AppError('Staff not found', 404);
    }
    
    return staff;
  }

  /**
   * Find staff by department
   * @param {string} departmentId - Department ID
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated staff
   */
  static async findByDepartment(departmentId, filters = {}, page = 1, limit = 20, populate = false) {
    const combinedFilters = { department: departmentId, ...filters };
    return this.findAll(combinedFilters, page, limit, populate);
  }

  /**
   * Find staff by status
   * @param {string} status - Status
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated staff
   */
  static async findByStatus(status, filters = {}, page = 1, limit = 20, populate = false) {
    const combinedFilters = { status, ...filters };
    return this.findAll(combinedFilters, page, limit, populate);
  }

  /**
   * Search staff by name
   * @param {string} name - Name to search
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated staff
   */
  static async searchByName(name, filters = {}, page = 1, limit = 20, populate = false) {
    const regex = new RegExp(name, 'i');
    const combinedFilters = {
      $or: [
        { firstName: regex },
        { lastName: regex }
      ],
      ...filters
    };
    return this.findAll(combinedFilters, page, limit, populate);
  }

  /**
   * Create a new staff
   * @param {Object} data - Staff data
   * @returns {Promise<Object>} - Created staff
   */
  static async create(data) {
    const staff = await Staff.create(data);
    return staff;
  }

  /**
   * Update a staff
   * @param {string} id - Staff ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated staff
   * @throws {AppError} - If staff not found
   */
  static async update(id, data) {
    const staff = await Staff.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!staff) {
      throw new AppError('Staff not found', 404);
    }
    
    return staff;
  }

  /**
   * Delete a staff
   * @param {string} id - Staff ID
   * @returns {Promise<Object>} - Deleted staff
   * @throws {AppError} - If staff not found
   */
  static async delete(id) {
    const staff = await Staff.findByIdAndDelete(id);
    
    if (!staff) {
      throw new AppError('Staff not found', 404);
    }
    
    return staff;
  }
}
