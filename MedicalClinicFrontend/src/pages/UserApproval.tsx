import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useGlobalAlert } from '../hooks/useGlobalAlert';

const UserApproval: React.FC = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  
  // Admin authentication states
  const [showAdminAuth, setShowAdminAuth] = useState<boolean>(false);
  const [adminCredentials, setAdminCredentials] = useState({
    loginIdentifier: '',
    password: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccessAlert, showErrorAlert } = useGlobalAlert();
  
  // Get token from URL query params
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  
  useEffect(() => {
    console.log('UserApproval - Initial render');
    console.log('URL token:', token);
    
    // If no token is provided, show error
    if (!token) {
      setProcessing(false);
      setError('Invalid approval link. No token provided.');
      return;
    }
    
    // With secure approach, we show the admin authentication form
    setShowAdminAuth(true);
    setProcessing(false);
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to verify admin credentials and then approve user
  const verifyAdminAndApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      
      if (!token) {
        console.error('No approval token found when trying to approve user');
        setError('No approval token found.');
        setProcessing(false);
        return;
      }
      
      // First verify admin credentials
      console.log('Verifying admin credentials...');
      const loginResponse = await authService.login(
        adminCredentials.loginIdentifier, 
        adminCredentials.password
      );
      
      // Check if the user is an admin
      if (loginResponse.data.user.role !== 'admin') {
        setError('Only administrators can approve users.');
        setProcessing(false);
        return;
      }
      
      // Now proceed with approval using the token and admin's auth token
      console.log('Admin verified, proceeding with approval...');
      const response = await authService.approveUser(token);
      console.log('User approval response:', response);
      
      setUsername(response.data.user.username);
      setSuccess(true);
      setShowAdminAuth(false);
      
      // Show success alert
      showSuccessAlert(`User ${response.data.user.username} has been approved successfully.`);
    } catch (err: any) {
      console.error('Error in admin verification or user approval:', err);
      setError(err.response?.data?.message || 'Authentication failed or approval error occurred.');
      
      // Show error alert
      showErrorAlert(err.response?.data?.message || 'Authentication failed or approval error occurred.');
    } finally {
      setProcessing(false);
    }
  };
  
  if (processing && !showAdminAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing User Approval</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Approval Failed</h1>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-green-600 mb-4">User Approved</h1>
          <p className="text-gray-700">
            You have successfully approved user <span className="font-semibold">{username}</span>.
            They can now log in to the system.
          </p>
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={() => navigate('/auth/login')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show admin authentication form
  if (showAdminAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Authentication Required</h1>
          
          <p className="text-gray-700 mb-6">
            You are about to approve a new user registration. Please verify your admin credentials to proceed.
          </p>
          
          <form onSubmit={verifyAdminAndApprove} className="space-y-4">
            <div>
              <label htmlFor="loginIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                id="loginIdentifier"
                name="loginIdentifier"
                value={adminCredentials.loginIdentifier}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Admin username or email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={adminCredentials.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Admin password"
                required
              />
            </div>
            
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify & Approve User'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="ml-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Fallback UI (should not typically be reached)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing User Approval</h1>
        <p>Initializing approval process...</p>
      </div>
    </div>
  );
};

export default UserApproval;
