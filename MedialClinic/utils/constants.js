export const EMAIL_TEMPLATES = {
  // User registration and approval
  USER_SIGNUP_PENDING_APPROVAL: 'USER_SIGNUP_PENDING_APPROVAL',
  USER_APPROVED: 'USER_APPROVED',
  USER_REJECTED: 'USER_REJECTED',
  
  // Password related
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  
  // Leave management
  LEAVE_REQUEST_NOTIFICATION: 'LEAVE_REQUEST_NOTIFICATION',
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',
};

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  STAFF: 'staff',
};

export const FRONTEND_URLS = {
  BASE_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  APPROVAL_PAGE: '/admin/user-approval',
  REJECTION_PAGE: '/admin/user-rejection',
  LOGIN_PAGE: '/auth/login',
};

export const API_ROUTES = {
  USER_APPROVAL: '/api/v1/users/approve',
  USER_REJECTION: '/api/v1/users/reject',
};

// Keeping the old export for backward compatibility
export const MAIL_TEMPLATE = Object.freeze({
  SIGNUP_APPROVAL_EMAIL_TEMPLATE: "SIGNUP_APPROVAL"
});