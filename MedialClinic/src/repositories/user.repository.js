import User from '../models/user.js';
import AppError from '../../utils/appError.js';
import { USER_STATUS } from '../../utils/constants.js';

/**
 * User Repository - Handles data access for users
 */
export class UserRepository {
  /**
   * Find a user by ID
   * @param {string} userId - User ID
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object>} - User or null if not found
   */
  static async findById(userId, includePassword = false) {
    const query = User.findById(userId);
    
    if (includePassword) {
      query.select('+password');
    }
    
    const user = await query;
    return user;
  }
  
  /**
   * Find a user by email
   * @param {string} email - Email to search for
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object>} - User or null if not found
   */
  static async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    
    if (includePassword) {
      query.select('+password');
    }
    
    const user = await query;
    return user;
  }
  
  /**
   * Find a user by username
   * @param {string} username - Username to search for
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object>} - User or null if not found
   */
  static async findByUsername(username, includePassword = false) {
    const query = User.findOne({ username: username.toLowerCase() });
    
    if (includePassword) {
      query.select('+password');
    }
    
    const user = await query;
    return user;
  }
  
  /**
   * Check if user exists with the given username or email
   * @param {string} username - Username to check
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - Whether a user exists
   */
  static async exists(username, email) {
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    return !!user;
  }
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async create(userData) {
    const user = await User.create(userData);
    return user;
  }
  
  /**
   * Update a user by ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user
   * @throws {AppError} - If user not found
   */
  static async update(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user;
  }
  
  /**
   * Update user status
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated user
   */
  static async updateStatus(userId, status) {
    return this.update(userId, { status });
  }
  
  /**
   * Delete a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If user not found
   */
  static async delete(userId) {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    await User.findByIdAndDelete(userId);
    
    // Return user data for consistency
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: 'deleted',
      active: false,
      createdAt: user.createdAt,
      updatedAt: new Date()
    };
  }
  
  /**
   * Find user by email or username
   * @param {string} identifier - Email or username
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object>} - User or null if not found
   */
  static async findByEmailOrUsername(identifier, includePassword = false) {
    // Check if the identifier is an email
    if (identifier.includes('@')) {
      return this.findByEmail(identifier, includePassword);
    } else {
      return this.findByUsername(identifier, includePassword);
    }
  }
}
