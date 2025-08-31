import { AxiosError } from 'axios';
import { useGlobalAlert } from '../hooks/useGlobalAlert';

/**
 * Error handler utility for API requests
 * This utility helps standardize error handling across all API calls
 */

export interface ApiErrorDetails {
  message: string;
  code?: string;
  field?: string;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: ApiErrorDetails[];
}

/**
 * Type guard to check if an error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'isAxiosError' in error && 
    (error as any).isAxiosError === true
  );
}

/**
 * Extracts a user-friendly error message from an API error
 * @param error The error object from an API call
 * @returns A user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    // Handle Axios errors
    const response = error.response?.data as ApiErrorResponse | undefined;
    
    if (response?.message) {
      return response.message;
    }
    
    if (response?.details && response.details.length > 0) {
      return response.details.map(detail => detail.message).join('. ');
    }
    
    if (error.response?.status === 401) {
      return 'You are not authorized to perform this action. Please log in again.';
    }
    
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.response?.status === 400) {
      return 'Invalid request. Please check your input and try again.';
    }
    
    if (error.response?.status === 500) {
      return 'A server error occurred. Please try again later.';
    }
    
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred. Please try again later.';
};

/**
 * A hook that provides a handleApiError function to show alerts for API errors
 * @returns An object with a handleApiError function
 */
export const useApiErrorHandler = () => {
  const { showAlert } = useGlobalAlert();
  
  const handleApiError = (error: unknown, customMessage?: string) => {
    const errorMessage = customMessage || getErrorMessage(error);
    console.error('API Error:', error);
    showAlert('error', errorMessage);
    return errorMessage;
  };
  
  return { handleApiError };
};

export default useApiErrorHandler;
