import LeaveBalance from '../models/leaveBalance.js';
import LeaveType from '../models/leaveType.js';
import AppError from '../../utils/appError.js';

/**
 * Leave Balance Repository - Handles data access for leave balances
 */
export class LeaveBalanceRepository {
  /**
   * Find leave balance by entity type, entity ID, and year
   * @param {string} entityType - Entity type ('staff', 'doctor', or 'user')
   * @param {string} entityId - Entity ID
   * @param {number} year - Year
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Leave balance
   */
  static async findByEntityAndYear(entityType, entityId, year, populate = false) {
    const query = { year };
    query[`${entityType}Id`] = entityId;
    
    let dbQuery = LeaveBalance.findOne(query);
    
    if (populate) {
      dbQuery = dbQuery.populate('balances.leaveTypeId');
    }
    
    const leaveBalance = await dbQuery.exec();
    return leaveBalance;
  }
  
  /**
   * Find leave balance by user ID and year (legacy method)
   * @param {string} userId - User ID
   * @param {number} year - Year
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Leave balance
   */
  static async findByUserAndYear(userId, year, populate = false) {
    return this.findByEntityAndYear('user', userId, year, populate);
  }
  /**
   * Find all leave balances for an entity
   * @param {string} entityType - Entity type ('staff', 'doctor', or 'user')
   * @param {string} entityId - Entity ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of leave balances
   */
  static async findByEntity(entityType, entityId, populate = false) {
    const query = {};
    query[`${entityType}Id`] = entityId;
    
    let dbQuery = LeaveBalance.find(query).sort({ year: -1 });
    
    if (populate) {
      dbQuery = dbQuery.populate('balances.leaveTypeId');
    }
    
    const leaveBalances = await dbQuery.exec();
    return leaveBalances;
  }

  /**
   * Find all leave balances for a user (legacy method)
   * @param {string} userId - User ID
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Array>} - Array of leave balances
   */
  static async findByUser(userId, populate = false) {
    return this.findByEntity('user', userId, populate);
  }

  /**
   * Create a new leave balance
   * @param {Object} data - Leave balance data
   * @returns {Promise<Object>} - Created leave balance
   */
  static async create(data) {
    const leaveBalance = await LeaveBalance.create(data);
    return leaveBalance;
  }

  /**
   * Update leave balance
   * @param {string} id - Leave balance ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - Updated leave balance
   * @throws {AppError} - If leave balance not found
   */
  static async update(id, data) {
    const leaveBalance = await LeaveBalance.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!leaveBalance) {
      throw new AppError('Leave balance not found', 404);
    }
    
    return leaveBalance;
  }
  /**
   * Initialize leave balance for an entity and year
   * @param {string} entityType - Entity type ('staff', 'doctor', or 'user')
   * @param {string} entityId - Entity ID
   * @param {number} year - Year
   * @returns {Promise<Object>} - Created leave balance
   */
  static async initialize(entityType, entityId, year) {
    // Check if a balance already exists for this entity and year
    const query = { year };
    query[`${entityType}Id`] = entityId;
    
    const existingBalance = await LeaveBalance.findOne(query);
    
    if (existingBalance) {
      return existingBalance;
    }
    
    // Get all active leave types
    const leaveTypes = await LeaveType.find({ active: true });
    
    // Create balance entries for each leave type
    const balances = leaveTypes.map(leaveType => ({
      leaveTypeId: leaveType._id,
      allocated: leaveType.defaultDays,
      used: 0,
      pending: 0,
      carryForward: 0
    }));
    
    // Create new leave balance data
    const leaveBalanceData = {
      year,
      balances
    };
    
    // Add the appropriate entity ID
    leaveBalanceData[`${entityType}Id`] = entityId;
    
    // Create new leave balance
    const leaveBalance = await LeaveBalance.create(leaveBalanceData);
    
    return leaveBalance;
  }
  /**
   * Update leave balance for a specific leave type
   * @param {string} entityType - Entity type ('staff', 'doctor', or 'user')
   * @param {string} entityId - Entity ID
   * @param {number} year - Year
   * @param {string} leaveTypeId - Leave type ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated leave balance
   */
  static async updateLeaveTypeBalance(entityType, entityId, year, leaveTypeId, updates) {
    // Find the leave balance document
    const query = { year };
    query[`${entityType}Id`] = entityId;
    
    const leaveBalance = await LeaveBalance.findOne(query);
    
    if (!leaveBalance) {
      throw new AppError('Leave balance not found', 404);
    }
    
    // Find the specific leave type balance
    const leaveTypeBalance = leaveBalance.balances.find(
      balance => balance.leaveTypeId.toString() === leaveTypeId.toString()
    );
    
    if (!leaveTypeBalance) {
      throw new AppError('Leave type balance not found', 404);
    }
    
    // Update the fields
    Object.keys(updates).forEach(key => {
      if (leaveTypeBalance[key] !== undefined) {
        leaveTypeBalance[key] = updates[key];
      }
    });
    
    // Save the updated document
    await leaveBalance.save();
    
    return leaveBalance;
  }
}
