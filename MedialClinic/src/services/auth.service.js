import { sendEmail } from '../../utils/mailer.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { EmailRepository } from '../repositories/emailRepository.js';
import { EMAIL_TEMPLATES, FRONTEND_URLS, API_ROUTES, USER_STATUS } from '../../utils/constants.js';
import AppError from '../../utils/appError.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

export class AuthService {
    /**
     * Get users who are available to be assigned as doctors
     * This returns users who:
     * 1. Have a role that allows them to be a doctor (doctor, admin, manager)
     * 2. Don't already have a doctor profile
     * @returns {Promise<Array>} - Array of available users
     */
    static getAvailableDoctorUsers = async () => {
        try {
            // Get all users who are active and have eligible roles
            const eligibleUsers = await User.find({
                status: USER_STATUS.ACTIVE,
                role: { $in: ['doctor', 'admin', 'manager'] }
            }).select('firstName lastName email username _id');
            
            // Filter out users who already have a doctor profile
            const availableUsers = [];
            
            for (const user of eligibleUsers) {
                // Check if user already has a doctor profile
                const hasProfile = await AuthRepository.userHasDoctorProfile(user._id);
                
                if (!hasProfile) {
                    availableUsers.push({
                        id: user._id,
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email,
                        userName: user.username
                    });
                }
            }
            
            return availableUsers;
        } catch (error) {
            console.error('Error getting available doctor users:', error);
            throw new AppError('Failed to fetch available users', 500);
        }
    };
    
    /**
     * Sign up a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} - Created user
     */
    static signup = async ({
            firstName,
            lastName,
            userName,
            password,
            confirmPassword,
            role,
            email
    }) => {        // 1. Check if user already exists (If not send error response 400, user already exists {username and email must be unique})
        await AuthRepository.checkUserExists(userName, email);

        // 2. Create user in database
        const user = await AuthRepository.createUser({
            username: userName,
            email,
            password,
            confirmPassword,
            role
        });        // Store firstName and lastName temporarily for email
        user.tempFirstName = firstName;
        user.tempLastName = lastName;
        
        // 3. Send mail to admin for approval of the user from pending to approved or rejected
        try {
            // Get admin emails
            const adminEmails = await EmailRepository.getAdminEmails();
            
            if (!adminEmails || adminEmails.length === 0) {
                console.warn('No admin emails found to send approval request');
                // Delete the user since no admin will know about it
                await User.findByIdAndDelete(user._id);
                throw new AppError('No administrators available to process your registration. Please contact support.', 500);
            }            
            // Generate approval and rejection tokens
            const approveToken = AuthRepository.generateActionToken(user._id, 'approve');
            const rejectToken = AuthRepository.generateActionToken(user._id, 'reject');

            // Create approval and rejection URLs
            const approveUrl = `${FRONTEND_URLS.BASE_URL}${FRONTEND_URLS.APPROVAL_PAGE}?token=${approveToken}`;
            const rejectUrl = `${FRONTEND_URLS.BASE_URL}${FRONTEND_URLS.REJECTION_PAGE}?token=${rejectToken}`;
            
            try {
                // Get email template
                const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.USER_SIGNUP_PENDING_APPROVAL);
                  // Process template with dynamic data including user details
                const dynamicData = {
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    fullName: (user.tempFirstName && user.tempLastName) 
                        ? `${user.tempFirstName} ${user.tempLastName}`
                        : user.username,
                    approveUrl,
                    rejectUrl,
                    date: new Date().toLocaleDateString()
                };
                
                const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
                
                // Send email to all admins
                await sendEmail({
                    to: adminEmails,
                    subject: template.subject,
                    html: processedContent
                });
                
                console.log(`Approval email sent to ${adminEmails.length} admin(s)`);
            } catch (error) {
                // Delete the user since admin notification failed
                console.error('Error sending approval email:', error);
                await User.findByIdAndDelete(user._id);
                throw new AppError('Failed to notify administrators of your registration. Please try again later.', 500);
            }
        } catch (error) {
            console.error('Error in admin notification process:', error);
            
            // If this is not already a handled AppError, delete the user
            if (!error.statusCode) {
                try {
                    await User.findByIdAndDelete(user._id);
                } catch (deleteError) {
                    console.error('Error deleting user after email failure:', deleteError);
                }
                throw new AppError('Registration process failed. Please try again later.', 500);
            }
            
            // Re-throw the original error
            throw error;
        }
        return user;
    };    /**
     * Approve a user by ID (admin method)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Approved user
     */
    static approveUserById = async (userId) => {
        // 1) Find user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            throw new AppError('User not found', 404);
        }
        
        if (user.status !== USER_STATUS.PENDING) {
            throw new AppError(`User already ${user.status}`, 400);
        }
        
        // 2) Approve user
        const updatedUser = await AuthRepository.approveUser(userId);
        
        // 3) Send approval confirmation email to user
        try {
            const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.USER_APPROVED);
            
            const dynamicData = {
                username: updatedUser.username,
                loginUrl: `${FRONTEND_URLS.BASE_URL}${FRONTEND_URLS.LOGIN_PAGE}`,
                date: new Date().toLocaleDateString()
            };
            
            const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
            
            await sendEmail({
                to: updatedUser.email,
                subject: template.subject,
                html: processedContent
            });
            
            console.log(`Approval confirmation email sent to user: ${updatedUser.email}`);
        } catch (error) {
            console.error('Error sending approval confirmation email:', error);
            // Continue with approval even if email fails
        }
        
        return updatedUser;
    };    /**
     * Approve a user by token (email link method)
     * @param {string} token - Approval token
     * @returns {Promise<Object>} - Approved user
     */
    static approveUser = async (token) => {
        // Verify token
        const decoded = AuthRepository.verifyActionToken(token);
        
        if (decoded.action !== 'approve') {
            throw new AppError('Invalid token for this action', 400);
        }
        
        // Approve user
        const user = await AuthRepository.approveUser(decoded.userId);
        
        // Send approval confirmation email to user
        try {
            const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.USER_APPROVED);
            
            const dynamicData = {
                username: user.username,
                loginUrl: `${FRONTEND_URLS.BASE_URL}${FRONTEND_URLS.LOGIN_PAGE}`,
                date: new Date().toLocaleDateString()
            };
            
            const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
            
            await sendEmail({
                to: user.email,
                subject: template.subject,
                html: processedContent
            });
            
            console.log(`Approval confirmation email sent to user: ${user.email}`);
        } catch (error) {
            console.error('Error sending approval confirmation email:', error);
        }
        
        return user;
    };    /**
     * Reject a user by ID (admin method)
     * @param {string} userId - User ID
     * @param {boolean} deleteUser - Whether to delete the user instead of marking as rejected
     * @returns {Promise<Object>} - Rejected user
     */
    static rejectUserById = async (userId, deleteUser = false) => {
        // 1) Find user by ID (will be done in the repository if not deleting)
        if (!deleteUser) {
            const user = await User.findById(userId);
            
            if (!user) {
                throw new AppError('User not found', 404);
            }
            
            if (user.status !== USER_STATUS.PENDING) {
                throw new AppError(`User already ${user.status}`, 400);
            }
        }
          // 2) Reject or delete user
        const updatedUser = await AuthRepository.rejectUser(userId, deleteUser);
        
        // 3) Send rejection email to user (only if the user wasn't deleted)
        if (!deleteUser) {
            try {
                const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.USER_REJECTED);
                
                const dynamicData = {
                    username: updatedUser.username,
                    date: new Date().toLocaleDateString()
                };
                
                const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
                
                await sendEmail({
                    to: updatedUser.email,
                    subject: template.subject,
                    html: processedContent
                });
                
                console.log(`Rejection email sent to user: ${updatedUser.email}`);
            } catch (error) {
                console.error('Error sending rejection email:', error);
                // Continue with rejection even if email fails
            }
        } else {
            console.log(`User was deleted, no rejection email sent.`);
        }
        
        return updatedUser;
    };    /**
     * Reject a user by token (email link method)
     * @param {string} token - Rejection token
     * @param {boolean} deleteUser - Whether to delete the user instead of marking as rejected
     * @returns {Promise<Object>} - Rejected user
     */
    static rejectUser = async (token, deleteUser = false) => {
        // Verify token
        const decoded = AuthRepository.verifyActionToken(token);
        
        if (decoded.action !== 'reject') {
            throw new AppError('Invalid token for this action', 400);
        }
          // Reject or delete user
        const user = await AuthRepository.rejectUser(decoded.userId, deleteUser);
        
        // Send rejection email to user (only if the user wasn't deleted)
        if (!deleteUser) {
            try {
                const template = await EmailRepository.getEmailTemplate(EMAIL_TEMPLATES.USER_REJECTED);
                
                const dynamicData = {
                    username: user.username,
                    date: new Date().toLocaleDateString()
                };
                
                const processedContent = EmailRepository.processTemplate(template.content, dynamicData);
                
                await sendEmail({
                    to: user.email,
                    subject: template.subject,
                    html: processedContent
                });
                
                console.log(`Rejection email sent to user: ${user.email}`);
            } catch (error) {
                console.error('Error sending rejection email:', error);
            }
        } else {
            console.log(`User was deleted, no rejection email sent.`);
        }
        return user;
    };
    
    /**
     * Login a user with email/username and password
     * @param {string} identifier - Email or username
     * @param {string} password - User password
     * @returns {Promise<Object>} - Authenticated user and token
     */
    static login = async (identifier, password) => {
        console.log('Login attempt with identifier:', identifier);
        
        // 1) Check if identifier and password exist
        if (!identifier || !password) {
            throw new AppError('Please provide email/username and password!', 400);
        }        // 2) Check if user exists & password is correct
        const user = await AuthRepository.findUserByEmailOrUsername(identifier, true);
        
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user || !(await user.correctPassword(password, user.password))) {
            throw new AppError('Incorrect email/username or password', 401);
        }

        // 3) Check if user is approved
        console.log('User status:', user.status);
        if (user.status !== USER_STATUS.APPROVED) {
            throw new AppError('Your account is pending approval. Please wait for admin approval.', 403);
        }

        // 4) Generate JWT token
        const token = AuthRepository.generateAuthToken(user._id);
        console.log('Token generated:', token ? 'Yes' : 'No');

        // Remove password from output
        user.password = undefined;
        
        const result = { user, token };
        console.log('Returning result with user and token');
        return result;
    };
}