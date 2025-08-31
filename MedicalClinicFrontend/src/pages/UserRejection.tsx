import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useGlobalAlert } from '../hooks/useGlobalAlert';

const UserRejection: React.FC = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [deleteUser, setDeleteUser] = useState<boolean>(false); // Add state for delete option
  
  // Admin authentication states
  const [showAdminAuth, setShowAdminAuth] = useState<boolean>(false);
  const [adminCredentials, setAdminCredentials] = useState({
    loginIdentifier: '',
    password: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showWarningAlert, showErrorAlert } = useGlobalAlert();
  
  // Get token from URL query params
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  
  useEffect(() => {
    console.log('UserRejection - Initial render');
    console.log('URL token:', token);
    
    // If no token is provided, show error
    if (!token) {
      setProcessing(false);
      setError('Invalid rejection link. No token provided.');
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
  
  // Function to verify admin credentials and then reject user
  const verifyAdminAndReject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      
      if (!token) {
        console.error('No rejection token found when trying to reject user');
        setError('No rejection token found.');
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
        setError('Only administrators can reject users.');
        setProcessing(false);
        return;
      }
      
      // Now proceed with rejection using the token and admin's auth token
      console.log(`Admin verified, proceeding with rejection (deleteUser=${deleteUser})...`);
      const response = await authService.rejectUser(token, deleteUser);
      console.log('User rejection response:', response);
      
      // Extract username from response
      const responseData = response.data || {};
      
      // Handle potential different response structures gracefully
      let username;
      
      if (deleteUser) {
        // For deleted users, we might have a different structure or missing fields
        username = responseData?.data?.user?.username || 
                  responseData?.user?.username || 
                  'the user';
      } else {
        // For rejected users, we expect the standard structure
        username = responseData?.data?.user?.username || 
                  responseData?.user?.username || 
                  'Unknown';
      }
      
      // Update state safely
      setUsername(username);
      setSuccess(true);
      setShowAdminAuth(false);
      
      // Show warning alert for rejection
      const action = deleteUser ? 'deleted' : 'rejected';
      showWarningAlert(`User ${username} has been ${action}.`);
    } catch (err: any) {
      console.error('Error in admin verification or user rejection:', err);
      setError(err.response?.data?.message || 'Authentication failed or rejection error occurred.');
      
      // Show error alert
      showErrorAlert(err.response?.data?.message || 'Authentication failed or rejection error occurred.');
    } finally {
      setProcessing(false);
    }
  };
  
  if (processing && !showAdminAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing User Rejection</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Rejection Failed</h1>
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
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            User {deleteUser ? 'Deleted' : 'Rejected'}
          </h1>
          <p className="text-gray-700">
            You have {deleteUser ? 'permanently deleted' : 'rejected'} user <span className="font-semibold">{username}</span>'s registration.
            {!deleteUser && " They will be notified about this decision."}
            {deleteUser && " The user's email can now be used for future registrations."}
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
            You are about to reject a user registration. Please verify your admin credentials to proceed.
          </p>
          
          {/* Delete option */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="deleteUser" 
                checked={deleteUser} 
                onChange={() => setDeleteUser(!deleteUser)}
                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
              />
              <label htmlFor="deleteUser" className="ml-2 text-sm text-gray-700">
                Delete user completely from database
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If checked, the user will be permanently deleted instead of marked as rejected.
              This allows the email to be used for future registrations.
            </p>
          </div>
          
          <form onSubmit={verifyAdminAndReject} className="space-y-4">
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
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  'Verify & Reject User'
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing User Rejection</h1>
        <p>Initializing rejection process...</p>
      </div>
    </div>
  );
};

export default UserRejection;
