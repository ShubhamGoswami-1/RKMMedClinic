import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FilePlus, Check, X, Clock, Filter } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import { Permission, hasPermission } from '../utils/rbac';
import { RootState } from '../store/store';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import PermissionGuard from '../components/PermissionGuard';
import { medicalServiceService, departmentService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Interface for medical service
interface MedicalService {
  id: string;
  name: string;
  code: string;
  description: string;
  departmentId: string;
  departmentName: string;
  price: number;
  isTest: boolean;
  isProcedure: boolean;
  isExternalService: boolean;
  active: boolean;
  approvedBy?: string;
  approvedByName?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

// Interface for department
interface Department {
  id: string;
  name: string;
}

// Status badge component
const StatusBadge: React.FC<{ active: boolean; approved: boolean }> = ({ active, approved }) => {
  if (!approved) {
    return (
      <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        <span>Pending Approval</span>
      </span>
    );
  }
  
  if (active) {
    return (
      <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-green-100 text-green-800">
        <Check className="w-3 h-3" />
        <span>Active</span>
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
      <X className="w-3 h-3" />
      <span>Inactive</span>
    </span>
  );
};

// Service type badge component
const ServiceTypeBadge: React.FC<{ isTest: boolean; isProcedure: boolean }> = ({ isTest, isProcedure }) => {
  if (isTest && isProcedure) {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
        Test & Procedure
      </span>
    );
  }
  
  if (isTest) {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
        Test
      </span>
    );
  }
  
  if (isProcedure) {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
        Procedure
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
      Other
    </span>
  );
};

const MedicalServices: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  // Check permissions
  const canViewServices = hasPermission(user, Permission.VIEW_MEDICAL_SERVICES);
  const canAddService = hasPermission(user, Permission.ADD_MEDICAL_SERVICE);
  const canEditService = hasPermission(user, Permission.EDIT_MEDICAL_SERVICE);
  const canApproveService = hasPermission(user, Permission.APPROVE_MEDICAL_SERVICE);
  
  // State variables
  const [services, setServices] = useState<MedicalService[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: '',
    serviceType: 'all', // 'all', 'tests', 'procedures'
    status: 'all' // 'all', 'active', 'inactive', 'pending'
  });
    // Fetch medical services and departments
  useEffect(() => {
    const fetchData = async () => {
      if (!canViewServices) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch departments
        const deptResponse = await departmentService.getAllDepartments(true);
        if (deptResponse && deptResponse.data) {
          let departmentsList = [];
          if (Array.isArray(deptResponse.data)) {
            departmentsList = deptResponse.data;
          } else if (deptResponse.data.departments && Array.isArray(deptResponse.data.departments)) {
            departmentsList = deptResponse.data.departments;
          } else if (deptResponse.normalizedDepartments && Array.isArray(deptResponse.normalizedDepartments)) {
            departmentsList = deptResponse.normalizedDepartments;
          }
          setDepartments(departmentsList);
        }
          // Fetch medical services
        const servicesResponse = await medicalServiceService.getAllServices(1, 50, false);
        if (servicesResponse && servicesResponse.data) {
          let servicesList = [];
          if (Array.isArray(servicesResponse.data)) {
            servicesList = servicesResponse.data;
          } else if (servicesResponse.data.services && Array.isArray(servicesResponse.data.services)) {
            servicesList = servicesResponse.data.services;          } else if (servicesResponse.data.medicalServices && Array.isArray(servicesResponse.data.medicalServices)) {
            servicesList = servicesResponse.data.medicalServices;
          }
          setServices(servicesList);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showAlert('error', 'Failed to load services. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [canViewServices, showAlert]);
    // Function to handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      // If search term is empty, reset to show all services
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const servicesResponse = await medicalServiceService.getAllServices(1, 50, false);
          if (servicesResponse && servicesResponse.data) {
            let servicesList = [];
            if (Array.isArray(servicesResponse.data)) {
              servicesList = servicesResponse.data;
            } else if (servicesResponse.data.services && Array.isArray(servicesResponse.data.services)) {
              servicesList = servicesResponse.data.services;
            } else if (servicesResponse.data.medicalServices && Array.isArray(servicesResponse.data.medicalServices)) {
              servicesList = servicesResponse.data.medicalServices;
            }
            setServices(servicesList);
          }
        } catch (error) {
          console.error('Failed to reset services data:', error);
          showAlert('error', 'Failed to reset services. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await medicalServiceService.searchServices(searchTerm);
      
      if (response && response.data) {
        let servicesList = [];
        if (Array.isArray(response.data)) {
          servicesList = response.data;
        } else if (response.data.services && Array.isArray(response.data.services)) {
          servicesList = response.data.services;
        } else if (response.data.medicalServices && Array.isArray(response.data.medicalServices)) {
          servicesList = response.data.medicalServices;
        }
        setServices(servicesList);
      }
    } catch (error) {
      console.error('Error searching for services:', error);
      showAlert('error', 'Failed to search for services');
    } finally {
      setIsLoading(false);
    }
  };
    // Function to toggle service status
  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    if (!canEditService) {
      showAlert('error', 'You do not have permission to edit services');
      return;
    }
    
    try {
      // Call the API to update the service status
      await medicalServiceService.updateService(serviceId, { isActive: !currentStatus });
      
      // Update local state
      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, active: !currentStatus } 
          : service
      ));
      
      showAlert('success', `Service ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating service status:', error);
      showAlert('error', 'Failed to update service status');
    }
  };
    // Function to approve a service
  const handleApproveService = async (serviceId: string) => {
    if (!canApproveService) {
      showAlert('error', 'You do not have permission to approve services');
      return;
    }
    
    try {
      // Call the API to approve the service
      await medicalServiceService.updateService(serviceId, { isActive: true });
      
      // Refresh service data to get the updated approval status
      const serviceResponse = await medicalServiceService.getServiceById(serviceId);
      const updatedService = serviceResponse.data.service || serviceResponse.data;
      
      // Update local state
      setServices(services.map(service => 
        service.id === serviceId 
          ? updatedService
          : service
      ));
      
      showAlert('success', 'Service approved successfully');
    } catch (error) {
      console.error('Error approving service:', error);
      showAlert('error', 'Failed to approve service');
    }
  };
  
  // Filter services based on filters and search term
  const filteredServices = services.filter(service => {
    // Filter by department
    if (filters.departmentId && service.departmentId !== filters.departmentId) {
      return false;
    }
    
    // Filter by service type
    if (filters.serviceType === 'tests' && !service.isTest) {
      return false;
    }
    if (filters.serviceType === 'procedures' && !service.isProcedure) {
      return false;
    }
    
    // Filter by status
    if (filters.status === 'active' && (!service.active || !service.approvedBy)) {
      return false;
    }
    if (filters.status === 'inactive' && (service.active || !service.approvedBy)) {
      return false;
    }
    if (filters.status === 'pending' && service.approvedBy) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        service.name.toLowerCase().includes(term) ||
        service.code.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.departmentName.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
  
  // If user doesn't have permission to view services
  if (!canViewServices) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
        <p className="text-gray-700">
          You don't have permission to view medical services. Please contact an administrator
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
        <h1 className="text-2xl font-bold text-gray-800">Medical Services</h1>
        
        <div className="flex space-x-2">
          <PermissionGuard permission={Permission.ADD_MEDICAL_SERVICE}>
            <button
              onClick={() => navigate('/medical-services/create')}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Service
            </button>
          </PermissionGuard>
          
          <PermissionGuard permission={Permission.REQUEST_MEDICAL_SERVICE}>
            <button
              onClick={() => navigate('/service-requests/create')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <FilePlus className="h-5 w-5 mr-2" />
              Request Service
            </button>
          </PermissionGuard>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search services by name, code, or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 shadow-sm pl-10 pr-4 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <button type="submit" className="sr-only">Search</button>
            </form>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
          >
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <label htmlFor="departmentFilter" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                id="departmentFilter"
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                id="typeFilter"
                value={filters.serviceType}
                onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Types</option>
                <option value="tests">Tests Only</option>
                <option value="procedures">Procedures Only</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="statusFilter"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Services List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {filteredServices.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-700 mb-4">No medical services found.</p>
              {canAddService && (
                <button
                  onClick={() => navigate('/medical-services/create')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Add First Service
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map(service => (
                <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{service.name}</h3>
                        <p className="text-sm text-gray-500">Code: {service.code}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="font-bold text-lg text-gray-800">${service.price.toFixed(2)}</p>
                        <ServiceTypeBadge isTest={service.isTest} isProcedure={service.isProcedure} />
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Dept: {service.departmentName}</span>
                      <StatusBadge active={service.active} approved={!!service.approvedBy} />
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => navigate(`/medical-services/${service.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                      
                      <div className="flex space-x-2">
                        {canEditService && service.approvedBy && (
                          <button
                            onClick={() => handleToggleStatus(service.id, service.active)}
                            className={`text-sm ${service.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {service.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        
                        {canApproveService && !service.approvedBy && (
                          <button
                            onClick={() => handleApproveService(service.id)}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MedicalServices;
