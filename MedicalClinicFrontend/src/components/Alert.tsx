import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';
// Fix TypeScript issue with NodeJS.Timeout type
type TimeoutId = ReturnType<typeof setTimeout>;

// Helper function to get appropriate title for each alert type
export const getAlertTitle = (type: AlertType): string => {
  switch (type) {
    case 'success':
      return 'Success!';
    case 'error':
      return 'Error!';
    case 'warning':
      return 'Warning!';
    case 'info':
      return 'Information';
    default:
      return '';
  }
};

interface AlertProps {
  type: AlertType;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
  title?: string;
}

const Alert: React.FC<AlertProps> = ({
  type,
  message,
  isOpen,
  onClose,
  autoClose = true,
  duration = 5000,
  title
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  // Handle auto-close functionality
  useEffect(() => {
    setIsVisible(isOpen);
    
    let timer: TimeoutId;
    if (isOpen && autoClose) {
      timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to finish
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, autoClose, duration, onClose]);

  // Alert type styling
  const getAlertStyles = (): { bgColor: string; iconColor: string; icon: React.ReactNode } => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-400',
          iconColor: 'text-green-500',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-400',
          iconColor: 'text-red-500',
          icon: <AlertCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          bgColor: 'bg-amber-50 border-amber-400',
          iconColor: 'text-amber-500',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-400',
          iconColor: 'text-blue-500',
          icon: <Info className="w-5 h-5" />
        };
    }
  };

  const { bgColor, iconColor, icon } = getAlertStyles();

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md transition-all duration-300 ease-in-out animate-slide-down">
      <div className={`flex items-start p-4 border rounded-lg shadow-md ${bgColor}`}>        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3 flex-grow">
          {title && <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>}
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-gray-500 hover:text-gray-700 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Alert;
