import { LeaveRequestRepository } from '../repositories/leaveRequest.repository.js';
import { LeaveBalanceRepository } from '../repositories/leaveBalance.repository.js';
import { LeaveTypeRepository } from '../repositories/leaveType.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { EmailRepository } from '../repositories/emailRepository.js';
import { sendEmail } from '../../utils/mailer.js';
import { EMAIL_TEMPLATES } from '../../utils/constants.js';
import AppError from '../../utils/appError.js';
import mongoose from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @param {string} entityName - Name of the entity for error messages
 * @throws {AppError} - If ID is invalid
 */
const validateObjectId = (id, entityName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${entityName} ID format`, 400);
  }
};

/**
 * Leave Request Service - Handles business logic for leave requests
 */
export class LeaveRequestService {
  /**
   * Get all leave requests with pagination
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @param {boolean} populate - Whether to populate references
   * @returns {Promise<Object>} - Paginated leave requests
   */
  static async getAllLeaveRequests(filters = {}, page = 1, limit = 20, populate = true) {
    return LeaveRequestRepository.findAll(filters, page, limit, populate);
  }

  /**
   * Get leave request by ID
   * @param {string} id - Leave request ID
   * @returns {Promise<Object>} - Leave request
   */  static async getLeaveRequestById(id) {
    validateObjectId(id, 'leave request');
    return LeaveRequestRepository.findById(id, true);
  }

  /**
   * Get leave requests for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated leave requests
   */
  static async getUserLeaveRequests(userId, filters = {}, page = 1, limit = 20) {
    // Validate ObjectId
    validateObjectId(userId, 'user');
    
    // Verify user exists
    await UserRepository.findById(userId);
    
    return LeaveRequestRepository.findByUser(userId, filters, page, limit, true);
  }

  /**
   * Get leave requests for any entity type (staff, doctor, user)
   * @param {string} entityType - Entity type ('staff', 'doctor', or 'user')
   * @param {string} entityId - Entity ID
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated leave requests
   */
  static async getEntityLeaveRequests(entityType, entityId, filters = {}, page = 1, limit = 20) {
    // Validate ObjectId
    validateObjectId(entityId, entityType);
    
    // Verify entity exists based on type
    if (entityType === 'staff') {
      await import('../repositories/staff.repository.js')
        .then(module => module.StaffRepository.findById(entityId));
    } else if (entityType === 'doctor') {
      await import('../repositories/doctor.repository.js')
        .then(module => module.DoctorRepository.findById(entityId));
    } else if (entityType === 'user') {
      await UserRepository.findById(entityId);
    } else {
      throw new AppError(`Invalid entity type: ${entityType}`, 400);
    }
    
    return LeaveRequestRepository.findByEntity(entityType, entityId, filters, page, limit, true);
  }

  /**
   * Create a new leave request
   * @param {string} requestedById - ID of the user who is requesting the leave
   * @param {Object} requestData - Leave request data containing staffId, doctorId, or userId
   * @returns {Promise<Object>} - Created leave request
   */
  static async createLeaveRequest(requestedById, requestData) {
    // Validate ObjectIds
    validateObjectId(requestedById, 'requesting user');
    validateObjectId(requestData.leaveTypeId, 'leave type');
    
    // Check if at least one of staffId, doctorId or userId is provided
    if (!requestData.staffId && !requestData.doctorId && !requestData.userId) {
      throw new AppError('At least one of staffId, doctorId, or userId must be provided', 400);
    }
    
    // Validate IDs if provided
    if (requestData.staffId) validateObjectId(requestData.staffId, 'staff');
    if (requestData.doctorId) validateObjectId(requestData.doctorId, 'doctor');
    if (requestData.userId) validateObjectId(requestData.userId, 'user');
    
    // Verify requesting user exists
    const requestingUser = await UserRepository.findById(requestedById);
    
    // Verify leave type exists
    const leaveType = await LeaveTypeRepository.findById(requestData.leaveTypeId);
      // Convert date strings to Date objects
    const startDate = new Date(requestData.startDate);
    const endDate = new Date(requestData.endDate);
    
    // Validate dates
    if (endDate < startDate) {
      throw new AppError('End date must be after or equal to start date', 400);
    }
    
    // Calculate number of days
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end date
    
    // Determine which entity is applying for leave (staff, doctor, or user)
    let entityId;
    let entityType;
    
    if (requestData.staffId) {
      entityId = requestData.staffId;
      entityType = 'staff';
    } else if (requestData.doctorId) {
      entityId = requestData.doctorId;
      entityType = 'doctor';
    } else {
      entityId = requestData.userId;
      entityType = 'user';
    }
    
    // Check for overlapping leave requests for the entity
    const overlappingFilter = {};
    overlappingFilter[`${entityType}Id`] = entityId;
    
    const overlapping = await LeaveRequestRepository.findOverlapping(
      overlappingFilter,
      startDate, 
      endDate
    );
    
    if (overlapping.length > 0) {
      throw new AppError('There is already an overlapping leave request for this period', 400);
    }
    
    // Get leave balance for current year
    const year = startDate.getFullYear();
    let leaveBalance = await LeaveBalanceRepository.findByEntityAndYear(entityType, entityId, year);
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalanceRepository.initialize(entityType, entityId, year);
    }
      // Find the specific leave type balance
    const leaveTypeBalance = leaveBalance.balances.find(
      balance => balance.leaveTypeId.toString() === leaveType._id.toString()
    );
    
    if (!leaveTypeBalance) {
      throw new AppError('Leave type balance not found', 404);
    }
    
    // Check if entity has enough leave balance
    const availableBalance = leaveTypeBalance.allocated + leaveTypeBalance.carryForward - 
                            leaveTypeBalance.used - leaveTypeBalance.pending;
    
    if (diffDays > availableBalance) {
      throw new AppError(`Insufficient leave balance. Available: ${availableBalance}, Requested: ${diffDays}`, 400);
    }
    
    // Create leave request data
    const leaveRequestData = {
      leaveTypeId: leaveType._id,
      requestedBy: requestedById,
      startDate,
      endDate,
      reason: requestData.reason,
      status: 'pending',
      attachments: requestData.attachments || []
    };
    
    // Add the appropriate entity ID
    if (entityType === 'staff') {
      leaveRequestData.staffId = entityId;
    } else if (entityType === 'doctor') {
      leaveRequestData.doctorId = entityId;
    } else {
      leaveRequestData.userId = entityId;
    }
    
    // Create leave request
    const leaveRequest = await LeaveRequestRepository.create(leaveRequestData);
    
    // Update pending balance
    await LeaveBalanceRepository.updateLeaveTypeBalance(entityType, entityId, year, leaveType._id, {
      pending: leaveTypeBalance.pending + diffDays
    });
    
    // Send notification email to admin
    await this.sendLeaveRequestNotification(leaveRequest, requestingUser, leaveType, entityType, entityId);
    
    return LeaveRequestRepository.findById(leaveRequest._id, true);
  }

  /**
   * Update a leave request
   * @param {string} id - Leave request ID
   * @param {string} requestedById - User ID of the person making the update (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated leave request
   */  
  static async updateLeaveRequest(id, requestedById, updateData) {
    // Validate ObjectIds
    validateObjectId(id, 'leave request');
    validateObjectId(requestedById, 'user');
    if (updateData.leaveTypeId) {
      validateObjectId(updateData.leaveTypeId, 'leave type');
    }
    
    // Get existing leave request
    const leaveRequest = await LeaveRequestRepository.findById(id);
    
    // Check if user is authorized to update this request
    // User must either be the one who requested the leave or the one who created the request
    const isRequestCreator = leaveRequest.requestedBy && 
                            leaveRequest.requestedBy.toString() === requestedById.toString();
    const isEntityUser = leaveRequest.userId && 
                        leaveRequest.userId.toString() === requestedById.toString();
                        
    if (!isRequestCreator && !isEntityUser) {
      throw new AppError('You are not authorized to update this leave request', 403);
    }
    
    // Check if request can be updated (only pending requests can be updated)
    if (leaveRequest.status !== 'pending') {
      throw new AppError(`Cannot update a ${leaveRequest.status} leave request`, 400);
    }
    
    // Prepare update data
    const updatedFields = {};
    
    if (updateData.reason) {
      updatedFields.reason = updateData.reason;
    }
    
    if (updateData.attachments) {
      updatedFields.attachments = updateData.attachments;
    }
    
    // Check if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : leaveRequest.startDate;
      const endDate = updateData.endDate ? new Date(updateData.endDate) : leaveRequest.endDate;
      
      // Validate dates
      if (endDate < startDate) {
        throw new AppError('End date must be after or equal to start date', 400);
      }
      
      // Calculate original and new number of days
      const originalDays = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
      const newDays = this.calculateLeaveDays(startDate, endDate);
      
      // Determine which entity is on leave (staff, doctor, or user)
      let entityId;
      let entityType;
      
      if (leaveRequest.staffId) {
        entityId = leaveRequest.staffId;
        entityType = 'staff';
      } else if (leaveRequest.doctorId) {
        entityId = leaveRequest.doctorId;
        entityType = 'doctor';
      } else {
        entityId = leaveRequest.userId;
        entityType = 'user';
      }
      
      // Create entity filter for overlapping check
      const entityFilter = {};
      entityFilter[`${entityType}Id`] = entityId;
      
      // Check for overlapping leave requests (excluding this one)
      const overlapping = await LeaveRequestRepository.findOverlapping(
        entityFilter,
        startDate, 
        endDate, 
        id
      );
      
      if (overlapping.length > 0) {
        throw new AppError('There is already an overlapping leave request for this period', 400);
      }
      
      // Get leave balance for current year
      const year = startDate.getFullYear();
      let leaveBalance = await LeaveBalanceRepository.findByEntityAndYear(entityType, entityId, year);
      
      if (!leaveBalance) {
        leaveBalance = await LeaveBalanceRepository.initialize(entityType, entityId, year);
      }
      
      // Find the specific leave type balance
      const leaveTypeBalance = leaveBalance.balances.find(
        balance => balance.leaveTypeId.toString() === leaveRequest.leaveTypeId.toString()
      );
      
      if (!leaveTypeBalance) {
        throw new AppError('Leave type balance not found', 404);
      }
      
      // Check if entity has enough leave balance
      const availableBalance = leaveTypeBalance.allocated + leaveTypeBalance.carryForward - 
                              leaveTypeBalance.used - leaveTypeBalance.pending + originalDays;
      
      if (newDays > availableBalance) {
        throw new AppError(`Insufficient leave balance. Available: ${availableBalance}, Requested: ${newDays}`, 400);
      }
      
      // Update pending balance
      await LeaveBalanceRepository.updateLeaveTypeBalance(
        entityType, 
        entityId, 
        year, 
        leaveRequest.leaveTypeId, 
        {
          pending: leaveTypeBalance.pending - originalDays + newDays
        }
      );
      
      // Add dates to update data
      updatedFields.startDate = startDate;
      updatedFields.endDate = endDate;
    }
    
    // Update leave request
    const updatedRequest = await LeaveRequestRepository.update(id, updatedFields);
    
    return LeaveRequestRepository.findById(updatedRequest._id, true);
  }

  /**
   * Cancel a leave request
   * @param {string} id - Leave request ID
   * @param {string} requestedById - User ID of the person cancelling the request (for authorization)
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancelled leave request
   */  
  static async cancelLeaveRequest(id, requestedById, reason) {
    // Validate ObjectIds
    validateObjectId(id, 'leave request');
    validateObjectId(requestedById, 'user');
    
    // Get existing leave request
    const leaveRequest = await LeaveRequestRepository.findById(id);
    
    // Check if user is authorized to cancel this request
    // User must either be the one who requested the leave or the one who created the request
    const isRequestCreator = leaveRequest.requestedBy && 
                            leaveRequest.requestedBy.toString() === requestedById.toString();
    const isEntityUser = leaveRequest.userId && 
                        leaveRequest.userId.toString() === requestedById.toString();
                        
    if (!isRequestCreator && !isEntityUser) {
      throw new AppError('You are not authorized to cancel this leave request', 403);
    }
    
    // Check if request can be cancelled (only pending or approved requests can be cancelled)
    if (leaveRequest.status !== 'pending' && leaveRequest.status !== 'approved') {
      throw new AppError(`Cannot cancel a ${leaveRequest.status} leave request`, 400);
    }
    
    // Determine which entity is on leave (staff, doctor, or user)
    let entityId;
    let entityType;
    
    if (leaveRequest.staffId) {
      entityId = leaveRequest.staffId;
      entityType = 'staff';
    } else if (leaveRequest.doctorId) {
      entityId = leaveRequest.doctorId;
      entityType = 'doctor';
    } else {
      entityId = leaveRequest.userId;
      entityType = 'user';
    }
    
    // Calculate number of days
    const days = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    
    // Get leave balance for the year of the request
    const year = leaveRequest.startDate.getFullYear();
    const leaveBalance = await LeaveBalanceRepository.findByEntityAndYear(entityType, entityId, year);
    
    if (!leaveBalance) {
      throw new AppError('Leave balance not found', 404);
    }
    
    // Find the specific leave type balance
    const leaveTypeBalance = leaveBalance.balances.find(
      balance => balance.leaveTypeId.toString() === leaveRequest.leaveTypeId.toString()
    );
    
    if (!leaveTypeBalance) {
      throw new AppError('Leave type balance not found', 404);
    }
    
    // Update leave balance based on current status
    if (leaveRequest.status === 'pending') {
      // Reduce pending days
      await LeaveBalanceRepository.updateLeaveTypeBalance(entityType, entityId, year, leaveRequest.leaveTypeId, {
        pending: Math.max(0, leaveTypeBalance.pending - days)
      });
    } else if (leaveRequest.status === 'approved') {
      // Reduce used days
      await LeaveBalanceRepository.updateLeaveTypeBalance(entityType, entityId, year, leaveRequest.leaveTypeId, {
        used: Math.max(0, leaveTypeBalance.used - days)
      });
    }
    
    // Update leave request status to cancelled
    const cancelledRequest = await LeaveRequestRepository.update(id, {
      status: 'cancelled',
      reviewedBy: requestedById,
      reviewDate: new Date(),
      reviewNotes: reason || 'Cancelled by employee'
    });
    
    return LeaveRequestRepository.findById(cancelledRequest._id, true);
  }

  /**
   * Approve a leave request
   * @param {string} id - Leave request ID
   * @param {string} adminId - Admin ID (for authorization)
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>} - Approved leave request
   */  
  static async approveLeaveRequest(id, adminId, notes = '') {
    // Validate ObjectIds
    validateObjectId(id, 'leave request');
    validateObjectId(adminId, 'admin');
    
    // Get existing leave request
    const leaveRequest = await LeaveRequestRepository.findById(id, true);
    
    // Check if request can be approved (only pending requests can be approved)
    if (leaveRequest.status !== 'pending') {
      throw new AppError(`Cannot approve a ${leaveRequest.status} leave request`, 400);
    }
    
    // Calculate number of days
    const days = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    
    // Determine which entity is on leave (staff, doctor, or user)
    let entityId;
    let entityType;
    let entityDetails;
    
    if (leaveRequest.staffId) {
      entityId = leaveRequest.staffId._id || leaveRequest.staffId;
      entityType = 'staff';
      entityDetails = leaveRequest.staffId;
    } else if (leaveRequest.doctorId) {
      entityId = leaveRequest.doctorId._id || leaveRequest.doctorId;
      entityType = 'doctor';
      entityDetails = leaveRequest.doctorId;
    } else {
      entityId = leaveRequest.userId._id || leaveRequest.userId;
      entityType = 'user';
      entityDetails = leaveRequest.userId;
    }
    
    // Get leave balance for the year of the request
    const year = leaveRequest.startDate.getFullYear();
    const leaveBalance = await LeaveBalanceRepository.findByEntityAndYear(entityType, entityId, year);
    
    if (!leaveBalance) {
      throw new AppError('Leave balance not found', 404);
    }
    
    // Find the specific leave type balance
    const leaveTypeBalance = leaveBalance.balances.find(
      balance => balance.leaveTypeId.toString() === leaveRequest.leaveTypeId._id.toString()
    );
    
    if (!leaveTypeBalance) {
      throw new AppError('Leave type balance not found', 404);
    }
    
    // Update leave balance (reduce pending, increase used)
    await LeaveBalanceRepository.updateLeaveTypeBalance(
      entityType,
      entityId,
      year,
      leaveRequest.leaveTypeId._id,
      {
        pending: Math.max(0, leaveTypeBalance.pending - days),
        used: leaveTypeBalance.used + days
      }
    );
    
    // Update leave request status to approved
    const approvedRequest = await LeaveRequestRepository.update(id, {
      status: 'approved',
      reviewedBy: adminId,
      reviewDate: new Date(),
      reviewNotes: notes
    });
    
    // Get admin details for notification
    const admin = await UserRepository.findById(adminId);
    
    // Send approval notification email to employee
    await this.sendLeaveApprovalNotification(approvedRequest, entityDetails, admin);
    
    return LeaveRequestRepository.findById(approvedRequest._id, true);
  }

  /**
   * Reject a leave request
   * @param {string} id - Leave request ID
   * @param {string} adminId - Admin ID (for authorization)
   * @param {string} notes - Rejection notes
   * @returns {Promise<Object>} - Rejected leave request
   */  
  static async rejectLeaveRequest(id, adminId, notes = '') {
    // Validate ObjectIds
    validateObjectId(id, 'leave request');
    validateObjectId(adminId, 'admin');
    
    // Get existing leave request
    const leaveRequest = await LeaveRequestRepository.findById(id, true);
    
    // Check if request can be rejected (only pending requests can be rejected)
    if (leaveRequest.status !== 'pending') {
      throw new AppError(`Cannot reject a ${leaveRequest.status} leave request`, 400);
    }
    
    // Calculate number of days
    const days = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    
    // Determine which entity is on leave (staff, doctor, or user)
    let entityId;
    let entityType;
    let entityDetails;
    
    if (leaveRequest.staffId) {
      entityId = leaveRequest.staffId._id || leaveRequest.staffId;
      entityType = 'staff';
      entityDetails = leaveRequest.staffId;
    } else if (leaveRequest.doctorId) {
      entityId = leaveRequest.doctorId._id || leaveRequest.doctorId;
      entityType = 'doctor';
      entityDetails = leaveRequest.doctorId;
    } else {
      entityId = leaveRequest.userId._id || leaveRequest.userId;
      entityType = 'user';
      entityDetails = leaveRequest.userId;
    }
    
    // Get leave balance for the year of the request
    const year = leaveRequest.startDate.getFullYear();
    const leaveBalance = await LeaveBalanceRepository.findByEntityAndYear(entityType, entityId, year);
    
    if (!leaveBalance) {
      throw new AppError('Leave balance not found', 404);
    }
    
    // Find the specific leave type balance
    const leaveTypeBalance = leaveBalance.balances.find(
      balance => balance.leaveTypeId.toString() === leaveRequest.leaveTypeId._id.toString()
    );
    
    if (!leaveTypeBalance) {
      throw new AppError('Leave type balance not found', 404);
    }
    
    // Update leave balance (reduce pending)
    await LeaveBalanceRepository.updateLeaveTypeBalance(
      entityType,
      entityId,
      year,
      leaveRequest.leaveTypeId._id,
      {
        pending: Math.max(0, leaveTypeBalance.pending - days)
      }
    );
    
    // Update leave request status to rejected
    const rejectedRequest = await LeaveRequestRepository.update(id, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewDate: new Date(),
      reviewNotes: notes
    });
    
    // Get admin details for notification
    const admin = await UserRepository.findById(adminId);
    
    // Send rejection notification email to employee
    await this.sendLeaveRejectionNotification(rejectedRequest, entityDetails, admin);
    
    return LeaveRequestRepository.findById(rejectedRequest._id, true);
  }

  /**
   * Calculate number of days between two dates (inclusive)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} - Number of days
   */
  static calculateLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end date
    return diffDays;
  }

  /**
   * Send leave request notification email to admin
   * @param {Object} leaveRequest - Leave request
   * @param {Object} requestingUser - User who requested the leave
   * @param {Object} leaveType - Leave type
   * @param {string} entityType - Type of entity (staff, doctor, user)
   * @param {string} entityId - ID of the entity
   */
  static async sendLeaveRequestNotification(leaveRequest, requestingUser, leaveType, entityType, entityId) {
    try {
      // Get admin emails
      const adminEmails = await EmailRepository.getAdminEmails();
      
      if (!adminEmails || adminEmails.length === 0) {
        console.warn('No admin emails found to send leave request notification');
        return;
      }
      
      // Get email template
      const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.LEAVE_REQUEST_NOTIFICATION);
      
      if (!template) {
        console.warn('Leave request notification email template not found');
        return;
      }
      
      // Format dates
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString();
      
      // Calculate days
      const days = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
      
      // Get entity details
      let entityName = '';
      let entityEmail = '';
      let entityRole = '';
      
      if (entityType === 'staff') {
        // Get staff details
        const staff = await import('../repositories/staff.repository.js')
          .then(module => module.StaffRepository.findById(entityId));
          
        entityName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
        entityEmail = staff.email;
        entityRole = staff.designation;
      } else if (entityType === 'doctor') {
        // Get doctor details
        const doctor = await import('../repositories/doctor.repository.js')
          .then(module => module.DoctorRepository.findById(entityId));
          
        entityName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
        entityEmail = doctor.email;
        entityRole = 'Doctor';
      } else {
        // Use user details
        const user = await UserRepository.findById(entityId);
        entityName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        entityEmail = user.email;
        entityRole = user.role;
      }
      
      // Prepare dynamic data
      const dynamicData = {
        username: requestingUser.username,
        requestorName: `${requestingUser.firstName || ''} ${requestingUser.lastName || ''}`.trim() || requestingUser.username,
        requestorEmail: requestingUser.email,
        requestorRole: requestingUser.role,
        entityType: entityType.charAt(0).toUpperCase() + entityType.slice(1),
        entityName,
        entityEmail,
        entityRole,
        leaveType: leaveType.name,
        startDate,
        endDate,
        days,
        reason: leaveRequest.reason,
        date: new Date().toLocaleDateString()
      };
      
      // Process template
      const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
      
      // Send email
      await sendEmail({
        to: adminEmails,
        subject: template.subject,
        html: processedContent
      });
      
      console.log(`Leave request notification email sent to ${adminEmails.length} admin(s)`);
    } catch (error) {
      console.error('Error sending leave request notification email:', error);
      // Continue without sending email
    }
  }

  /**
   * Send leave approval notification email to employee
   * @param {Object} leaveRequest - Leave request
   * @param {Object} entity - Entity that requested leave (staff, doctor, or user)
   * @param {Object} admin - Admin who approved the request
   */
  static async sendLeaveApprovalNotification(leaveRequest, entity, admin) {
    try {
      // Get email template
      const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.LEAVE_APPROVED);
      
      if (!template) {
        console.warn('Leave approval notification email template not found');
        return;
      }
      
      // Format dates
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString();
      const reviewDate = new Date(leaveRequest.reviewDate).toLocaleDateString();
      
      // Calculate days
      const days = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
      
      // Get entity details
      let entityName = '';
      let entityEmail = '';
      
      if (entity) {
        entityName = `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.username || 'Employee';
        entityEmail = entity.email;
      } else {
        console.warn('Entity details missing for leave approval notification');
        return;
      }
      
      // Prepare dynamic data
      const dynamicData = {
        entityName,
        adminName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.username,
        startDate,
        endDate,
        days,
        reviewDate,
        reviewNotes: leaveRequest.reviewNotes || 'No notes provided',
        date: new Date().toLocaleDateString()
      };
      
      // Process template
      const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
      
      // Send email
      await sendEmail({
        to: entityEmail,
        subject: template.subject,
        html: processedContent
      });
      
      console.log(`Leave approval notification email sent to: ${entityEmail}`);
    } catch (error) {
      console.error('Error sending leave approval notification email:', error);
      // Continue without sending email
    }
  }

  /**
   * Send leave rejection notification email to employee
   * @param {Object} leaveRequest - Leave request
   * @param {Object} entity - Entity that requested leave (staff, doctor, or user)
   * @param {Object} admin - Admin who rejected the request
   */
  static async sendLeaveRejectionNotification(leaveRequest, entity, admin) {
    try {
      // Get email template
      const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.LEAVE_REJECTED);
      
      if (!template) {
        console.warn('Leave rejection notification email template not found');
        return;
      }
      
      // Format dates
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString();
      const reviewDate = new Date(leaveRequest.reviewDate).toLocaleDateString();
      
      // Calculate days
      const days = this.calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
      
      // Get entity details
      let entityName = '';
      let entityEmail = '';
      
      if (entity) {
        entityName = `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.username || 'Employee';
        entityEmail = entity.email;
      } else {
        console.warn('Entity details missing for leave rejection notification');
        return;
      }
      
      // Prepare dynamic data
      const dynamicData = {
        entityName,
        adminName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.username,
        startDate,
        endDate,
        days,
        reviewDate,
        reviewNotes: leaveRequest.reviewNotes || 'No notes provided',
        date: new Date().toLocaleDateString()
      };
      
      // Process template
      const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
      
      // Send email
      await sendEmail({
        to: entityEmail,
        subject: template.subject,
        html: processedContent
      });
      
      console.log(`Leave rejection notification email sent to: ${entityEmail}`);
    } catch (error) {
      console.error('Error sending leave rejection notification email:', error);
      // Continue without sending email
    }
  }
}
