import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { Permission, hasPermission } from '../utils/rbac';
import { RootState } from '../store/store';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import PermissionGuard from '../components/PermissionGuard';
import { serviceRequestService, departmentService } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import useApiErrorHandler from '../utils/apiErrorHandler';
import LoadingSpinner from '../components/LoadingSpinner';

// Interface for service request
interface ServiceRequest {
  id: string;
  patientId: string;
  patientName: string;
  medicalServiceId: string;
  serviceName: string;
  departmentId: string;
  departmentName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  scheduledDate: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  notes: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
  results?: string;
}

// Interface for service request filter
interface ServiceRequestFilter {
  status: string;
  priority: string;
  department: string;
  startDate: string;
  endDate: string;
  search: string;
}

// Interface for department
interface Department {
  id: string;
  name: string;
}

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    case 'approved':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    case 'rejected':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    case 'completed':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3" />
          <span>Unknown</span>
        </span>
      );
  }
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'emergency':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3" />
          <span>Emergency</span>
        </span>
      );
    case 'urgent':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-orange-100 text-orange-800">
          <Clock className="w-3 h-3" />
          <span>Urgent</span>
        </span>
      );
    case 'normal':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          <span>Normal</span>
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3" />
          <span>Unknown</span>
        </span>
      );
  }
};

// ServiceRequestManagement component
const ServiceRequestManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { handleApiError } = useApiErrorHandler();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  // State for service requests
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionResults, setActionResults] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  
  // Filters
  const [filters, setFilters] = useState<ServiceRequestFilter>({
    status: 'all',
    priority: 'all',
    department: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // Use API query hooks for data fetching
  const { 
    data: serviceRequests,
    isLoading: isLoadingRequests,
    refetch: refetchRequests
  } = useApiQuery(
    () => {
      const apiFilters: { status?: string; priority?: string; departmentId?: string } = {};
      
      if (filters.status !== 'all') apiFilters.status = filters.status;
      if (filters.priority !== 'all') apiFilters.priority = filters.priority;
      if (filters.department !== 'all') apiFilters.departmentId = filters.department;
      
      return serviceRequestService.getAllRequests(
        pagination.currentPage,
        pagination.limit,
        apiFilters
      );
    },
    [pagination.currentPage, pagination.limit, filters]
  );
  // Use API query for departments
  const { 
    data: departmentData,
    isLoading: isLoadingDepartments,
    error: departmentsError
  } = useApiQuery(
    () => departmentService.getAllDepartments(true),
    []
  );

  // Mutations for request actions
  const { 
    mutate: updateRequestStatus, 
    isLoading: isUpdatingStatus 
  } = useApiMutation(
    ({ requestId, status, notes, results }: { 
      requestId: string; 
      status: string; 
      notes?: string; 
      results?: string 
    }) => {
      switch (status) {
        case 'approved':
          return serviceRequestService.approveRequest(requestId, notes);
        case 'rejected':
          return serviceRequestService.rejectRequest(requestId, notes);
        case 'completed':
          return serviceRequestService.completeRequest(requestId, results);
        case 'cancelled':
          return serviceRequestService.cancelRequest(requestId, notes);
        default:
          throw new Error(`Invalid status: ${status}`);
      }
    }
  );  // Effect to update filtered requests when serviceRequests changes
  useEffect(() => {
    if (serviceRequests) {
      try {
        // Handle different possible response structures
        if (Array.isArray(serviceRequests)) {
          // If serviceRequests is already an array
          setFilteredRequests(serviceRequests);
          // Set default pagination if not available
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: serviceRequests.length,
            limit: 10
          });
        } else if (serviceRequests.data && Array.isArray(serviceRequests.data)) {
          // If the data is directly in the data property
          setFilteredRequests(serviceRequests.data);
          // Set default pagination if not available
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: serviceRequests.data.length,
            limit: 10
          });
        } else if (serviceRequests.requests && Array.isArray(serviceRequests.requests)) {
          // Original expected structure
          setFilteredRequests(serviceRequests.requests);
          // Use provided pagination if available
          if (serviceRequests.pagination) {
            setPagination({
              currentPage: serviceRequests.pagination.page,
              totalPages: serviceRequests.pagination.totalPages,
              totalItems: serviceRequests.pagination.total,
              limit: serviceRequests.pagination.limit
            });
          }
        } else if (serviceRequests.data && serviceRequests.data.requests) {
          // Nested structure
          setFilteredRequests(serviceRequests.data.requests);
          // Use provided pagination if available
          if (serviceRequests.data.pagination) {
            setPagination({
              currentPage: serviceRequests.data.pagination.page,
              totalPages: serviceRequests.data.pagination.totalPages,
              totalItems: serviceRequests.data.pagination.total,
              limit: serviceRequests.data.pagination.limit
            });
          }
        } else {
          console.error('Unexpected service requests data structure:', serviceRequests);
          setFilteredRequests([]);
        }
      } catch (error) {
        console.error('Error processing service requests:', error);
        setFilteredRequests([]);
      }
    }
  }, [serviceRequests]);// Effect to update departments when departmentData changes
  useEffect(() => {
    if (departmentData) {
      // Handle both possible response structures
      if (departmentData.data && Array.isArray(departmentData.data)) {
        setDepartments(departmentData.data);
      } else if (departmentData.data && departmentData.data.departments) {
        setDepartments(departmentData.data.departments);
      } else {
        console.error('Unexpected department data structure:', departmentData);
      }
    }
  }, [departmentData]);

  // Change request status
  const changeRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const notes = actionNotes.trim();
      const results = actionResults.trim();
      
      const result = await updateRequestStatus({ requestId, status: newStatus, notes, results });
      
      if (result) {
        // Reset action fields
        setActionNotes('');
        setActionResults('');
        
        // Refresh requests
        refetchRequests();
        
        // Show success alert
        showAlert('success', `Request ${newStatus} successfully`);
      }
    } catch (err) {
      handleApiError(err, `Failed to change request status to ${newStatus}`);
    }
  };
  
  // Handle approve action
  const handleApprove = (requestId: string) => {
    changeRequestStatus(requestId, 'approved');
  };

  // Handle reject action
  const handleReject = (requestId: string) => {
    changeRequestStatus(requestId, 'rejected');
  };

  // Handle complete action
  const handleComplete = (requestId: string, results: string) => {
    setActionResults(results);
    changeRequestStatus(requestId, 'completed');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      department: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };  // Main loading state to show loading spinner when needed
  const isLoading = isLoadingRequests || isLoadingDepartments || isUpdatingStatus;

  return (
    <div className="p-8">      {/* Loading state display */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <LoadingSpinner size="large" text="Processing request..." />
        </div>
      )}
      
      {/* Department error display */}
      {departmentsError && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading departments</p>
          <p className="text-sm">{departmentsError}</p>
        </div>
      )}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Requests</h1>
          <p className="text-gray-600">Manage medical service requests for patients</p>
        </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">          <PermissionGuard permission={Permission.ADD_SERVICE_REQUEST}>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              onClick={() => navigate('/service-requests/create')}
            >
              <FileText className="w-4 h-4" />
              <span>New Request</span>
            </button>
          </PermissionGuard>
          
          <button
            className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
            <button
            className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
            onClick={() => {
              refetchRequests();
              showAlert('info', 'Service request data has been refreshed');
            }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>            <input
              type="text"
              placeholder="Search by patient, service, or department..."
              className="pl-10 pr-4 py-2 w-full border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-orange-50 p-4 rounded-lg mt-4 border border-orange-100">
            <h3 className="font-medium text-gray-800 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Priorities</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>                <input
                  type="date"
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  name="startDate"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>                <input
                  type="date"
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  name="endDate"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              
              <div className="flex items-end">                <button
                  className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Service Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-orange-200">
            <thead className="bg-orange-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Requested
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-orange-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">{request.patientName}</div>
                      <div className="text-xs text-gray-500">ID: {request.patientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{request.serviceName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{request.departmentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{formatDate(request.requestedAt)}</div>
                      <div className="text-xs text-gray-500">By: {request.requestedByName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={request.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={() => setSelectedRequest(request)}
                        >
                          View
                        </button>
                        
                        {request.status === 'pending' && hasPermission(user, Permission.APPROVE_SERVICE_REQUEST) && (
                          <button
                            className="text-green-600 hover:text-green-800 transition-colors"
                            onClick={() => handleApprove(request.id)}
                          >
                            Approve
                          </button>
                        )}
                        
                        {request.status === 'pending' && hasPermission(user, Permission.REJECT_SERVICE_REQUEST) && (
                          <button
                            className="text-red-600 hover:text-red-800 transition-colors"
                            onClick={() => handleReject(request.id)}
                          >
                            Reject
                          </button>
                        )}
                        
                        {request.status === 'approved' && hasPermission(user, Permission.COMPLETE_SERVICE_REQUEST) && (
                          <button
                            className="text-orange-600 hover:text-orange-800 transition-colors"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No service requests found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Service Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-orange-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Service Request Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedRequest(null)}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Patient</h3>
                  <p className="text-base text-gray-800">{selectedRequest.patientName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Service</h3>
                  <p className="text-base text-gray-800">{selectedRequest.serviceName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="text-base text-gray-800">{selectedRequest.departmentName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requested By</h3>
                  <p className="text-base text-gray-800">{selectedRequest.requestedByName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requested At</h3>
                  <p className="text-base text-gray-800">{formatDate(selectedRequest.requestedAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Scheduled Date</h3>
                  <p className="text-base text-gray-800">
                    {selectedRequest.scheduledDate ? formatDate(selectedRequest.scheduledDate) : 'Not scheduled'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <div className="mt-1">
                    <PriorityBadge priority={selectedRequest.priority} />
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800">{selectedRequest.notes || 'No notes provided.'}</p>
                </div>
              </div>
              
              {/* Results if completed */}
              {selectedRequest.status === 'completed' && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Results</h3>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-800">{selectedRequest.results || 'No results recorded.'}</p>
                  </div>
                </div>
              )}
              
              {/* Approval/Rejection/Completion Details */}
              {selectedRequest.approvedBy && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Approval Details</h3>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-800">
                      Approved by {selectedRequest.approvedByName} on {formatDate(selectedRequest.approvedAt || '')}
                    </p>
                  </div>
                </div>
              )}
              
              {selectedRequest.rejectedBy && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Rejection Details</h3>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-800">
                      Rejected by {selectedRequest.rejectedByName} on {formatDate(selectedRequest.rejectedAt || '')}
                    </p>
                  </div>
                </div>
              )}
              
              {selectedRequest.completedBy && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Details</h3>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-800">
                      Completed by {selectedRequest.completedByName} on {formatDate(selectedRequest.completedAt || '')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Complete form for approved requests */}
              {selectedRequest.status === 'approved' && hasPermission(user, Permission.COMPLETE_SERVICE_REQUEST) && (
                <div className="mt-6 border-t border-orange-100 pt-6">
                  <h3 className="text-base font-medium text-gray-800 mb-4">Mark as Completed</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Results
                    </label>
                    <textarea
                      rows={4}
                      className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter test/procedure results here..."
                      id="resultsInput"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                      onClick={() => {
                        const resultsInput = document.getElementById('resultsInput') as HTMLTextAreaElement;
                        handleComplete(selectedRequest.id, resultsInput.value);
                      }}
                    >
                      Complete Request
                    </button>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
                  {selectedRequest.status === 'pending' && hasPermission(user, Permission.APPROVE_SERVICE_REQUEST) && (
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                  >
                    Approve
                  </button>
                )}
                  {selectedRequest.status === 'pending' && hasPermission(user, Permission.REJECT_SERVICE_REQUEST) && (
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestManagement;
