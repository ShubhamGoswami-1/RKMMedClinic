import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useGlobalAlert } from '../hooks/useGlobalAlert';

// Interface for department
interface Department {
  id: string;
  name: string;
}

// Interface for medical service
interface MedicalService {
  id?: string;
  name: string;
  code: string;
  description: string;
  departmentId: string;
  price: number;
  isTest: boolean;
  isProcedure: boolean;
  isExternalService: boolean;
}

const MedicalServiceCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  
  // State for form data
  const [formData, setFormData] = useState<MedicalService>({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    price: 0,
    isTest: false,
    isProcedure: false,
    isExternalService: false
  });
  
  // State for form validation
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    code?: string;
    description?: string;
    departmentId?: string;
    price?: string;
  }>({});
    // State for departments
  const [departments] = useState<Department[]>([
    { id: '1', name: 'Radiology' },
    { id: '2', name: 'Pathology' },
    { id: '3', name: 'Cardiology' },
    { id: '4', name: 'Neurology' },
    { id: '5', name: 'General Medicine' }
  ]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: typeof formErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Service name is required';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Service code is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.departmentId) {
      errors.departmentId = 'Department is required';
    }
    
    if (formData.price <= 0) {
      errors.price = 'Price must be greater than zero';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
      // In a real implementation, this would make an API call to create the medical service
    
    showAlert('success', 'The medical service has been created successfully and is pending approval.');
    
    navigate('/medical-services');
  };
  
  // Generate service code based on name
  useEffect(() => {
    if (formData.name && !formData.code) {
      // Generate a code based on the name (first letters of each word, uppercase)
      const code = formData.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('') + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      setFormData(prev => ({ ...prev, code }));
    }
  }, [formData.name]);
  
  return (
    <div className="p-8">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
          onClick={() => navigate('/medical-services')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Medical Services</span>
        </button>
      </div>
      
      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="p-6 border-b border-orange-100">
          <h2 className="text-xl font-bold text-gray-800">Create New Medical Service</h2>
          <p className="text-gray-600 mt-1">Add a new medical service to the system</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full border ${formErrors.name ? 'border-red-300' : 'border-orange-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                placeholder="Enter service name"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            {/* Service Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Service Code *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full border ${formErrors.code ? 'border-red-300' : 'border-orange-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                placeholder="Enter service code"
              />
              {formErrors.code && (
                <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
              )}
            </div>
            
            {/* Department */}
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                className={`w-full border ${formErrors.departmentId ? 'border-red-300' : 'border-orange-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {formErrors.departmentId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.departmentId}</p>
              )}
            </div>
            
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full border ${formErrors.price ? 'border-red-300' : 'border-orange-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                placeholder="Enter service price"
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full border ${formErrors.description ? 'border-red-300' : 'border-orange-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                placeholder="Enter service description"
              ></textarea>
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>
            
            {/* Checkboxes */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTest"
                    name="isTest"
                    checked={formData.isTest}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isTest" className="ml-2 text-sm text-gray-700">
                    Is a Test
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isProcedure"
                    name="isProcedure"
                    checked={formData.isProcedure}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isProcedure" className="ml-2 text-sm text-gray-700">
                    Is a Procedure
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isExternalService"
                    name="isExternalService"
                    checked={formData.isExternalService}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isExternalService" className="ml-2 text-sm text-gray-700">
                    Is External Service
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all mr-4"
              onClick={() => navigate('/medical-services')}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Create Service</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium mb-2">Important Information</h3>
        <p className="text-blue-700 text-sm">
          All new medical services require approval from an administrator before they can be used in the system.
          After submission, the service will be in a "Pending Approval" state.
        </p>
      </div>
    </div>
  );
};

export default MedicalServiceCreate;
