import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { validateTokenAndLoadUser } from './store/slices/authSlice';
import { refreshTokenIfNeeded } from './utils/tokenUtils';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import UserApproval from './pages/UserApproval';
import UserRejection from './pages/UserRejection';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import DoctorManagement from './pages/DoctorManagement';
import CreateDoctor from './pages/CreateDoctor';
import DepartmentManagement from './pages/DepartmentManagement';
import ServiceRequestManagement from './pages/ServiceRequestManagement';
import MedicalServices from './pages/MedicalServices';
import MedicalServiceCreate from './pages/MedicalServiceCreate';
import Appointments from './pages/Appointments';
import AppointmentCreate from './pages/AppointmentCreate';
import LeaveManagement from './pages/LeaveManagement';
import LeaveManagementAdmin from './pages/LeaveManagementAdmin';
import AddStaffPage from './pages/staff/AddStaffPage';
import ApiImplementationGuide from './docs/ApiImplementationGuide';
import { Permission } from './utils/rbac';
import { AlertProvider } from './context/AlertContext';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // App initialization logic
    const initializeApp = async () => {
      try {
        // If we have a token, validate it and load user data
        if (token) {
          // First check if token needs refresh
          await refreshTokenIfNeeded();
          
          // Then validate token and load user data
          await dispatch(validateTokenAndLoadUser()).unwrap();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // Token validation failed, user will need to login again
      } finally {
        // Mark initialization as complete regardless of outcome
        setInitializing(false);
      }
    };
    
    initializeApp();
  }, [dispatch, token]);

  // Show splash screen during initialization
  if (initializing) {
    return <SplashScreen message="Initializing RKM Medical Centre..." />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />
        } />
        <Route path="/auth/signup" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage isSignup />
        } />
        
        {/* Admin routes with approval/rejection */}
        <Route path="/admin/user-approval" element={<UserApproval />} />
        <Route path="/admin/user-rejection" element={<UserRejection />} />
        
        {/* Protected routes for different roles */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Doctor-specific routes */}
        <Route path="/doctor/*" element={
          <ProtectedRoute requiredRoles="doctor">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Staff-specific routes */}
        <Route path="/staff/*" element={
          <ProtectedRoute requiredRoles="staff">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Patient management routes */}
        <Route path="/patients" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_PATIENTS}>
            <Patients />
          </ProtectedRoute>
        } />
        
        {/* Disabled patient registration route 
        <Route path="/patients/register" element={
          <ProtectedRoute requiredPermissions={Permission.ADD_PATIENT}>
            <PatientRegistration />
          </ProtectedRoute>
        } />
        */}
        
        <Route path="/patients/:id" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_PATIENTS}>
            <PatientDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/doctors" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_DOCTORS}>
            <DoctorManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/doctors/create" element={
          <ProtectedRoute requiredPermissions={Permission.ADD_DOCTOR}>
            <CreateDoctor />
          </ProtectedRoute>
        } />
        
        <Route path="/departments" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_DEPARTMENTS}>
            <DepartmentManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/service-requests" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_SERVICE_REQUESTS}>
            <ServiceRequestManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/medical-services" element={
          <ProtectedRoute>
            <MedicalServices />
          </ProtectedRoute>
        } />
        
        <Route path="/medical-services/create" element={
          <ProtectedRoute>
            <MedicalServiceCreate />
          </ProtectedRoute>
        } />
        
        <Route path="/appointments" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_APPOINTMENTS}>
            <Appointments />
          </ProtectedRoute>
        } />
        
        <Route path="/appointments/create" element={
          <ProtectedRoute requiredPermissions={Permission.ADD_APPOINTMENT}>
            <AppointmentCreate />
          </ProtectedRoute>
        } />
        
        {/* Leave Management Routes */}
        <Route path="/leave-management" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_LEAVE_BALANCES}>
            <LeaveManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/leave-management-admin" element={
          <ProtectedRoute requiredPermissions={Permission.VIEW_ALL_LEAVE_REQUESTS}>
            <LeaveManagementAdmin />
          </ProtectedRoute>
        } />
        
        {/* Staff Management Routes */}
        <Route path="/staff/add" element={
          <ProtectedRoute requiredPermissions={Permission.MANAGE_STAFF}>
            <AddStaffPage />
          </ProtectedRoute>
        } />
        
        {/* Accountant-specific routes */}
        <Route path="/accountant/*" element={
          <ProtectedRoute requiredRoles="accountant">
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Redirect root to dashboard if logged in, otherwise to login */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/auth/login" />} 
        />
        
        {/* Catch all unmatched routes */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Page Not Found</h1>
              <p className="text-gray-700">The page you are looking for does not exist.</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go Home
              </button>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </Provider>
  );
}

export default App;