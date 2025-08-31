
import EmailTemplate from '../models/templates.js';
import User from '../models/user.js';
import { USER_ROLES } from '../../utils/constants.js';
import AppError from '../../utils/appError.js';

export class EmailRepository {
  /**
   * Get email template by template ID
   * @param {string} templateId - The ID of the email template
   * @returns {Promise<Object>} - Email template object
   */
  static async getEmailTemplate(templateId) {
    const template = await EmailTemplate.findOne({ 
      templateId, 
      active: true 
    });
    
    if (!template) {
      throw new AppError(`Email template with ID ${templateId} not found`, 404);
    }
    
    return template;
  }

  /**
   * Get all admin email addresses
   * @returns {Promise<Array<string>>} - Array of admin email addresses
   */
  static async getAdminEmails() {
    const adminUsers = await User.find({ 
      role: USER_ROLES.ADMIN,
      status: 'approved'
    }).select('email');
    
    return adminUsers.map(user => user.email);
  }

  /**
   * Process email template by replacing dynamic content
   * @param {string} content - Original email template content
   * @param {Object} dynamicData - Key-value pairs for replacement
   * @returns {string} - Processed email content
   */
  static processTemplate(content, dynamicData) {
    let processedContent = content;
    
    Object.entries(dynamicData).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(placeholder, value);
    });
    
    return processedContent;
  }
}
