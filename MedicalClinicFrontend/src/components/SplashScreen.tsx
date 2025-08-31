import React from 'react';

interface SplashScreenProps {
  message?: string;
}

/**
 * Splash screen component displayed during app initialization or authentication checks
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Logo/Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6 shadow-lg">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-10 h-10 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
            />
          </svg>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">RKM Medical Centre</h1>
        
        {/* Loading Indicator */}
        <div className="flex justify-center my-6">
          <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-loading-bar"></div>
          </div>
        </div>
        
        {/* Message */}
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default SplashScreen;
