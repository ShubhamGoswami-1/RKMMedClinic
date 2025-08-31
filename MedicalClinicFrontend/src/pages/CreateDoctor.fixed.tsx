import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import { doctorService, departmentService, authService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import useApiErrorHandler from '../utils/apiErrorHandler';

// Days of week array
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Interface for department
interface Department {
  id: string;
  name: string;
}

// Interface for user
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const CreateDoctor: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { handleApiError } = useApiErrorHandler();
  
  // Form states
  const [userId, setUserId] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [qualification, setQualification] = useState<string>('');
  const [experience, setExperience] = useState<number>(0);
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ start: string; end: string }[]>([
    { start: '09:00', end: '17:00' }
  ]);
  
  // State to track if we're creating a doctor with a user or directly
  const [useExistingUser, setUseExistingUser] = useState<boolean>(false);
  
  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Define fetchInitialData with useCallback
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching initial data for CreateDoctor component');
      
      // Fetch data in parallel for better performance
      const [departmentsResponse, usersResponse] = await Promise.all([
        departmentService.getAllDepartments(true),
        authService.getAvailableDoctorUsers()
      ]);
      
      // Process departments
      if (departmentsResponse && departmentsResponse.data) {
        let deptList: Department[] = [];
        
        if (Array.isArray(departmentsResponse.data)) {
          deptList = departmentsResponse.data;
        } else if (departmentsResponse.data.departments && Array.isArray(departmentsResponse.data.departments)) {
          deptList = departmentsResponse.data.departments;
        }
        
        console.log(`Found ${deptList.length} departments`);
        setDepartments(deptList);
        
        if (deptList.length > 0) {
          setDepartmentId(deptList[0].id);
        }
      }
      
      // Process users
      if (usersResponse && usersResponse.data && Array.isArray(usersResponse.data.users)) {
        console.log(`Found ${usersResponse.data.users.length} available users`);
        setAvailableUsers(usersResponse.data.users);
        
        // If no available users, make sure we're set to create doctor directly
        if (usersResponse.data.users.length === 0) {
          setUseExistingUser(false);
          console.log('No available users found, setting to create doctor directly');
        }
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch required data');
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);
  
  // Fetch departments and available users once on component mount
  // Track if initial data has been fetched
  const dataFetchedRef = useRef(false);
  
  useEffect(() => {
    // Only fetch if we haven't already loaded the data
    if (!dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchInitialData();
    }
  }, [fetchInitialData]);
  
  // If there are no available users, force direct doctor creation
  useEffect(() => {
    if (availableUsers.length === 0) {
      setUseExistingUser(false);
    }
  }, [availableUsers]);
  
  // Toggle day selection
  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };
  
  // Add time slot
  const addTimeSlot = () => {
    setAvailableTimeSlots([...availableTimeSlots, { start: '09:00', end: '17:00' }]);
  };
  
  // Remove time slot
  const removeTimeSlot = (index: number) => {
    const updated = [...availableTimeSlots];
    updated.splice(index, 1);
    setAvailableTimeSlots(updated);
  };
  
  // Update time slot
  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...availableTimeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setAvailableTimeSlots(updated);
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate based on whether we're using an existing user or creating a new doctor directly
    if (useExistingUser) {
      if (!userId) newErrors.userId = 'Please select a user';
    } else {
      if (!firstName.trim()) newErrors.firstName = 'First name is required';
      if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    }
    
    if (!departmentId) newErrors.departmentId = 'Please select a department';
    if (!specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (!qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (experience < 0) newErrors.experience = 'Experience cannot be negative';
    if (consultationFee < 0) newErrors.consultationFee = 'Consultation fee cannot be negative';
    if (availableDays.length === 0) newErrors.availableDays = 'Please select at least one available day';
    if (availableTimeSlots.length === 0) {
      newErrors.availableTimeSlots = 'Please add at least one time slot';
    } else {
      // Check time slot validity
      for (let i = 0; i < availableTimeSlots.length; i++) {
        const slot = availableTimeSlots[i];
        if (!slot.start || !slot.end || slot.start >= slot.end) {
          newErrors.availableTimeSlots = 'Please ensure all time slots have valid start and end times';
          break;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('error', 'Please fix the errors in the form');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create the doctor data object based on whether we're using an existing user
      const doctorData: any = {
        departmentId,
        specialization,
        qualification,
        experience,
        consultationFee,
        availableDays,
        availableTimeSlots
      };
      
      // Add either userId or firstName/lastName based on selection
      if (useExistingUser) {
        doctorData.userId = userId;
      } else {
        doctorData.firstName = firstName;
        doctorData.lastName = lastName;
        if (email) doctorData.email = email;
      }
      
      console.log('Submitting doctor data:', doctorData);
      
      const response = await doctorService.createDoctor(doctorData);
      
      console.log('Doctor creation successful:', response);
      
      // Show appropriate success message
      if (useExistingUser) {
        showAlert('success', 'Doctor profile created and linked to existing user');
      } else {
        showAlert('success', 'Doctor created successfully without user account');
      }
      
      // Navigate back to the doctors page with a refresh param to ensure the list is updated
      navigate('/doctors?refresh=true');
    } catch (error) {
      console.error('Error creating doctor:', error);
      handleApiError(error, 'Failed to create doctor');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/doctors')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Add New Doctor</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Doctor Creation Type Selection */}
        <div className="mb-6">
          <div className="flex items-center space-x-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="doctorCreationType"
                checked={!useExistingUser}
                onChange={() => setUseExistingUser(false)}
                className="form-radio h-5 w-5 text-orange-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Create Doctor Directly</span>
            </label>
            {availableUsers.length > 0 && (
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="doctorCreationType"
                  checked={useExistingUser}
                  onChange={() => setUseExistingUser(true)}
                  className="form-radio h-5 w-5 text-orange-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Link to Existing User</span>
              </label>
            )}
          </div>
          {availableUsers.length === 0 && (
            <p className="mt-2 text-sm text-blue-600">
              No users available for linking. Creating doctor directly.
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Selection or Direct Doctor Info */}
          {useExistingUser ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User <span className="text-red-500">*</span>
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={`w-full border ${
                  errors.userId ? 'border-red-500' : 'border-gray-300'
                } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
              >
                <option value="">Select a user</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
              {errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId}</p>}
              {availableUsers.length === 0 && (
                <p className="mt-1 text-sm text-yellow-500">
                  No available users. You can create a doctor directly without a user.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full border ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
              </div>
              
              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full border ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6">
          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={`w-full border ${
                errors.departmentId ? 'border-red-500' : 'border-gray-300'
              } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
            >
              <option value="">Select a department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-500">{errors.departmentId}</p>
            )}
            {departments.length === 0 && (
              <p className="mt-1 text-sm text-yellow-500">
                No departments available. Please create a department first.
              </p>
            )}
          </div>
          
          {/* Specialization */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={`w-full border ${
                errors.specialization ? 'border-red-500' : 'border-gray-300'
              } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="e.g., Cardiology, Neurology, etc."
            />
            {errors.specialization && (
              <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>
            )}
          </div>
          
          {/* Qualification */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className={`w-full border ${
                errors.qualification ? 'border-red-500' : 'border-gray-300'
              } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="e.g., MBBS, MD, etc."
            />
            {errors.qualification && (
              <p className="mt-1 text-sm text-red-500">{errors.qualification}</p>
            )}
          </div>
          
          {/* Experience */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience (years)
            </label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
              min="0"
              className={`w-full border ${
                errors.experience ? 'border-red-500' : 'border-gray-300'
              } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
            />
            {errors.experience && <p className="mt-1 text-sm text-red-500">{errors.experience}</p>}
          </div>
          
          {/* Consultation Fee */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Fee
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className={`w-full border ${
                  errors.consultationFee ? 'border-red-500' : 'border-gray-300'
                } rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
              />
            </div>
            {errors.consultationFee && (
              <p className="mt-1 text-sm text-red-500">{errors.consultationFee}</p>
            )}
          </div>
        </div>
        
        {/* Available Days */}
        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available Days <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  availableDays.includes(day)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.availableDays && (
            <p className="mt-1 text-sm text-red-500">{errors.availableDays}</p>
          )}
        </div>
        
        {/* Time Slots */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Available Time Slots <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addTimeSlot}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
            >
              <Clock size={16} /> Add Time Slot
            </button>
          </div>
          
          {availableTimeSlots.map((slot, index) => (
            <div key={index} className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              {availableTimeSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="mt-6 text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          {errors.availableTimeSlots && (
            <p className="mt-1 text-sm text-red-500">{errors.availableTimeSlots}</p>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="mt-10 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/doctors')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 mr-4 hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white flex items-center gap-2 hover:shadow-lg disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="small" /> Creating...
              </>
            ) : (
              <>
                <Save size={18} /> Create Doctor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDoctor;
