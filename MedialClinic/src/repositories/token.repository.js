import jwt from 'jsonwebtoken';
import AppError from '../../utils/appError.js';

/**
 * Token Repository - Handles all token-related operations
 */
export class TokenRepository {
  /**
   * Generate a JWT token
   * @param {Object} payload - Token payload
   * @param {string} secret - Secret key
   * @param {string|Object} options - Token options or expiration time
   * @returns {string} - JWT token
   */
  static generateToken(payload, secret = process.env.JWT_SECRET, options = {}) {
    // If options is a string, treat it as expiresIn
    const tokenOptions = typeof options === 'string' 
      ? { expiresIn: options } 
      : options;
      
    return jwt.sign(payload, secret, tokenOptions);
  }
  
  /**
   * Verify a JWT token
   * @param {string} token - JWT token
   * @param {string} secret - Secret key
   * @returns {Object} - Decoded token
   * @throws {AppError} - If token is invalid or expired
   */
  static verifyToken(token, secret = process.env.JWT_SECRET) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
  
  /**
   * Generate auth token for user authentication
   * @param {string} userId - User ID
   * @returns {string} - JWT token
   */
  static generateAuthToken(userId) {
    return this.generateToken(
      { id: userId },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES_IN
    );
  }
  
  /**
   * Generate action token (approval/rejection)
   * @param {string} userId - User ID
   * @param {string} action - Action to perform
   * @returns {string} - JWT token
   */
  static generateActionToken(userId, action) {
    return this.generateToken(
      { userId, action },
      process.env.JWT_SECRET,
      '7d'
    );
  }
}
