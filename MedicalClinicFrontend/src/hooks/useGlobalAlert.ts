import { useAlert } from '../context/AlertContext';

interface AlertOptions {
  duration?: number;
  autoClose?: boolean;
  title?: string;
}

/**
 * Custom hook to access and use the global alert functionality
 * This provides a simple interface for showing alerts across the application
 */
export const useGlobalAlert = () => {
  const { showAlert, hideAlert, alertQueue } = useAlert();
  
  /**
   * Show a success alert
   * @param message The message to display
   * @param options Optional configuration options
   */
  const showSuccessAlert = (message: string, options?: AlertOptions) => {
    showAlert('success', message, options);
  };
  
  /**
   * Show an error alert
   * @param message The message to display
   * @param options Optional configuration options
   */
  const showErrorAlert = (message: string, options?: AlertOptions) => {
    showAlert('error', message, options);
  };
  
  /**
   * Show an info alert
   * @param message The message to display
   * @param options Optional configuration options
   */
  const showInfoAlert = (message: string, options?: AlertOptions) => {
    showAlert('info', message, options);
  };
  
  /**
   * Show a warning alert
   * @param message The message to display
   * @param options Optional configuration options
   */
  const showWarningAlert = (message: string, options?: AlertOptions) => {
    showAlert('warning', message, options);
  };  
  return {
    showAlert,
    hideAlert,
    showSuccessAlert,
    showErrorAlert,
    showInfoAlert,
    showWarningAlert,
    /**
     * Current queue of alerts
     */
    alertQueue
  };
};
