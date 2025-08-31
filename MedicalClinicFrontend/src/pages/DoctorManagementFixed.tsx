import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Calendar, CheckCircle, XCircle, Edit, Trash, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Permission } from '../utils/rbac';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import PermissionGuard from '../components/PermissionGuard';
import { doctorService, departmentService } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import useApiErrorHandler from '../utils/apiErrorHandler';
import LoadingSpinner from '../components/LoadingSpinner';

// Interface for doctor
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  active: boolean;
  joiningDate: string;
  availableDays: string[];
  availableTimeSlots: {
    startTime: string;
    endTime: string;
  }[];
  profileImage?: string;
}

// Interface for department
interface Department {
  id: string;
  name: string;
}

// Interface for doctor filter
interface DoctorFilter {
  department: string;
  specialization: string;
  status: string;
  search: string;
}

// Status badge component
const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => {
  if (active) {
    return (
      <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        <span>Active</span>
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
      <XCircle className="w-3 h-3" />
      <span>Inactive</span>
    </span>
  );
};

// Days of week array
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { handleApiError } = useApiErrorHandler();
  
  // State for specializations
  const [specializations, setSpecializations] = useState<string[]>([]);
  
  // State for filters
  const [filter, setFilter] = useState<DoctorFilter>({
    department: 'all',
    specialization: 'all',
    status: 'all',
    search: ''
  });
  
  // State for showing filter panel
  const [showFilters, setShowFilters] = useState(false);
  
  // State for showing schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // State for doctor to schedule
  const [doctorToSchedule, setDoctorToSchedule] = useState<Doctor | null>(null);
  
  // State for new schedule
  const [newSchedule, setNewSchedule] = useState<{
    availableDays: string[];
    availableTimeSlots: { startTime: string; endTime: string }[];
  }>({
    availableDays: [],
    availableTimeSlots: [{ startTime: '09:00', endTime: '17:00' }]
  });

  // Fetch doctors with API hook
  const { 
    data: doctorsData, 
    isLoading: isLoadingDoctors, 
    error: doctorsError,
    refetch: refetchDoctors
  } = useApiQuery(
    () => doctorService.getAllDoctors(filter.status !== 'inactive', filter.department !== 'all' ? filter.department : undefined),
    [filter.status, filter.department]
  );
  
  // Fetch departments with API hook
  const {
    data: departmentsData,
    isLoading: isLoadingDepartments,
    error: departmentsError
  } = useApiQuery(
    () => departmentService.getAllDepartments(true),
    []
  );

  // Toggle doctor status mutation
  const {
    mutate: toggleDoctorStatusMutation,
    isLoading: isTogglingStatus
  } = useApiMutation(
    ({ doctorId, active }: { doctorId: string; active: boolean }) => 
      doctorService.updateDoctor(doctorId, { isActive: active })
  );
  
  // Update doctor schedule mutation
  const {
    mutate: updateDoctorScheduleMutation,
    isLoading: isUpdatingSchedule
  } = useApiMutation(
    ({ doctorId, schedule }: { 
      doctorId: string; 
      schedule: {
        availableDays: string[];
        availableTimeSlots: { startTime: string; endTime: string }[];
      }
    }) => 
      doctorService.updateDoctor(doctorId, { 
        availableDays: schedule.availableDays,
        availableTimeSlots: schedule.availableTimeSlots.map(slot => ({
          start: slot.startTime,
          end: slot.endTime
        }))
      })
  );

  // State for doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Effect to update doctors when API data changes
  useEffect(() => {
    if (doctorsData) {
      try {
        let doctorsList: Doctor[] = [];
        
        // Handle different response structures
        if (Array.isArray(doctorsData)) {
          doctorsList = doctorsData;
        } else if (doctorsData.data && Array.isArray(doctorsData.data)) {
          doctorsList = doctorsData.data;
        } else if (doctorsData.data && doctorsData.data.doctors && Array.isArray(doctorsData.data.doctors)) {
          doctorsList = doctorsData.data.doctors;
        } else {
          console.error('Unexpected doctor data structure:', doctorsData);
          doctorsList = [];
        }
        
        setDoctors(doctorsList);
        
        // Extract unique specializations from doctor data
        const allSpecializations = doctorsList.map((doc: Doctor) => doc.specialization);
        const uniqueSpecializations = [...new Set(allSpecializations)];
        setSpecializations(uniqueSpecializations as string[]);
      } catch (error) {
        console.error('Error processing doctor data:', error);
        setDoctors([]);
        setSpecializations([]);
      }
    }
  }, [doctorsData]);
  
  // Effect to update departments when API data changes
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    if (departmentsData) {
      try {
        // Handle both possible response structures
        if (departmentsData.data && Array.isArray(departmentsData.data)) {
          setDepartments(departmentsData.data);
        } else if (departmentsData.data && departmentsData.data.departments) {
          setDepartments(departmentsData.data.departments);
        } else {
          console.error('Unexpected department data structure:', departmentsData);
        }
      } catch (error) {
        console.error('Error processing department data:', error);
        setDepartments([]);
      }
    }
  }, [departmentsData]);
    
  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    // Filter by specialization
    if (filter.specialization !== 'all' && doctor.specialization !== filter.specialization) {
      return false;
    }
    
    // Filter by search term
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        doctor.firstName.toLowerCase().includes(searchLower) ||
        doctor.lastName.toLowerCase().includes(searchLower) ||
        doctor.email.toLowerCase().includes(searchLower) ||
        doctor.specialization.toLowerCase().includes(searchLower) ||
        doctor.departmentName.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Toggle doctor status
  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await toggleDoctorStatusMutation({ doctorId, active: newStatus });
      
      // Update local state
      setDoctors(prevDoctors => 
        prevDoctors.map(doc => 
          doc.id === doctorId 
            ? { ...doc, active: newStatus } 
            : doc
        )
      );
      
      showAlert('success', `Doctor ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      handleApiError(error, `Failed to ${currentStatus ? 'deactivate' : 'activate'} doctor`);
    }
  };
  
  // Open schedule modal
  const openScheduleModal = (doctor: Doctor) => {
    setDoctorToSchedule(doctor);
    setNewSchedule({
      availableDays: [...doctor.availableDays],
      availableTimeSlots: [...doctor.availableTimeSlots]
    });
    setShowScheduleModal(true);
  };
  
  // Update doctor schedule
  const updateSchedule = async () => {
    if (!doctorToSchedule) return;
    
    // Validate schedule
    if (newSchedule.availableDays.length === 0) {
      showAlert('error', 'Please select at least one available day');
      return;
    }
    
    if (newSchedule.availableTimeSlots.length === 0) {
      showAlert('error', 'Please add at least one time slot');
      return;
    }
    
    // Check for valid time slots
    const invalidTimeSlot = newSchedule.availableTimeSlots.find(slot => 
      !slot.startTime || !slot.endTime || slot.startTime >= slot.endTime
    );
    
    if (invalidTimeSlot) {
      showAlert('error', 'Please ensure all time slots have valid start and end times');
      return;
    }
    
    try {
      await updateDoctorScheduleMutation({
        doctorId: doctorToSchedule.id,
        schedule: newSchedule
      });
      
      // Update local state
      setDoctors(prev => 
        prev.map(doc => 
          doc.id === doctorToSchedule.id 
            ? { 
                ...doc, 
                availableDays: newSchedule.availableDays,
                availableTimeSlots: newSchedule.availableTimeSlots
              } 
            : doc
        )
      );
      
      setShowScheduleModal(false);
      setDoctorToSchedule(null);
      
      showAlert('success', 'Doctor schedule updated successfully');
    } catch (error) {
      handleApiError(error, 'Failed to update doctor schedule');
    }
  };
  
  // Add time slot
  const addTimeSlot = () => {
    setNewSchedule(prev => ({
      ...prev,
      availableTimeSlots: [
        ...prev.availableTimeSlots,
        { startTime: '09:00', endTime: '17:00' }
      ]
    }));
  };
  
  // Remove time slot
  const removeTimeSlot = (index: number) => {
    setNewSchedule(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.filter((_, i) => i !== index)
    }));
  };
  
  // Toggle day selection
  const toggleDay = (day: string) => {
    setNewSchedule(prev => {
      if (prev.availableDays.includes(day)) {
        return {
          ...prev,
          availableDays: prev.availableDays.filter(d => d !== day)
        };
      } else {
        return {
          ...prev,
          availableDays: [...prev.availableDays, day]
        };
      }
    });
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
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Management</h1>
          <p className="text-gray-600">Manage doctors, their departments, and availability</p>
        </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <PermissionGuard permission={Permission.ADD_DOCTOR}>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              onClick={() => navigate('/doctors/create')}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Doctor</span>
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
              refetchDoctors();
              showAlert('info', 'Doctor data has been refreshed');
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
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or specialization..."
              className="pl-10 pr-4 py-2 w-full border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-orange-50 p-4 rounded-lg mt-4 border border-orange-100">
            <h3 className="font-medium text-gray-800 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={filter.department}
                  onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={filter.specialization}
                  onChange={(e) => setFilter({ ...filter, specialization: e.target.value })}
                >
                  <option value="all">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="md:col-span-3">
                <button
                  className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all"
                  onClick={() => setFilter({
                    department: 'all',
                    specialization: 'all',
                    status: 'all',
                    search: ''
                  })}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>      
      {/* Loading State */}
      {(isLoadingDoctors || isLoadingDepartments || isTogglingStatus || isUpdatingSchedule) && (
        <div className="my-4">
          <LoadingSpinner size="large" text="Loading doctor data..." />
        </div>
      )}
        {/* Error State */}
      {doctorsError && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading doctors</p>
          <p className="text-sm">{doctorsError}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            onClick={() => refetchDoctors()}
          >
            Try Again
          </button>
        </div>
      )}
      
      {departmentsError && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading departments</p>
          <p className="text-sm">{departmentsError}</p>
        </div>
      )}
      
      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden hover:shadow-md transition-all">
              {/* Doctor Card Header */}
              <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-orange-500 text-xl font-bold shadow-md">
                  {doctor.firstName[0]}{doctor.lastName[0]}
                </div>
              </div>
              
              {/* Doctor Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 text-center mb-1">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">{doctor.specialization}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 text-sm">Department:</span>
                    <span className="text-gray-800 text-sm flex-1">{doctor.departmentName}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 text-sm">Qualification:</span>
                    <span className="text-gray-800 text-sm flex-1">{doctor.qualification}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 text-sm">Joined:</span>
                    <span className="text-gray-800 text-sm flex-1">{formatDate(doctor.joiningDate)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 text-sm">Status:</span>
                    <StatusBadge active={doctor.active} />
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Days</h4>
                  <div className="flex flex-wrap gap-1">
                    {daysOfWeek.map(day => (
                      <span
                        key={day}
                        className={`text-xs px-2 py-1 rounded-full ${
                          doctor.availableDays.includes(day)
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 px-2 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm flex items-center justify-center gap-1"
                    onClick={() => openScheduleModal(doctor)}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Schedule</span>
                  </button>
                  
                  <PermissionGuard permission={Permission.EDIT_DOCTOR}>
                    <button
                      className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center gap-1"
                      onClick={() => navigate(`/doctors/edit/${doctor.id}`)}
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </PermissionGuard>
                  
                  <PermissionGuard permission={Permission.TOGGLE_DOCTOR_STATUS}>
                    <button
                      className={`flex-1 px-2 py-1.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-1 ${
                        doctor.active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      onClick={() => toggleDoctorStatus(doctor.id, doctor.active)}
                    >
                      {doctor.active ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center">
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No doctors found</h3>
              <p className="text-gray-600">No doctors match your current filter criteria.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Schedule Modal */}
      {showScheduleModal && doctorToSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-orange-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Update Schedule</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setDoctorToSchedule(null);
                  }}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Dr. {doctorToSchedule.firstName} {doctorToSchedule.lastName}
              </h3>
              
              {/* Available Days */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Days</h4>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-sm ${
                        newSchedule.availableDays.includes(day)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Slots */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Time Slots</h4>
                  <button
                    type="button"
                    className="text-sm text-orange-600 hover:text-orange-700"
                    onClick={addTimeSlot}
                  >
                    + Add Time Slot
                  </button>
                </div>
                
                {newSchedule.availableTimeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={slot.startTime}
                        onChange={(e) => {
                          const updatedSlots = [...newSchedule.availableTimeSlots];
                          updatedSlots[index] = { ...slot, startTime: e.target.value };
                          setNewSchedule({ ...newSchedule, availableTimeSlots: updatedSlots });
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">End Time</label>
                      <input
                        type="time"
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={slot.endTime}
                        onChange={(e) => {
                          const updatedSlots = [...newSchedule.availableTimeSlots];
                          updatedSlots[index] = { ...slot, endTime: e.target.value };
                          setNewSchedule({ ...newSchedule, availableTimeSlots: updatedSlots });
                        }}
                      />
                    </div>
                    
                    {newSchedule.availableTimeSlots.length > 1 && (
                      <button
                        type="button"
                        className="mt-6 text-red-600 hover:text-red-700"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setDoctorToSchedule(null);
                  }}
                >
                  Cancel
                </button>
                
                <button
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                  onClick={updateSchedule}
                >
                  Update Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;
