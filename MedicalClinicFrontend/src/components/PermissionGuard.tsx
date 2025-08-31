import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { Permission, hasAllPermissions, hasAnyPermission } from '../utils/rbac';

interface PermissionGuardProps {
  /**
   * Permission(s) required to render children
   * Can be a single permission or an array of permissions
   */
  permission: Permission | Permission[];
  
  /**
   * How to check multiple permissions (when permission is an array)
   * - 'all': User must have all permissions (default)
   * - 'any': User must have at least one of the permissions
   */
  check?: 'all' | 'any';
  
  /**
   * Content to render when user has the required permissions
   */
  children: React.ReactNode;
  
  /**
   * Optional fallback content to render when user lacks permissions
   * If not provided, nothing will be rendered when permissions are missing
   */
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders content based on user permissions
 * Can be used to show/hide UI elements based on the user's role
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  check = 'all',
  children,
  fallback = null,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  
  // Convert single permission to array for consistent handling
  const permissions = Array.isArray(permission) ? permission : [permission];
  
  // Check permissions based on the check type
  const hasAccess = check === 'all' 
    ? hasAllPermissions(user, permissions)
    : hasAnyPermission(user, permissions);
  
  // Render children if user has access, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
