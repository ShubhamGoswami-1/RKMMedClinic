import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { hasRole, validateTokenAndLoadUser } from '../store/slices/authSlice';
import { Permission, hasPermission, hasPageAccess } from '../utils/rbac';
import { refreshTokenIfNeeded } from '../utils/tokenUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string | string[];
  requiredPermissions?: Permission | Permission[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  requiredPermissions
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, user, token, loading } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // First, try to refresh token if needed
    const checkAndRefreshToken = async () => {
      // Only proceed if we have a token but aren't authenticated yet
      if (token && !isAuthenticated && !loading) {
        // Try to refresh token first if needed
        const isTokenValid = await refreshTokenIfNeeded();
        
        // If token is valid, validate and load user data
        if (isTokenValid) {
          dispatch(validateTokenAndLoadUser());
        }
      }
    };
    
    checkAndRefreshToken();
  }, [token, isAuthenticated, loading, dispatch]);
  
  // Show loading state while validating token or loading user data
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  // Check for required roles if specified
  if (requiredRoles && !hasRole(user, requiredRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">
            You don't have permission to access this page. 
            This area requires {Array.isArray(requiredRoles) 
              ? requiredRoles.join(' or ') 
              : requiredRoles} role.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check for required permissions if specified
  if (requiredPermissions) {
    const permissionsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    const hasRequiredPermissions = permissionsArray.every(
      permission => hasPermission(user, permission)
    );
    
    if (!hasRequiredPermissions) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700">
              You don't have the required permissions to access this page.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }
  
  // Check for page access based on current path
  if (!hasPageAccess(user, location.pathname)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">
            Your role doesn't have access to this page.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;