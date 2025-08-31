import { useState, useEffect, useCallback, useRef } from 'react';
import useApiErrorHandler from '../utils/apiErrorHandler';

/**
 * A generic hook for fetching data from an API
 * @param fetchFn The function to fetch data
 * @param dependencies Dependencies for refetching data
 * @param initialData Initial data to use before fetching
 * @returns An object with data, loading state, error, and refetch function
 */
export function useApiQuery<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  initialData?: T
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { handleApiError } = useApiErrorHandler();
  
  // Track if a request is in progress to prevent duplicate calls
  const [isRequestInProgress, setRequestInProgress] = useState(false);
  
  // Track the last fetch time to throttle requests
  const lastFetchTimeRef = useRef<number>(0);
    const fetchData = useCallback(async () => {
    // Skip if already loading
    if (isRequestInProgress) {
      console.log('Skipping duplicate API call - request already in progress');
      return;
    }
    
    // Apply throttling - don't allow calls too quickly in succession
    const now = Date.now();
    const timeSinceLastCall = now - lastFetchTimeRef.current;
    if (timeSinceLastCall < 1000) {
      console.log(`Throttling API call - last call was ${timeSinceLastCall}ms ago`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRequestInProgress(true);
    lastFetchTimeRef.current = now;
    
    try {
      console.log('Fetching data with function:', fetchFn.toString().slice(0, 150) + '...');
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      console.error('API query error:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return undefined;
    } finally {
      setIsLoading(false);
      setRequestInProgress(false);
    }
  }, [fetchFn, handleApiError, isRequestInProgress]);
  useEffect(() => {
    // Create a stable identifier for this dependency set to help with tracking
    const depsSignature = JSON.stringify(dependencies);
    console.log(`useApiQuery dependencies changed: ${depsSignature}`);
    
    // Add a small delay to prevent rapid successive calls
    const handler = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(handler);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies); // Dependencies should be stable references

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * A generic hook for mutating data through an API
 * @param mutationFn The function to mutate data
 * @returns An object with mutate function, loading state, and error
 */
export function useApiMutation<T, P>(
  mutationFn: (params: P) => Promise<T>
) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);
  const { handleApiError } = useApiErrorHandler();

  const mutate = async (params: P): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mutationFn(params);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error, data };
}

/**
 * Usage example:
 * 
 * // For fetching data
 * const { data: doctors, isLoading, error, refetch } = useApiQuery(
 *   () => doctorService.getAllDoctors(true),
 *   [departmentFilter]
 * );
 * 
 * // For mutating data
 * const { mutate: updateDoctor, isLoading: isUpdating } = useApiMutation(
 *   (data) => doctorService.updateDoctor(doctorId, data)
 * );
 * 
 * // Then call it like this:
 * const handleSubmit = async (formData) => {
 *   const result = await updateDoctor(formData);
 *   if (result) {
 *     // Success!
 *     showAlert('success', 'Doctor updated successfully');
 *   }
 * };
 */
