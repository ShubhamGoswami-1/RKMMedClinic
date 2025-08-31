import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createStaff } from '../../store/slices/staffSlice';
import { fetchLeaveTypes } from '../../store/slices/leaveTypesSlice';
import { createLeaveBalance } from '../../store/slices/leaveBalancesSlice';
import { fetchDepartments } from '../../store/slices/departmentsSlice';

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  joinDate: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  leaveBalances: Array<{
    leaveTypeId: string;
    allocated: number;
  }>;
}

// Define department interface
interface Department {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

const StaffForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.staff);
  const { leaveTypes } = useAppSelector((state) => state.leaveTypes);
  const { departments } = useAppSelector((state) => state.departments || { departments: [] });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    joinDate: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    leaveBalances: [],
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Initialize leave balances based on available leave types
  useEffect(() => {
    if (leaveTypes.length > 0 && formData.leaveBalances.length === 0) {
      setFormData(prev => ({
        ...prev,
        leaveBalances: leaveTypes.map(type => ({
          leaveTypeId: type._id,
          allocated: type.defaultDays || 0,
        })),
      }));
    }
  }, [leaveTypes, formData.leaveBalances.length]);
  
  // Fetch leave types if not already loaded
  useEffect(() => {
    if (leaveTypes.length === 0) {
      dispatch(fetchLeaveTypes(true));
    }  }, [dispatch, leaveTypes.length]);
  
  // Fetch departments if not already loaded
  useEffect(() => {
    dispatch(fetchDepartments(true));
  }, [dispatch]);
    
  // State for tracking submission success
  const [success, setSuccess] = useState(false);

  // Reset form after successful submission
  useEffect(() => {
    if (success && onSuccess) {
      onSuccess();
      setSuccess(false);
    }
  }, [success, onSuccess]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleLeaveBalanceChange = (leaveTypeId: string, allocated: number) => {
    setFormData(prev => ({
      ...prev,
      leaveBalances: prev.leaveBalances.map(balance => 
        balance.leaveTypeId === leaveTypeId 
          ? { ...balance, allocated } 
          : balance
      ),
    }));
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (formData.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.joinDate) errors.joinDate = 'Join date is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) return;
    
    try {
      // Create staff record
      const staffResult = await dispatch(createStaff(formData)).unwrap();
      
      // Create leave balances for the new staff
      const staffId = staffResult._id;
      const currentYear = new Date().getFullYear();
      
      // Create leave balances for each leave type
      await Promise.all(
        formData.leaveBalances.map(balance => 
          dispatch(createLeaveBalance({
            userId: staffId,
            leaveTypeId: balance.leaveTypeId,
            year: currentYear,
            allocated: balance.allocated,
            used: 0,
            pending: 0,
            available: balance.allocated,
          })).unwrap()
        )
      );
      
      // Reset form data
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        joinDate: '',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
        leaveBalances: leaveTypes.map(type => ({
          leaveTypeId: type._id,
          allocated: type.defaultDays || 0,
        })),
      });
      
      // Set success flag
      setSuccess(true);
        } catch (error: any) {
      console.error('Error creating staff with leave balances:', error);
      setSubmitError(error.message || 'Failed to create staff with leave allocations');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-6">Add New Staff</h2>
        
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border ${validationErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
            />
            {validationErrors.firstName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border ${validationErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
            />
            {validationErrors.lastName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select Department</option>
              {departments && departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Join Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border ${validationErrors.joinDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
            />
            {validationErrors.joinDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.joinDate}</p>
            )}
          </div>
        </div>
        
        {/* Address */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        
        {/* Leave Allocation */}
        <div>
          <h3 className="text-lg font-medium mb-3">Leave Allocation</h3>
          <div className="space-y-4">
            {leaveTypes.map(leaveType => {
              const balance = formData.leaveBalances.find(b => b.leaveTypeId === leaveType._id);
              return (
                <div key={leaveType._id} className="flex items-center">
                  <div className="w-1/2 pr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {leaveType.name}
                    </label>
                    <div className="text-sm text-gray-500">{leaveType.description}</div>
                  </div>
                  <div className="w-1/2">
                    <input
                      type="number"
                      min="0"
                      value={balance?.allocated || 0}
                      onChange={(e) => handleLeaveBalanceChange(leaveType._id, parseInt(e.target.value) || 0)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Staff'}
        </button>
      </div>      
      {(error || submitError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
          <div className="flex">
            <div>
              <p className="text-sm text-red-700">
                Error creating staff: {error || submitError}
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default StaffForm;
