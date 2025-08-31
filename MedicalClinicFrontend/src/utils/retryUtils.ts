/**
 * Utility for retrying API calls with exponential backoff
 * 
 * This can be used for critical API calls that should retry
 * a limited number of times before giving up.
 */

interface RetryOptions {
  maxRetries: number;     // Maximum number of retry attempts
  initialDelay: number;   // Initial delay in milliseconds
  maxDelay: number;       // Maximum delay in milliseconds
  backoffFactor: number;  // Factor by which to increase delay on each retry
}

/**
 * Executes a function with retry capability using exponential backoff
 * @param fn Function to execute that returns a Promise
 * @param options Retry configuration options
 * @returns Promise with the result of the function or the last error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = {
    maxRetries: 3,
    initialDelay: 300,
    maxDelay: 5000,
    backoffFactor: 2,
    ...options
  };

  let attempt = 0;
  let delay = config.initialDelay;
  let lastError: any;

  while (attempt <= config.maxRetries) {
    try {
      // First attempt (attempt=0) has no delay
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next attempt (with cap)
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
      }
      
      // Execute the function
      return await fn();
    } catch (error) {
      attempt++;
      lastError = error;
      
      // Check if we should continue retrying
      if (attempt > config.maxRetries) {
        console.warn(`Maximum retries (${config.maxRetries}) reached. Giving up.`);
        break;
      }
      
      // If error is a 4xx client error (except 408 Request Timeout and 429 Too Many Requests),
      // don't retry as these are typically client-side issues that won't be fixed by retrying
      if (error?.response?.status && 
          error.response.status >= 400 && 
          error.response.status < 500 &&
          error.response.status !== 408 && 
          error.response.status !== 429) {
        console.warn(`Not retrying ${error.response.status} client error`);
        break;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}
