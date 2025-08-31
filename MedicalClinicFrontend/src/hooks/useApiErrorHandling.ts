import { useState, useCallback } from 'react';
import { useGlobalAlert } from './useGlobalAlert';

interface ApiErrorTracking {
  count: number;
  lastErrorTime: number;
  message: string;
}

/**
 * A hook for tracking API errors and providing user feedback
 * 
 * This hook helps track error patterns and provides useful user feedback
 * based on the error patterns detected (e.g., suggesting refresh, network issues, etc.)
 */
export function useApiErrorHandling() {
  const { showAlert } = useGlobalAlert();
  const [errorTracking, setErrorTracking] = useState<Record<string, ApiErrorTracking>>({});
  
  /**
   * Track an API error and provide appropriate user feedback
   * @param endpoint The API endpoint that had an error
   * @param error The error object
   * @param customMessage Optional custom message to show to the user
   */
  const trackApiError = useCallback((endpoint: string, error: any, customMessage?: string) => {
    const now = Date.now();
    const errorMessage = error?.message || 'Unknown error occurred';
    const statusCode = error?.response?.status;
    const isNetworkError = !error.response && error.request;
    
    // Initialize or update error tracking for this endpoint
    setErrorTracking(prev => {
      const current = prev[endpoint] || { count: 0, lastErrorTime: 0, message: '' };
      return {
        ...prev,
        [endpoint]: {
          count: current.count + 1,
          lastErrorTime: now,
          message: errorMessage
        }
      };
    });
    
    // Get the updated error count for this endpoint
    const updatedCount = (errorTracking[endpoint]?.count || 0) + 1;
    
    // Handle different error scenarios with appropriate feedback
    if (isNetworkError) {
      showAlert('error', customMessage || 'Network connection issue. Please check your internet connection.');
    } else if (statusCode === 404) {
      showAlert('error', customMessage || 'The requested resource was not found.');
    } else if (statusCode === 403) {
      showAlert('error', customMessage || 'You do not have permission to access this resource.');
    } else if (statusCode === 500) {
      if (updatedCount > 2) {
        showAlert('error', 'Multiple server errors occurred. The system may be experiencing issues, please try again later.');
      } else {
        showAlert('error', customMessage || 'A server error occurred. Please try again later.');
      }
    } else if (errorMessage.includes('Circuit is open')) {
      showAlert('error', 'Too many failed requests. Please try again in a few minutes.');
    } else {
      showAlert('error', customMessage || errorMessage);
    }
    
    // Log detailed error information
    console.error(`API Error (${endpoint}):`, error);
    if (updatedCount > 1) {
      console.warn(`Multiple errors (${updatedCount}) for ${endpoint}`);
    }
  }, [showAlert, errorTracking]);
  
  /**
   * Check if a particular endpoint has had recurring errors
   * @param endpoint The API endpoint to check
   * @returns boolean True if recurring errors detected
   */
  const hasRecurringErrors = useCallback((endpoint: string): boolean => {
    const tracking = errorTracking[endpoint];
    if (!tracking) return false;
    
    // Consider 3+ errors within a 1-minute window as recurring
    return tracking.count >= 3 && (Date.now() - tracking.lastErrorTime) < 60000;
  }, [errorTracking]);
  
  /**
   * Reset error tracking for an endpoint
   * @param endpoint The API endpoint to reset, or 'all' to reset everything
   */
  const resetErrorTracking = useCallback((endpoint: string | 'all') => {
    if (endpoint === 'all') {
      setErrorTracking({});
    } else {
      setErrorTracking(prev => {
        const newTracking = { ...prev };
        delete newTracking[endpoint];
        return newTracking;
      });
    }
  }, []);
  
  return {
    trackApiError,
    hasRecurringErrors,
    resetErrorTracking,
    errorCounts: Object.entries(errorTracking).reduce((acc, [key, value]) => {
      acc[key] = value.count;
      return acc;
    }, {} as Record<string, number>)
  };
}
