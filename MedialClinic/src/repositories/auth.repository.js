import User from '../models/user.js';
import AppError from '../../utils/appError.js';
import jwt from 'jsonwebtoken';
import { USER_STATUS } from '../../utils/constants.js';
import { UserRepository } from './user.repository.js';

/**
 * Auth Repository - Handles authentication-specific operations
 */
export class AuthRepository {
  /**
   * Check if user exists with the given username or email
   * @param {string} userName - Username to check
   * @param {string} email - Email to check
   * @throws {AppError} - If user already exists
   */
  static async checkUserExists(userName, email) {
    const exists = await UserRepository.exists(userName, email);
    if (exists) {
      throw new AppError('User already exists with this username or email', 400);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async createUser(userData) {
    // Set default status to pending
    userData.status = USER_STATUS.PENDING;
    
    const user = await UserRepository.create(userData);
    return user;
  }
  /**
   * Approve user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated user
   */
  static async approveUser(userId) {
    const user = await UserRepository.update(userId, {
      status: USER_STATUS.APPROVED,
      active: true
    });
    
    return user;
  }
  
  /**
   * Check if a user already has a doctor profile
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if the user has a doctor profile, false otherwise
   */
  static async userHasDoctorProfile(userId) {
    try {
      // Import Doctor model dynamically to avoid circular dependency
      const Doctor = (await import('../models/doctor.js')).default;
      
      const doctorProfile = await Doctor.findOne({ userId });
      return !!doctorProfile; // Convert to boolean
    } catch (error) {
      console.error('Error checking if user has doctor profile:', error);
      return false;
    }
  }
  
  /**
   * Reject user by ID
   * @param {string} userId - User ID
   * @param {boolean} deleteUser - Whether to delete the user instead of marking as rejected
   * @returns {Promise<Object>} - Updated user or deletion result
   */
  static async rejectUser(userId, deleteUser = false) {
    // If deleteUser is true, delete the user from the database
    if (deleteUser) {
      return UserRepository.delete(userId);
    }
    
    // Otherwise just mark as rejected
    return UserRepository.updateStatus(userId, USER_STATUS.REJECTED);
  }

  /**
   * Generate token for user approval/rejection
   * @param {string} userId - User ID
   * @param {string} action - Action to perform (approve/reject)
   * @returns {string} - JWT token
   */
  static generateActionToken(userId, action) {
    return jwt.sign(
      { userId, action },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  /**
   * Verify action token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token
   */
  static verifyActionToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
  
  /**
   * Find user by email or username
   * @param {string} identifier - Email or username
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object>} - User or null if not found
   */
  static async findUserByEmailOrUsername(identifier, includePassword = false) {
    const user = await UserRepository.findByEmailOrUsername(identifier, includePassword);
    
    // Logging for debugging purposes
    console.log('Looking for user with identifier:', identifier);
    console.log('User found:', user ? 'Yes' : 'No');
    
    return user;
  }

  /**
   * Generate JWT token for user authentication
   * @param {string} userId - User ID
   * @returns {string} - JWT token
   */
  static generateAuthToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }
}