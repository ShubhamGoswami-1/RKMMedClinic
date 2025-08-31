import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Clock, User, UserPlus } from 'lucide-react';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import { doctorService, departmentService, authService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import useApiErrorHandler from '../utils/apiErrorHandler';
import doctorIllustration from '../assets/images/doctor-illustration.avif';

// Days of week array
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Interface for department
interface Department {
  id: string;
  name: string;
  active?: boolean;
  description?: string;
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
      
      // Clear any existing department cache to ensure fresh data
      departmentService.clearCache();
      
      // Fetch data in parallel for better performance
      const [departmentsResponse, usersResponse] = await Promise.all([
        departmentService.getAllDepartments(true),
        authService.getAvailableDoctorUsers()
      ]);
        // Process departments
      if (departmentsResponse) {
        console.log('Department response:', departmentsResponse);
        
        // Use the normalized departments if available, otherwise process manually
        let validDepts: Department[] = [];
          if (departmentsResponse.normalizedDepartments && Array.isArray(departmentsResponse.normalizedDepartments)) {          // Use pre-processed normalized departments
          validDepts = departmentsResponse.normalizedDepartments
            .filter((dept: any) => dept && dept.id && /^[0-9a-fA-F]{24}$/.test(dept.id) && dept.active !== false) // Only include active departments
            .map((dept: any) => ({
              id: dept.id,
              name: dept.name || 'Unnamed Department',
              active: dept.active
            }));
          console.log('Using normalized departments:', validDepts);
        } else {
          // Extract departments from the response based on various possible structures
          let rawDepartments: any[] = [];
          
          if (Array.isArray(departmentsResponse)) {
            // Handle if the response is a direct array
            rawDepartments = departmentsResponse;
          } else if (departmentsResponse.data) {
            if (Array.isArray(departmentsResponse.data)) {
              // Handle if response.data is an array
              rawDepartments = departmentsResponse.data;
            } else if (departmentsResponse.data.departments && Array.isArray(departmentsResponse.data.departments)) {
              // Handle if response.data.departments is an array
              rawDepartments = departmentsResponse.data.departments;
            } else if (departmentsResponse.data.data && Array.isArray(departmentsResponse.data.data.departments)) {
              // Handle if response.data.data.departments is an array
              rawDepartments = departmentsResponse.data.data.departments;
            } else if (departmentsResponse.data.data && Array.isArray(departmentsResponse.data.data)) {
              // Handle if response.data.data is an array
              rawDepartments = departmentsResponse.data.data;
            }
          } else if (departmentsResponse.departments && Array.isArray(departmentsResponse.departments)) {
            // Handle if response.departments is an array
            rawDepartments = departmentsResponse.departments;          }
            console.log(`Found ${rawDepartments.length} raw departments:`, rawDepartments);
            
            // Map the departments to the expected format, handling both _id and id fields
            validDepts = rawDepartments
              .filter((dept: any) => dept !== null && dept !== undefined) // Filter out null/undefined
              .map((dept: any) => {
                const id = dept._id || dept.id || '';
                const name = dept.name || 'Unnamed Department';
                const active = dept.active === undefined ? true : dept.active; // Default active to true if not specified
                return { id, name, active };
              })
              .filter((dept: Department) => {
                // Only include active departments
                if (dept.active === false) {
                  console.log(`Filtering out inactive department: ${dept.name}`);
                  return false;
                }
              
              // Validate ID format
              const hasValidId = dept.id && typeof dept.id === 'string' && /^[0-9a-fA-F]{24}$/.test(dept.id);
              if (!hasValidId) {
                console.warn(`Filtering out department with invalid ID: ${dept.id}, name: ${dept.name}`);
                return false;
              }
              return true;
            });
        }
        
        console.log(`Final department list: ${validDepts.length} departments`, validDepts);
        
        // Set departments state
        setDepartments(validDepts);
        
        // If departments were found, set the first one as the default selection
        if (validDepts.length > 0) {
          // Make sure we're setting the actual ID, not the name
          console.log(`Setting initial department ID to: ${validDepts[0].id}`);
          setDepartmentId(validDepts[0].id);
        } else {
          // If no valid departments were found, show an error
          console.error('No valid departments found. The doctor cannot be created without a department.');
          showAlert('error', 'No valid departments found. Please create a department first.');
        }} else {
        console.error('Department response is empty or invalid');
        showAlert('error', 'Failed to load departments. Please try again later.');
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
      showAlert('error', 'Failed to load initial data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, showAlert]);
  
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
    
    if (!departmentId) {
      newErrors.departmentId = 'Please select a department';
    } else if (!(/^[0-9a-fA-F]{24}$/).test(departmentId)) {
      newErrors.departmentId = 'Invalid department ID format. Please select a valid department.';
    }
    
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
      // Create availability array from selected days and time slots
      const availability = availableDays.map(day => ({
        day,
        startTime: availableTimeSlots[0].start,
        endTime: availableTimeSlots[0].end,
        isAvailable: true
      }));
      
      // Create the doctor data object based on whether we're using an existing user
      const doctorData: any = {
        departmentId,
        specialization,
        qualification,
        experience,
        consultationFee,
        availability
      };
      
      // Add either userId or firstName/lastName based on selection
      if (useExistingUser) {
        doctorData.userId = userId;
      } else {
        doctorData.firstName = firstName;
        doctorData.lastName = lastName;
        if (email) doctorData.email = email;
      }      // Find the selected department to log for debugging
      const selectedDept = departments.find(d => d.id === departmentId);
      console.log(`Selected department: ${selectedDept ? selectedDept.name : 'Unknown'} with ID: ${departmentId}`);
      
      // Show warning for non-ObjectId department IDs
      if (departmentId && !(/^[0-9a-fA-F]{24}$/).test(departmentId)) {
        console.error(`Invalid department ID format: ${departmentId}. Must be a valid MongoDB ObjectId (24 hex chars).`);
        showAlert('error', 'Invalid department ID format. Please select a valid department.');
        setSubmitting(false);
        return;
      }
      
      // Double check that we have valid departments loaded
      if (departments.length === 0) {
        console.error('No departments available to select from');
        showAlert('error', 'No departments available. Please create a department first.');
        setSubmitting(false);
        return;
      }
      
      // Ensure the selected department exists in our list
      if (!selectedDept) {
        console.error(`Selected department ID ${departmentId} not found in the available departments`);
        showAlert('error', 'The selected department is invalid. Please select a valid department.');
        setSubmitting(false);
        return;
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/doctors')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Add New Doctor</h1>
      </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row">          {/* Left side - Image */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={doctorIllustration} 
                alt="Doctor with laptop and medical icons" 
                className="max-w-full h-auto rounded-lg shadow-md object-contain"
                onError={(e) => {
                  // Fallback image if the primary one fails to load
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg";
                }}
              />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600/10 to-transparent h-1/4 rounded-b-lg"></div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="md:w-2/3 p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Doctor Information</h2>
            
            <form onSubmit={handleSubmit}>
              {/* User linking section - only shown if users are available */}
              {availableUsers.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-gray-700">User Account</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Link to existing user?</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={useExistingUser}
                          onChange={() => setUseExistingUser(!useExistingUser)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  {useExistingUser ? (
                    <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <User size={16} className="text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Select Existing User</span>
                      </div>
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
                    </div>
                  ) : (
                    <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <UserPlus size={16} className="text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Create Without User Account</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        The doctor will be created without linking to an existing user account.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Doctor Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name and Last Name */}
                {!useExistingUser && (
                  <>
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
                
                {/* Department Selection */}                <div className={!useExistingUser ? "" : "md:col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={departmentId}
                      onChange={(e) => {
                        console.log(`Department selected: value=${e.target.value}`);
                        setDepartmentId(e.target.value);
                        // Clear any previous department error when a new selection is made
                        if (errors.departmentId) {
                          setErrors({...errors, departmentId: ''});
                        }
                      }}
                      className={`w-full border ${
                        errors.departmentId ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    >                      <option value="">Select a department</option>
                      {departments && departments.length > 0 ? (
                        departments
                          .filter(dept => dept.active !== false) // Only show active departments
                          .map((dept, index) => {
                            // Add extra safety checks
                            if (!dept || !dept.id || !dept.name) {
                              console.warn(`Invalid department at index ${index}:`, dept);
                              return null;
                            }
                            
                            // Only include departments with valid IDs
                            if (!/^[0-9a-fA-F]{24}$/.test(dept.id)) {
                              console.warn(`Skipping department with invalid ID format: ${dept.id}, name: ${dept.name}`);
                              return null;
                            }
                            
                            console.log(`Department option: id=${dept.id}, name=${dept.name}, active=${dept.active}`);
                            return (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                            );
                          })
                      ) : (
                        <option value="" disabled>No departments available</option>
                      )}
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
                </div>
              </div>
              
              <h3 className="text-md font-medium text-gray-700 mt-8 mb-4 border-b pb-2">Professional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specialization */}
                <div>
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
                <div>
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
                <div>
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
                <div>
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
              
              <h3 className="text-md font-medium text-gray-700 mt-8 mb-4 border-b pb-2">Availability</h3>
              
              {/* Available Days */}
              <div>
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
              <div className="mt-6">
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
                  <div key={index} className="flex items-center gap-3 mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
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
        </div>
      </div>
    </div>
  );
};

export default CreateDoctor;
