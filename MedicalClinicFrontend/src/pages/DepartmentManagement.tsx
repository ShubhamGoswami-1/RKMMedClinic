import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Permission } from '../utils/rbac';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import PermissionGuard from '../components/PermissionGuard';
import { departmentService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Interface for department
interface Department {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}

const DepartmentManagement: React.FC = () => {
  const { showAlert } = useGlobalAlert();
  
  // State for departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  
  // State for selected department (for edit/view)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // State for modal (add/edit)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // State for operation status
  const [isSubmitting, setIsSubmitting] = useState(false);
    // State for department form
  const [departmentForm, setDepartmentForm] = useState<{
    name: string;
    description: string;
    active: boolean;
  }>({
    name: '',
    description: '',
    active: true
  });
    // State for search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);
  // Fetch departments
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {      const response = await departmentService.getAllDepartments(false); // Include inactive
      if (response && response.data && response.data.departments) {
        // Transform the data to match our Department interface
        const transformedDepartments = response.data.departments.map((dept: any) => {
          console.log('Department data from API:', dept);
          return {
            id: dept._id || dept.id, // Use _id from MongoDB as fallback
            name: dept.name,
            description: dept.description || '',
            // The backend uses 'active', not 'isActive'
            active: typeof dept.active === 'boolean' ? dept.active : true,
            createdAt: dept.createdAt
          };
        });
        console.log('Transformed departments:', transformedDepartments);
        setDepartments(transformedDepartments);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      showAlert('error', error.response?.data?.message || 'Failed to load departments');
    } finally {
      setIsLoadingDepartments(false);
    }  };
  
  // Filter departments by search query
  const filteredDepartments = departments.filter(department => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      department.name.toLowerCase().includes(query) ||
      department.description.toLowerCase().includes(query)
    );
  });
    // Handle opening the add department modal
  const handleAddDepartment = () => {
    setDepartmentForm({
      name: '',
      description: '',
      active: true
    });
    setModalMode('add');
    setShowModal(true);
  };
    // Handle opening the edit department modal
  const handleEditDepartment = (department: Department) => {
    setDepartmentForm({
      name: department.name,
      description: department.description,
      active: department.active
    });
    setSelectedDepartment(department);
    setModalMode('edit');
    setShowModal(true);
  };
  
  // Handle department form submission
  const handleSubmitDepartment = async () => {
    // Validate form
    if (!departmentForm.name.trim()) {
      showAlert('error', 'Department name is required.');
      return;
    }
      setIsSubmitting(true);
      try {
      if (modalMode === 'add') {
        // API call to create a new department
        await departmentService.createDepartment({
          name: departmentForm.name,
          description: departmentForm.description
        });
        
        // Refresh departments after adding
        await fetchDepartments();
        
        showAlert('success', 'The department has been added successfully.');
      } else {
        // API call to update the department
        if (!selectedDepartment || !selectedDepartment.id) {
          showAlert('error', 'No department selected for update.');
          setIsSubmitting(false);
          return;
        }
        
        await departmentService.updateDepartment(
          selectedDepartment.id,
          {            name: departmentForm.name,
            description: departmentForm.description,
            active: departmentForm.active // Use 'active' instead of 'isActive' to match API field
          }
        );
        
        // Refresh departments after updating
        await fetchDepartments();
        
        showAlert('success', 'The department has been updated successfully.');
      }
      
      setShowModal(false);
      setSelectedDepartment(null);
    } catch (error: any) {
      console.error('Error saving department:', error);
      showAlert('error', error.response?.data?.message || 'Failed to save department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle department deletion
  const handleDeleteDepartment = async (departmentId: string) => {
    setIsSubmitting(true);
    try {
      // API call to delete the department
      await departmentService.deleteDepartment(departmentId);
      
      // Refresh departments after deletion
      await fetchDepartments();
      
      showAlert('success', 'The department has been deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting department:', error);
      showAlert('error', error.response?.data?.message || 'Failed to delete department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle toggling department active status
  const toggleDepartmentStatus = async (departmentId: string) => {
    const department = departments.find((dept: Department) => dept.id === departmentId);
    if (!department) return;
    
    setIsSubmitting(true);
    try {      // API call to update the department's status
      await departmentService.updateDepartment(
        departmentId,
        { active: !department.active }
      );
      
      // Refresh departments after status update
      await fetchDepartments();
      
      showAlert('success', `The department has been ${department.active ? 'deactivated' : 'activated'} successfully.`);
    } catch (error: any) {
      console.error('Error toggling department status:', error);
      showAlert('error', error.response?.data?.message || 'Failed to update department status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="p-8">      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Department Management</h1>
          <p className="text-gray-600">Manage medical departments</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <PermissionGuard permission={Permission.ADD_DEPARTMENT}>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              onClick={handleAddDepartment}
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </PermissionGuard>
          
          <button
            className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
            onClick={fetchDepartments}
            disabled={isLoadingDepartments || isSubmitting}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDepartments ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search departments..."
            className="pl-10 pr-4 py-2 w-full border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
        {/* Loading State */}
      {isLoadingDepartments && (
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner size="large" />
        </div>
      )}
      
      {/* Departments List */}
      {!isLoadingDepartments && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>              <tbody className="bg-white divide-y divide-orange-100">
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map(department => (
                    <tr key={department.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{department.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 line-clamp-2">{department.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {department.active ? (
                          <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{formatDate(department.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          <PermissionGuard permission={Permission.EDIT_DEPARTMENT}>
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() => handleEditDepartment(department)}
                              disabled={isSubmitting}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission={Permission.DELETE_DEPARTMENT}>
                            <button
                              className="text-red-600 hover:text-red-800 transition-colors"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the ${department.name} department?`)) {
                                  handleDeleteDepartment(department.id);
                                }
                              }}
                              disabled={isSubmitting}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission={Permission.TOGGLE_DEPARTMENT_STATUS}>
                            <button
                              className={`${department.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} transition-colors`}
                              onClick={() => toggleDepartmentStatus(department.id)}
                              disabled={isSubmitting}
                              title={department.active ? 'Deactivate Department' : 'Activate Department'}
                            >
                              {department.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>                    </tr>
                  ))
                ) : (
                  <tr key="no-departments">
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      {searchQuery ? 'No departments found matching your search criteria.' : 'No departments available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Department Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-orange-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {modalMode === 'add' ? 'Add New Department' : 'Edit Department'}
                </h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDepartment(null);
                  }}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    placeholder="Enter department name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                    placeholder="Enter department description"
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                
                {modalMode === 'edit' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="departmentActive"
                      className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                      checked={departmentForm.active}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, active: e.target.checked })}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="departmentActive" className="ml-2 text-sm text-gray-700">
                      Department is active
                    </label>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDepartment(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                  onClick={handleSubmitDepartment}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <LoadingSpinner size="small" />}
                  {modalMode === 'add' ? 'Add Department' : 'Update Department'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
