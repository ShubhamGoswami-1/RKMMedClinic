/**
 * Role-based access control (RBAC) utility
 * Defines permissions and access control for different user roles
 */

import { User } from '../store/slices/authSlice';

// Define all available permissions in the system
export enum Permission {
  // Patient-related permissions
  VIEW_PATIENTS = 'view_patients',
  ADD_PATIENT = 'add_patient',
  EDIT_PATIENT = 'edit_patient',
  DELETE_PATIENT = 'delete_patient',
  // Appointment-related permissions
  VIEW_APPOINTMENTS = 'view_appointments',
  ADD_APPOINTMENT = 'add_appointment',
  EDIT_APPOINTMENT = 'edit_appointment',
  DELETE_APPOINTMENT = 'delete_appointment',
  SCHEDULE_APPOINTMENT = 'schedule_appointment',
  RESCHEDULE_APPOINTMENT = 'reschedule_appointment',
  CANCEL_APPOINTMENT = 'cancel_appointment',
  
  // User management permissions
  VIEW_USERS = 'view_users',
  ADD_USER = 'add_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  APPROVE_USER = 'approve_user',
  REJECT_USER = 'reject_user',
  
  // Finance-related permissions
  VIEW_BILLING = 'view_billing',
  CREATE_INVOICE = 'create_invoice',
  PROCESS_PAYMENT = 'process_payment',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  
  // Medical record permissions
  VIEW_MEDICAL_RECORDS = 'view_medical_records',
  ADD_MEDICAL_RECORD = 'add_medical_record',
  EDIT_MEDICAL_RECORD = 'edit_medical_record',
  
  // Service request permissions
  VIEW_SERVICE_REQUESTS = 'view_service_requests',
  ADD_SERVICE_REQUEST = 'add_service_request',
  APPROVE_SERVICE_REQUEST = 'approve_service_request',
  REJECT_SERVICE_REQUEST = 'reject_service_request',
  COMPLETE_SERVICE_REQUEST = 'complete_service_request',
    // Doctor management permissions
  VIEW_DOCTORS = 'view_doctors',
  ADD_DOCTOR = 'add_doctor',
  EDIT_DOCTOR = 'edit_doctor',
  DELETE_DOCTOR = 'delete_doctor',
  TOGGLE_DOCTOR_STATUS = 'toggle_doctor_status',
  REASSIGN_DOCTOR = 'reassign_doctor',
  
  // Staff management permissions
  VIEW_STAFF = 'view_staff',
  MANAGE_STAFF = 'manage_staff',
  
  // Department management permissions
  VIEW_DEPARTMENTS = 'view_departments',
  ADD_DEPARTMENT = 'add_department',
  EDIT_DEPARTMENT = 'edit_department',
  DELETE_DEPARTMENT = 'delete_department',  
  TOGGLE_DEPARTMENT_STATUS = 'toggle_department_status',
  
  // Medical service permissions
  VIEW_MEDICAL_SERVICES = 'view_medical_services',
  ADD_MEDICAL_SERVICE = 'add_medical_service',
  EDIT_MEDICAL_SERVICE = 'edit_medical_service',
  APPROVE_MEDICAL_SERVICE = 'approve_medical_service',
  REQUEST_MEDICAL_SERVICE = 'request_medical_service',
  
  // Leave management permissions
  VIEW_LEAVE_TYPES = 'view_leave_types',
  ADD_LEAVE_TYPE = 'add_leave_type',
  EDIT_LEAVE_TYPE = 'edit_leave_type',
  DELETE_LEAVE_TYPE = 'delete_leave_type',
  VIEW_LEAVE_BALANCES = 'view_leave_balances',
  UPDATE_LEAVE_ALLOCATION = 'update_leave_allocation',
  VIEW_LEAVE_REQUESTS = 'view_leave_requests',
  APPLY_FOR_LEAVE = 'apply_for_leave',
  APPROVE_LEAVE_REQUEST = 'approve_leave_request',
  REJECT_LEAVE_REQUEST = 'reject_leave_request',
  CANCEL_LEAVE_REQUEST = 'cancel_leave_request',
  VIEW_ALL_LEAVE_REQUESTS = 'view_all_leave_requests',
  
  // System administration
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
}

// Define role-based permission mappings
const rolePermissions: Record<string, Permission[]> = {
  admin: [
    // Admins have all permissions
    ...Object.values(Permission)
  ],  doctor: [
    // Patient permissions
    Permission.VIEW_PATIENTS,
    Permission.ADD_PATIENT,
    Permission.EDIT_PATIENT,
    
    // Appointment permissions
    Permission.VIEW_APPOINTMENTS,
    Permission.ADD_APPOINTMENT,
    Permission.EDIT_APPOINTMENT,
    Permission.DELETE_APPOINTMENT,
    Permission.SCHEDULE_APPOINTMENT,
    Permission.RESCHEDULE_APPOINTMENT,
    Permission.CANCEL_APPOINTMENT,
    
    // Medical record permissions
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.ADD_MEDICAL_RECORD,
    Permission.EDIT_MEDICAL_RECORD,
    
    // Leave management permissions
    Permission.VIEW_LEAVE_BALANCES,
    Permission.APPLY_FOR_LEAVE,
    Permission.CANCEL_LEAVE_REQUEST,
    Permission.VIEW_LEAVE_REQUESTS,
  ],  staff: [
    // Limited patient permissions
    Permission.VIEW_PATIENTS,
    Permission.ADD_PATIENT,
    
    // Appointment permissions
    Permission.VIEW_APPOINTMENTS,
    Permission.ADD_APPOINTMENT,
    Permission.EDIT_APPOINTMENT,
    Permission.SCHEDULE_APPOINTMENT,
    Permission.RESCHEDULE_APPOINTMENT,
    Permission.CANCEL_APPOINTMENT,
    
    // Limited medical record permissions
    Permission.VIEW_MEDICAL_RECORDS,
    
    // Leave management permissions
    Permission.VIEW_LEAVE_BALANCES,
    Permission.APPLY_FOR_LEAVE,
    Permission.CANCEL_LEAVE_REQUEST,
    Permission.VIEW_LEAVE_REQUESTS,
  ],
  
  accountant: [
    // Limited patient permissions
    Permission.VIEW_PATIENTS,
    
    // Finance permissions
    Permission.VIEW_BILLING,
    Permission.CREATE_INVOICE,
    Permission.PROCESS_PAYMENT,
    Permission.VIEW_FINANCIAL_REPORTS,
  ],
};

// Define page access by role
export const pageAccessByRole: Record<string, string[]> = {  admin: [
    '/dashboard',
    '/admin',
    '/patients',
    '/appointments',
    '/users',
    '/billing',
    '/reports',
    '/settings',
    '/departments',
    '/doctors',
    '/service-requests',
    '/medical-services',
    '/leave-management',
    '/leave-management-admin',
    '/staff/add',
  ],
  
  doctor: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/medical-records',
    '/leave-management',
  ],
  
  staff: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/leave-management',
  ],
  
  accountant: [
    '/dashboard',
    '/billing',
    '/reports',
  ],
};

/**
 * Checks if a user has a specific permission
 * @param user The user object
 * @param permission The permission to check
 * @returns Boolean indicating if the user has the permission
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  
  const userRole = user.role;
  const permissions = rolePermissions[userRole] || [];
  
  return permissions.includes(permission);
};

/**
 * Checks if a user has all of the specified permissions
 * @param user The user object
 * @param permissions Array of permissions to check
 * @returns Boolean indicating if the user has all permissions
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Checks if a user has any of the specified permissions
 * @param user The user object
 * @param permissions Array of permissions to check
 * @returns Boolean indicating if the user has any of the permissions
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Checks if a user has access to a specific page path
 * @param user The user object
 * @param path The page path to check
 * @returns Boolean indicating if the user has access to the page
 */
export const hasPageAccess = (user: User | null, path: string): boolean => {
  if (!user) return false;
  
  const userRole = user.role;
  const accessiblePages = pageAccessByRole[userRole] || [];
  
  // Check if the current path starts with any of the accessible paths
  return accessiblePages.some(page => path.startsWith(page));
};

export default {
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasPageAccess,
};
