// filepath: c:\Users\shubham.goswami1\OneDrive - Incedo Technology Solutions Ltd\Documents\Dev\Mediclinic\RKMMedClinicCombined\MedicalClinicFrontend\src\pages\Appointments.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, X } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import { Permission, hasPermission } from '../utils/rbac';
import { RootState } from '../store/store';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import PermissionGuard from '../components/PermissionGuard';
import { appointmentService } from '../services/api';

// Appointment data interface
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'initiated' | 'cancelled' | 'no-show';
  reason: string;
  fee?: number;
}

const AppointmentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let badgeClass = '';
  let Icon = null;
  
  switch (status) {
    case 'initiated':
      badgeClass = 'bg-green-100 text-green-800';
      Icon = Calendar;
      break;
    case 'cancelled':
      badgeClass = 'bg-red-100 text-red-800';
      Icon = X;
      break;
    case 'no-show':
      badgeClass = 'bg-yellow-100 text-yellow-800';
      Icon = X;
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-800';
      Icon = Calendar;
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${badgeClass}`}>
      {Icon && <Icon className="w-3 h-3" />}
      <span className="capitalize">{status}</span>
    </span>
  );
};

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  // Check permissions
  const canViewAppointments = hasPermission(user, Permission.VIEW_APPOINTMENTS);
  const canAddAppointment = hasPermission(user, Permission.ADD_APPOINTMENT);
  const canEditAppointment = hasPermission(user, Permission.EDIT_APPOINTMENT);
  
  // For simplicity, we'll consider admin or any user with CANCEL_APPOINTMENT permission as "head-staff"
  const isAdminOrHeadStaff = user?.role === 'admin' || hasPermission(user, Permission.CANCEL_APPOINTMENT);
  
  // State for appointment data and filters
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('upcoming');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20
  });
  const [error, setError] = useState<string | null>(null);
  
  // Fetch appointments data
  useEffect(() => {
    const fetchAppointments = async () => {
      // Check permission first
      if (!canViewAppointments) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        let response;
        
        // Define filters based on selected filter type
        const apiFilters: {
          status?: string;
          startDate?: string;
          endDate?: string;
        } = {};
        
        const today = new Date().toISOString().split('T')[0];
        
        switch (filter) {
          case 'today':
            // Use the today endpoint
            response = await appointmentService.getTodayAppointments(
              pagination.currentPage,
              pagination.limit
            );
            break;
            
          case 'upcoming':
            // Get appointments from today onwards
            apiFilters.startDate = today;
            apiFilters.status = 'initiated';
            response = await appointmentService.getAllAppointments(
              pagination.currentPage,
              pagination.limit,
              apiFilters
            );
            break;
            
          case 'past':
            // Get appointments before today
            apiFilters.endDate = today;
            response = await appointmentService.getAllAppointments(
              pagination.currentPage,
              pagination.limit,
              apiFilters
            );
            break;
            
          case 'all':
          default:
            // If dateFilter is set, filter by that date
            if (dateFilter) {
              apiFilters.startDate = dateFilter;
              apiFilters.endDate = dateFilter;
            }
            
            response = await appointmentService.getAllAppointments(
              pagination.currentPage,
              pagination.limit,
              apiFilters
            );
            break;
        }
        
        // Update state with API response
        setAppointments(response.data.appointments);
        setPagination({
          currentPage: response.pagination.page,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.total,
          limit: response.pagination.limit
        });
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments data. Please try again later.');
        showAlert('error', 'Failed to load appointments data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [canViewAppointments, showAlert, filter, dateFilter, pagination.currentPage, pagination.limit]);
  
  const handleChangeStatus = async (appointmentId: string, newStatus: string) => {
    if (!canEditAppointment) {
      showAlert('error', 'You do not have permission to update appointments');
      return;
    }
    
    // Only 'cancelled' is allowed as a status change (from 'initiated')
    if (newStatus !== 'cancelled') {
      showAlert('error', 'Invalid status change. Only cancellation is allowed.');
      return;
    }
    
    try {
      // Call the API to cancel the appointment
      await appointmentService.cancelAppointment(appointmentId);
      
      // Get the appointment that is being cancelled
      const appointment = appointments.find(app => app.id === appointmentId);
      
      if (!appointment) {
        showAlert('error', 'Appointment not found');
        return;
      }
      
      // Update local state
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: newStatus as 'initiated' | 'cancelled' | 'no-show' } 
          : appointment
      ));
      
      // Show success message with fee refund information
      if (appointment.fee) {
        showAlert('success', `Appointment cancelled successfully. A refund of $${appointment.fee.toFixed(2)} will be processed.`);
      } else {
        showAlert('success', 'Appointment cancelled successfully.');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showAlert('error', 'Failed to cancel appointment');
    }
  };
  
  // If user doesn't have permission to view appointments
  if (!canViewAppointments) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
        <p className="text-gray-700">
          You don't have permission to view appointments. Please contact an administrator
          if you believe this is an error.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        
        {/* Only show add button if user has permission */}
        <PermissionGuard permission={Permission.ADD_APPOINTMENT}>
          <button
            onClick={() => navigate('/appointments/create')}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Book New Appointment
          </button>
        </PermissionGuard>
      </div>
      
      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
              <option value="all">All</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>
      
      {/* Appointments List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {appointments.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-700 mb-4">No appointments found.</p>
              {canAddAppointment && (
                <button
                  onClick={() => navigate('/appointments/create')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Book First Appointment
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr 
                        key={appointment.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/appointments/${appointment.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.doctorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.departmentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                              {appointment.appointmentDate}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1 text-gray-500" />
                              {appointment.appointmentTime}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AppointmentStatusBadge status={appointment.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end space-x-2">
                            {canEditAppointment && appointment.status === 'initiated' && (
                              <>
                                {isAdminOrHeadStaff ? (
                                  <button
                                    onClick={() => handleChangeStatus(appointment.id, 'cancelled')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel
                                  </button>
                                ) : (
                                  <button
                                    className="text-gray-400 cursor-not-allowed"
                                    disabled
                                  >
                                    Cancel
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Pagination Controls */}
      {!isLoading && appointments.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of {pagination.totalItems} appointments
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
              className={`px-3 py-1 rounded ${pagination.currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`px-3 py-1 rounded ${pagination.currentPage === pagination.totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default Appointments;
