import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Calendar, CheckCircle, XCircle, Edit, Trash, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Interface for grouped doctors
interface DoctorsByDepartment {
  [departmentId: string]: {
    departmentName: string;
    doctors: Doctor[];
  };
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

const DoctorManagement: React.FC = (): React.ReactNode => {
  const navigate = useNavigate();
  const location = useLocation();
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
  
  // Debounced filter to prevent too many API calls
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  
  // Track if this is the first render
  const isFirstRender = React.useRef(true);
  
  // Set up debounce effect for filter changes
  useEffect(() => {
    // Skip the first render to prevent immediate API call on component mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    console.log("Filter changed, debouncing...");
    const timer = setTimeout(() => {
      console.log("Debounce complete, updating filter:", filter);
      setDebouncedFilter(filter);
    }, 500); // 500ms debounce delay
    
    return () => {
      console.log("Clearing previous debounce timer");
      clearTimeout(timer);
    };
  }, [filter]);
  
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
  });  // Create a memoized function for fetching doctors to prevent unnecessary re-renders
  const fetchDoctors = React.useCallback(() => {
    console.log("Fetching doctors with filter:", debouncedFilter);
    
    // If department is specified, use the getDoctorsByDepartment endpoint
    if (debouncedFilter.department !== 'all') {
      console.log(`Fetching doctors for department: ${debouncedFilter.department}`);
      return departmentService.getDepartmentDoctors(
        debouncedFilter.department,
        debouncedFilter.status !== 'inactive'
      );
    }
    
    // Otherwise, fetch all doctors
    return doctorService.getAllDoctors(
      debouncedFilter.status !== 'inactive', 
      undefined
    );
  }, [debouncedFilter.status, debouncedFilter.department]);
  
  // Fetch doctors with API hook
  const { 
    data: doctorsData, 
    isLoading: isLoadingDoctors, 
    error: doctorsError,
    refetch: refetchDoctors
  } = useApiQuery(fetchDoctors, [fetchDoctors]);
    // Create a stable reference to the department fetch function
  const fetchDepartments = React.useCallback(() => {
    return departmentService.getAllDepartments(true);
  }, []);
  
  // Fetch departments with API hook
  const {
    data: departmentsData,
    isLoading: isLoadingDepartments,
    error: departmentsError
  } = useApiQuery(
    fetchDepartments,
    [fetchDepartments] // Using the stable callback
  );
  // Toggle doctor status mutation
  const {
    mutate: updateDoctorStatus,
    isLoading: isTogglingStatus
  } = useApiMutation(
    ({ doctorId, active }: { doctorId: string; active: boolean }) => 
      doctorService.setDoctorStatus(doctorId, active)
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
  );  // State for doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // State for departments - MOVED UP to fix reference error
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Check for refresh parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('refresh') === 'true') {
      console.log('Refresh parameter detected, refetching doctors...');
      refetchDoctors();
      
      // Remove the refresh parameter from the URL to prevent multiple refreshes
      navigate('/doctors', { replace: true });
    }
  }, [location.search, navigate, refetchDoctors]);
    // Effect to update doctors when API data changes
  useEffect(() => {
    try {
      if (!doctorsData) {
        console.log('No doctors data available');
        setDoctors([]);
        setSpecializations([]);
        return;
      }
      
      console.log('Processing doctors data:', doctorsData);
      let rawDoctorsList: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(doctorsData)) {
        rawDoctorsList = doctorsData;
      } else if (doctorsData.data && Array.isArray(doctorsData.data)) {
        rawDoctorsList = doctorsData.data;
      } else if (doctorsData.data && doctorsData.data.doctors && Array.isArray(doctorsData.data.doctors)) {
        rawDoctorsList = doctorsData.data.doctors;      } else if (doctorsData && 'doctors' in doctorsData && Array.isArray(doctorsData.doctors)) {
        rawDoctorsList = doctorsData.doctors;
      } else {
        console.error('Unexpected doctor data structure:', doctorsData);
        rawDoctorsList = [];
      }
      
      console.log('Raw doctors list:', rawDoctorsList);
      
      // Transform doctors data to match the expected Doctor interface
      const doctorsList: Doctor[] = rawDoctorsList
        .filter(doc => doc && typeof doc === 'object')
        .map(doc => {
          // Extract ID, handling different ID formats (_id, id)
          const id = doc._id || doc.id || '';
          
          // Handle firstName, lastName (could be in user object or directly in doctor)
          let firstName = doc.firstName || '';
          let lastName = doc.lastName || '';
          let email = doc.email || '';
          
          if (doc.userId && typeof doc.userId === 'object') {
            firstName = firstName || doc.userId.firstName || '';
            lastName = lastName || doc.userId.lastName || '';
            email = email || doc.userId.email || '';
          }          // Extract department information
          let departmentId = '';
          let departmentName = 'Unknown Department';
          
          if (doc.departmentId) {
            if (typeof doc.departmentId === 'object') {
              // Department is populated as an object
              departmentId = doc.departmentId._id || doc.departmentId.id || '';
              departmentName = doc.departmentId.name || 'Unknown Department';
            } else {              // Department is just an ID string
              departmentId = doc.departmentId;
              
              // Try to find department name from departments list
              const department = departments.find(dept => {
                const deptId = dept.id;
                // Handle different ID formats by converting to string
                return deptId === departmentId;
              });
              
              if (department) {
                departmentName = department.name;
                console.log(`Found department ${departmentName} for doctor ${firstName} ${lastName}`);
              } else {
                console.warn(`No department found for doctor ${firstName} ${lastName} with departmentId ${departmentId}`);
              }
            }
          } else {
            console.warn(`Doctor ${firstName} ${lastName} has no departmentId`);
          }
          
          // Extract specialization (could be a string or first item in specializations array)
          let specialization = '';
          if (doc.specialization) {
            specialization = doc.specialization;
          } else if (doc.specializations && Array.isArray(doc.specializations) && doc.specializations.length > 0) {
            specialization = doc.specializations[0];
          }
          
          // Extract qualification (could be a string or first item in qualifications array)
          let qualification = '';
          if (doc.qualification) {
            qualification = doc.qualification;
          } else if (doc.qualifications && Array.isArray(doc.qualifications) && doc.qualifications.length > 0) {
            qualification = doc.qualifications[0];
          }
            // Handle availability (convert from backend format to frontend format)
          let availableDays: string[] = [];
          let availableTimeSlots: {startTime: string; endTime: string}[] = [];
          
          if (doc.availability && Array.isArray(doc.availability)) {            // Extract unique days
            const daysSet = new Set<string>();
            doc.availability.forEach((slot: any) => {
              if (slot.day && typeof slot.day === 'string') {
                daysSet.add(slot.day);
              }
            });
            availableDays = Array.from(daysSet);
            
            // Extract unique time slots
            const uniqueTimeSlots = new Map();
            doc.availability.forEach((slot: any) => {
              const key = `${slot.startTime}-${slot.endTime}`;
              if (!uniqueTimeSlots.has(key)) {
                uniqueTimeSlots.set(key, {
                  startTime: slot.startTime,
                  endTime: slot.endTime
                });
              }
            });
            availableTimeSlots = Array.from(uniqueTimeSlots.values());
          }
          
          // Ensure at least one time slot exists
          if (availableTimeSlots.length === 0) {
            availableTimeSlots = [{ startTime: '09:00', endTime: '17:00' }];
          }
          
          // Return formatted doctor object
          return {
            id,
            firstName,
            lastName,
            email,
            phone: doc.phone || '',
            departmentId,
            departmentName,
            specialization,
            qualification,
            licenseNumber: doc.licenseNumber || '',
            active: doc.active !== false, // Default to active if not specified
            joiningDate: doc.createdAt || new Date().toISOString(),
            availableDays,
            availableTimeSlots,
            profileImage: doc.profileImage || undefined
          };
        })
        .filter(doc => {
          // Final validation of essential properties
          if (!doc.id || !doc.firstName || !doc.lastName) {
            console.warn('Filtered out doctor with missing essential fields:', doc);
            return false;
          }
          return true;
        });
      
      console.log(`Processed ${doctorsList.length} valid doctors:`, doctorsList);
      setDoctors(doctorsList);
      
      // Extract unique specializations
      if (doctorsList.length > 0) {
        const allSpecializations = doctorsList
          .map((doc: Doctor) => doc.specialization)
          .filter(spec => spec); // Filter out undefined/null/empty specializations
        
        if (allSpecializations.length > 0) {
          const uniqueSpecializations = [...new Set(allSpecializations)];
          console.log('Extracted specializations:', uniqueSpecializations);
          setSpecializations(uniqueSpecializations as string[]);
        }
      }
    } catch (error) {
      console.error('Error processing doctor data:', error);
      setDoctors([]);
      setSpecializations([]);
    }
  }, [doctorsData, departments]);  // Effect to update departments when API data changes
  useEffect(() => {
    try {
      if (!departmentsData) {
        console.log('No departments data available');
        setDepartments([]);
        return;
      }
      
      console.log('Processing departments data:', departmentsData);
      let departmentsList: Department[] = [];
      
      // Handle different response structures
      if (Array.isArray(departmentsData)) {
        departmentsList = departmentsData;
      } else if (departmentsData.data && Array.isArray(departmentsData.data)) {
        departmentsList = departmentsData.data;
      } else if (departmentsData.data && departmentsData.data.departments && Array.isArray(departmentsData.data.departments)) {
        departmentsList = departmentsData.data.departments;
      } else if (departmentsData && 'departments' in departmentsData && Array.isArray(departmentsData.departments)) {
        departmentsList = departmentsData.departments;
      } else if (departmentsData && 'normalizedDepartments' in departmentsData && Array.isArray(departmentsData.normalizedDepartments)) {
        departmentsList = departmentsData.normalizedDepartments;
      } else {
        console.error('Unexpected department data structure:', departmentsData);
        departmentsList = [];
      }      // Ensure departments have consistent id format
      departmentsList = departmentsList.map(dept => {
        // Handle case where department has _id but no id
        const anyDept = dept as any; // Type assertion to safely access _id
        if (!dept.id && anyDept._id) {
          return {
            ...dept,
            id: anyDept._id
          };
        }
        return dept;
      });
      
      console.log(`Processed ${departmentsList.length} departments with IDs:`, departmentsList.map(d => d.id).join(', '));
      setDepartments(departmentsList);
    } catch (error) {
      console.error('Error processing department data:', error);
      setDepartments([]);
    }
  }, [departmentsData]);
      // Filter doctors using useMemo to prevent unnecessary recalculations
  const filteredDoctors = React.useMemo(() => {
    console.log(`Filtering ${doctors.length} doctors with filter:`, filter);
    
    return doctors.filter(doctor => {
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
  }, [doctors, filter.specialization, filter.search]);
  
  // Group doctors by department
  const doctorsByDepartment: DoctorsByDepartment = React.useMemo(() => {
    const grouped: DoctorsByDepartment = {};
    
    filteredDoctors.forEach(doctor => {
      if (!grouped[doctor.departmentId]) {
        grouped[doctor.departmentId] = {
          departmentName: doctor.departmentName,
          doctors: []
        };
      }
      
      grouped[doctor.departmentId].doctors.push(doctor);
    });
    
    return grouped;
  }, [filteredDoctors]);
  
  // Calculate department statistics
  const departmentStats = React.useMemo(() => {
    const stats: Record<string, { total: number; active: number; departmentName: string }> = {};
    
    departments.forEach(dept => {
      stats[dept.id] = {
        total: 0,
        active: 0,
        departmentName: dept.name
      };
    });
    
    doctors.forEach(doctor => {
      if (stats[doctor.departmentId]) {
        stats[doctor.departmentId].total += 1;
        if (doctor.active) {
          stats[doctor.departmentId].active += 1;
        }
      }
    });
    
    return stats;
  }, [doctors, departments]);  // Toggle doctor status
  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateDoctorStatus({ doctorId, active: newStatus });
      
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
  
  // State for showing reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  
  // State for doctor to reassign
  const [doctorToReassign, setDoctorToReassign] = useState<Doctor | null>(null);
  
  // State for new department
  const [newDepartmentId, setNewDepartmentId] = useState<string>('');
  
  // Open reassign modal
  const openReassignModal = (doctor: Doctor) => {
    setDoctorToReassign(doctor);
    setNewDepartmentId('');
    setShowReassignModal(true);
  };
  
  // Handle reassign
  const handleReassign = async () => {
    if (!doctorToReassign || !newDepartmentId) {
      showAlert('error', 'Please select a department');
      return;
    }
    
    try {
      await doctorService.reassignDoctor(doctorToReassign.id, newDepartmentId);
      
      // Get the new department name
      const newDepartment = departments.find(dept => dept.id === newDepartmentId);
      
      // Update local state
      setDoctors(prevDoctors => 
        prevDoctors.map(doc => 
          doc.id === doctorToReassign.id 
            ? { 
                ...doc, 
                departmentId: newDepartmentId,
                departmentName: newDepartment?.name || 'Unknown Department'
              } 
            : doc
        )
      );
      
      setShowReassignModal(false);
      setDoctorToReassign(null);
      
      showAlert('success', 'Doctor reassigned to new department successfully');
    } catch (error) {
      handleApiError(error, 'Failed to reassign doctor to new department');
    }
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
          </button>      </div>
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
      </div>        {/* Loading State */}
      {(isLoadingDoctors || isLoadingDepartments || isTogglingStatus || isUpdatingSchedule) && (
        <div className="my-4">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="large" text="Loading doctor data..." />
            
            {/* Add a counter to track long loading times */}
            <div className="mt-4 text-gray-600">
              <div className="flex justify-center mt-2">
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={() => {
                    setDoctors([]);
                    showAlert('info', 'Loading cancelled. You can try refreshing again.');
                    // Force loading state to false
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                >
                  Cancel Loading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        
      {/* Error State - Only show one instance of each error */}
      {doctorsError && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading doctors</p>
          <p className="text-sm">{doctorsError}</p>
          <div className="flex gap-2 mt-2">
            <button 
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              onClick={() => refetchDoctors()}
            >
              Try Again
            </button>
            <button
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              onClick={() => {
                // Reset error state and show doctors if any
                setDoctors([]);
                setFilter({
                  department: 'all',
                  specialization: 'all',
                  status: 'all',
                  search: ''
                });
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      
      {departmentsError && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading departments</p>
          <p className="text-sm">{departmentsError}</p>
        </div>
      )}
      
      {/* Department Statistics */}
      {filter.department === 'all' && filter.status === 'all' && filter.search === '' && Object.keys(departmentStats).length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-orange-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Doctors by Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.keys(departmentStats).map(deptId => (
              <div key={deptId} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <h4 className="font-medium text-gray-800">{departmentStats[deptId].departmentName}</h4>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Total: {departmentStats[deptId].total}</span>
                  <span className="text-sm text-green-600">Active: {departmentStats[deptId].active}</span>
                </div>
                <button 
                  className="w-full mt-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  onClick={() => setFilter({...filter, department: deptId})}
                >
                  View Doctors
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.keys(doctorsByDepartment).length > 0 ? (
          Object.keys(doctorsByDepartment).map(departmentId => (
            <div key={departmentId} className="col-span-full">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{doctorsByDepartment[departmentId].departmentName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {doctorsByDepartment[departmentId].doctors.map(doctor => (
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
                        
                        <PermissionGuard permission={Permission.REASSIGN_DOCTOR}>
                          <button
                            className="flex-1 px-2 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm flex items-center justify-center gap-1"
                            onClick={() => openReassignModal(doctor)}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reassign</span>
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
                ))}
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
      
      {/* Reassign Modal */}
      {showReassignModal && doctorToReassign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-purple-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Reassign Doctor</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowReassignModal(false);
                    setDoctorToReassign(null);
                  }}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Dr. {doctorToReassign.firstName} {doctorToReassign.lastName}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Department: <span className="font-medium">{doctorToReassign.departmentName}</span></p>
                
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select New Department
                </label>
                
                <select
                  value={newDepartmentId}
                  onChange={(e) => setNewDepartmentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a department</option>
                  {departments
                    .filter(dept => dept.id !== doctorToReassign.departmentId)
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))
                  }
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => {
                    setShowReassignModal(false);
                    setDoctorToReassign(null);
                  }}
                >
                  Cancel
                </button>
                
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  disabled={!newDepartmentId}
                  onClick={handleReassign}
                >
                  Reassign
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
