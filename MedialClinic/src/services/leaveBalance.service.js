import { LeaveBalanceRepository } from '../repositories/leaveBalance.repository.js';
import { LeaveTypeRepository } from '../repositories/leaveType.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import AppError from '../../utils/appError.js';

/**
 * Leave Balance Service - Handles business logic for leave balances
 */
export class LeaveBalanceService {
  /**
   * Get leave balance for a user and year
   * @param {string} userId - User ID
   * @param {number} year - Year
   * @returns {Promise<Object>} - Leave balance
   */
  static async getUserLeaveBalance(userId, year) {
    // Verify user exists
    await UserRepository.findById(userId);
    
    // Get or initialize leave balance
    let leaveBalance = await LeaveBalanceRepository.findByUserAndYear(userId, year, true);
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalanceRepository.initialize(userId, year);
      // Populate the leave type details after initialization
      leaveBalance = await LeaveBalanceRepository.findByUserAndYear(userId, year, true);
    }
    
    return leaveBalance;
  }

  /**
   * Get all leave balances for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of leave balances
   */
  static async getAllUserLeaveBalances(userId) {
    // Verify user exists
    await UserRepository.findById(userId);
    
    // Get leave balances
    return LeaveBalanceRepository.findByUser(userId, true);
  }

  /**
   * Update leave balance allocation for a user
   * @param {string} userId - User ID
   * @param {number} year - Year
   * @param {string} leaveTypeId - Leave type ID
   * @param {number} allocated - Allocated days
   * @returns {Promise<Object>} - Updated leave balance
   */
  static async updateLeaveAllocation(userId, year, leaveTypeId, allocated) {
    // Verify user exists
    await UserRepository.findById(userId);
    
    // Verify leave type exists
    await LeaveTypeRepository.findById(leaveTypeId);
    
    // Get or initialize leave balance
    let leaveBalance = await LeaveBalanceRepository.findByUserAndYear(userId, year);
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalanceRepository.initialize(userId, year);
    }
    
    // Update leave type allocation
    return LeaveBalanceRepository.updateLeaveTypeBalance(userId, year, leaveTypeId, { allocated });
  }

  /**
   * Update leave balance carry forward for a user
   * @param {string} userId - User ID
   * @param {number} year - Year
   * @param {string} leaveTypeId - Leave type ID
   * @param {number} carryForward - Carry forward days
   * @returns {Promise<Object>} - Updated leave balance
   */
  static async updateLeaveCarryForward(userId, year, leaveTypeId, carryForward) {
    // Verify user exists
    await UserRepository.findById(userId);
    
    // Verify leave type exists
    await LeaveTypeRepository.findById(leaveTypeId);
    
    // Get or initialize leave balance
    let leaveBalance = await LeaveBalanceRepository.findByUserAndYear(userId, year);
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalanceRepository.initialize(userId, year);
    }
    
    // Update leave type carry forward
    return LeaveBalanceRepository.updateLeaveTypeBalance(userId, year, leaveTypeId, { carryForward });
  }

  /**
   * Initialize leave balances for a new year
   * @param {number} year - Year
   * @returns {Promise<number>} - Number of balances initialized
   */
  static async initializeYearlyBalances(year) {
    // Get all active users
    const users = await UserRepository.findAll({ status: 'approved', active: true });
    
    // Initialize leave balances for each user
    let count = 0;
    for (const user of users) {
      await LeaveBalanceRepository.initialize(user._id, year);
      count++;
    }
    
    return count;
  }

  /**
   * Initialize leave balance for a specific user and year
   * @param {string} userId - User ID
   * @param {number} year - Year
   * @returns {Promise<Object>} - Initialized leave balance
   */
  static async initializeUserBalance(userId, year) {
    // Verify user exists
    await UserRepository.findById(userId);
    
    // Initialize leave balance
    return LeaveBalanceRepository.initialize(userId, year);
  }
}
