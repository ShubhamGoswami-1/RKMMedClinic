import React, { createContext, useContext, useState, ReactNode } from 'react';
import Alert, { AlertType, getAlertTitle } from '../components/Alert';

interface AlertOptions {
  duration?: number;
  autoClose?: boolean;
  title?: string;
}

interface AlertContextProps {
  showAlert: (type: AlertType, message: string, options?: AlertOptions) => void;
  hideAlert: () => void;  alertQueue: Array<{
    id: string;
    type: AlertType;
    message: string;
    duration: number;
    autoClose: boolean;
    title?: string;
  }>;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: AlertType;
    message: string;
    duration: number;
    autoClose: boolean;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
    duration: 5000,
    autoClose: true
  });
  
  const [alertQueue, setAlertQueue] = useState<Array<{
    id: string;
    type: AlertType;
    message: string;
    duration: number;
    autoClose: boolean;
  }>>([]);
  const showAlert = (
    type: AlertType, 
    message: string, 
    options?: AlertOptions
  ) => {
    const alertId = Date.now().toString();
    setAlertState({
      isOpen: true,
      type,
      message,
      duration: options?.duration || 5000,
      autoClose: options?.autoClose !== undefined ? options.autoClose : true,
      title: options?.title || getAlertTitle(type)
    });
    
    // Add to queue for potential future use with multiple alerts
    setAlertQueue(queue => [...queue, {
      id: alertId,
      type,
      message,
      duration: options?.duration || 5000,
      autoClose: options?.autoClose !== undefined ? options.autoClose : true,
      title: options?.title || getAlertTitle(type)
    }]);
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
    // Remove from queue when implementing multiple alerts
  };
  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, alertQueue }}>
      {children}      <Alert
        type={alertState.type}
        message={alertState.message}
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        duration={alertState.duration}
        autoClose={alertState.autoClose}
        title={alertState.title}
      />
    </AlertContext.Provider>  );
};
