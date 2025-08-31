import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Clipboard, 
  Clock, 
  Edit, 
  Plus,
  Heart,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Permission } from '../utils/rbac';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import { useApiErrorHandling } from '../hooks/useApiErrorHandling';
import PermissionGuard from '../components/PermissionGuard';
import { patientService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { withRetry } from '../utils/retryUtils';

// Interface for patient
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  bloodGroup: string;
  allergies: string[];
  medicalHistory: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  registeredDate: string;
}

// Interface for appointment
interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  date: string;
  timeSlot: string;
  status: 'active' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  diagnosis?: string;
  followUpDate?: string;
}

// Interface for medical record
interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  date: string;
  type: 'consultation' | 'test' | 'procedure';
  title: string;
  description: string;
  diagnosis?: string;
  prescription?: string;
  attachments?: string[];
}

// Interface for service request
interface ServiceRequest {
  id: string;
  patientId: string;
  medicalServiceId: string;
  serviceName: string;
  departmentId: string;
  departmentName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  notes: string;
  results?: string;
}

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'active':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-blue-100 text-blue-800">
          <Calendar className="w-3 h-3" />
          <span>Active</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
          <Calendar className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    case 'no-show':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 text-gray-800">
          <Calendar className="w-3 h-3" />
          <span>No Show</span>
        </span>
      );
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
          <Calendar className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    case 'rejected':
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-red-100 text-red-800">
          <Calendar className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 text-gray-800">
          <Calendar className="w-3 h-3" />
          <span>{status}</span>
        </span>
      );
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

// Format date with time
const formatDateTime = (dateString: string, timeSlot?: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return timeSlot ? `${formattedDate}, ${timeSlot}` : formattedDate;
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const PatientDetail: React.FC = () => {
  // Get the ID parameter from the URL with validation
  const params = useParams();
  // Handle potential undefined ID by using empty string as fallback
  // This ensures we can properly check and validate the ID in the useEffect
  const id = params.id as string || '';
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { trackApiError, hasRecurringErrors, resetErrorTracking } = useApiErrorHandling();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for patient data
  const [patient, setPatient] = useState<Patient | null>(null);
  
  // State for patient appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // State for patient medical records
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  
  // State for patient service requests
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    // State for loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  // Redirect immediately if ID is clearly invalid
  useEffect(() => {
    if (id === 'undefined' || id === 'null') {
      navigate('/patients');
      showAlert('error', 'Invalid patient ID. Redirecting to patients list.');
    }
  }, [id, navigate, showAlert]);
  
  // Fetch patient data from API
  useEffect(() => {
    // Check if id is valid (not undefined, null, or empty string)
    if (!id || id === 'undefined') {
      setError('No patient ID provided or invalid ID');
      setLoading(false);
      return;
    }
    
    // Use a flag to track if the component is still mounted
    let isMounted = true;
      const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch patient details with retry for critical data
        // This will retry up to 2 times with exponential backoff
        const patientResponse = await withRetry(
          () => patientService.getPatientById(id),
          { maxRetries: 2, initialDelay: 500 }
        );
        
        // If component unmounted during the API call, don't update state
        if (!isMounted) return;
        
        // Extract patient data safely, handling different response structures
        let patientData = null;
        if (patientResponse) {
          if (patientResponse.data?.patient) {
            // Standard API response
            patientData = patientResponse.data.patient;
          } else if (patientResponse.patient) {
            // Alternative response structure
            patientData = patientResponse.patient;
          } else if (typeof patientResponse === 'object' && patientResponse.id) {
            // Case where the patient object is directly returned
            patientData = patientResponse;
          }
        }
        
        if (patientData) {
          setPatient(patientData);
        } else {
          throw new Error('Patient data not found or invalid response structure');
        }          // Fetch patient appointments - only if we have a valid patient
          try {
            const appointmentsResponse = await patientService.getPatientAppointments(id);
            
            // If component unmounted during the API call, don't update state
            if (!isMounted) return;
            
            // Extract appointments data safely, handling different response structures
            let appointmentsData: Appointment[] = [];
            if (appointmentsResponse) {
              if (Array.isArray(appointmentsResponse)) {
                // Direct array response
                appointmentsData = appointmentsResponse;
              } else if (appointmentsResponse.data?.appointments && Array.isArray(appointmentsResponse.data.appointments)) {
                // Standard API response
                appointmentsData = appointmentsResponse.data.appointments;
              } else if (appointmentsResponse.appointments && Array.isArray(appointmentsResponse.appointments)) {
                // Alternative response structure
                appointmentsData = appointmentsResponse.appointments;
              } else if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data)) {
                // Case where data array is directly in data property
                appointmentsData = appointmentsResponse.data;
              }
            }
            
            setAppointments(appointmentsData);
          } catch (appointmentErr) {
            console.error('Error fetching patient appointments:', appointmentErr);
            // Track the error with our enhanced error handling
            const appointmentsEndpoint = `/patients/${id}/appointments`;
            trackApiError(appointmentsEndpoint, appointmentErr, 'Failed to load appointments');
            
            // Don't fail the entire patient view just because appointments failed
            setAppointments([]);
          }
            // Fetch patient medical records - only if we have a valid patient
          try {
            const recordsResponse = await patientService.getPatientMedicalRecords(id);
            
            // If component unmounted during the API call, don't update state
            if (!isMounted) return;
            
            // Extract medical records data safely, handling different response structures
            let medicalRecordsData: MedicalRecord[] = [];
            if (recordsResponse) {
              if (Array.isArray(recordsResponse)) {
                // Direct array response
                medicalRecordsData = recordsResponse;
              } else if (recordsResponse.data?.medicalRecords && Array.isArray(recordsResponse.data.medicalRecords)) {
                // Standard API response
                medicalRecordsData = recordsResponse.data.medicalRecords;
              } else if (recordsResponse.medicalRecords && Array.isArray(recordsResponse.medicalRecords)) {
                // Alternative response structure
                medicalRecordsData = recordsResponse.medicalRecords;
              } else if (recordsResponse.data && Array.isArray(recordsResponse.data)) {
                // Case where data array is directly in data property
                medicalRecordsData = recordsResponse.data;
              }
            }
            
            setMedicalRecords(medicalRecordsData);
          } catch (recordsErr) {
            console.error('Error fetching patient medical records:', recordsErr);
            // Track the error with our enhanced error handling
            const recordsEndpoint = `/patients/${id}/medical-records`;
            trackApiError(recordsEndpoint, recordsErr, 'Failed to load medical records');
            
            // Don't fail the entire patient view just because medical records failed
            setMedicalRecords([]);
          }
            // Fetch patient service requests - only if we have a valid patient
          try {
            const requestsResponse = await patientService.getPatientServiceRequests(id);
            
            // If component unmounted during the API call, don't update state
            if (!isMounted) return;
            
            // Extract service requests data safely, handling different response structures
            let serviceRequestsData: ServiceRequest[] = [];
            if (requestsResponse) {
              if (Array.isArray(requestsResponse)) {
                // Direct array response
                serviceRequestsData = requestsResponse;
              } else if (requestsResponse.data?.serviceRequests && Array.isArray(requestsResponse.data.serviceRequests)) {
                // Standard API response
                serviceRequestsData = requestsResponse.data.serviceRequests;
              } else if (requestsResponse.serviceRequests && Array.isArray(requestsResponse.serviceRequests)) {
                // Alternative response structure
                serviceRequestsData = requestsResponse.serviceRequests;
              } else if (requestsResponse.data && Array.isArray(requestsResponse.data)) {
                // Case where data array is directly in data property
                serviceRequestsData = requestsResponse.data;
              }
            }
            
            setServiceRequests(serviceRequestsData);
          } catch (requestsErr) {
            console.error('Error fetching patient service requests:', requestsErr);
            // Track the error with our enhanced error handling
            const requestsEndpoint = `/patients/${id}/service-requests`;
            trackApiError(requestsEndpoint, requestsErr, 'Failed to load service requests');
            
            // Don't fail the entire patient view just because service requests failed
            setServiceRequests([]);
          }} catch (error) {
        console.error('Error fetching patient data:', error);
        
        // If component unmounted during the API call, don't update state
        if (!isMounted) return;
        
        // Track the error with our enhanced error handling
        const endpoint = `/patients/${id}`;
        trackApiError(endpoint, error, 'Failed to load patient information');
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load patient data: ${errorMessage}`);
        
        // Clear related data when patient fetch fails
        setPatient(null);
        setAppointments([]);
        setMedicalRecords([]);
        setServiceRequests([]);
      } finally {
        // If component unmounted during the API call, don't update state
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
      // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      
      // Reset error tracking for this patient's endpoints to avoid lingering error states
      resetErrorTracking(`/patients/${id}`);
      resetErrorTracking(`/patients/${id}/appointments`);
      resetErrorTracking(`/patients/${id}/medical-records`);
      resetErrorTracking(`/patients/${id}/service-requests`);
    };
  }, [id, showAlert, trackApiError, resetErrorTracking]); // Only re-run if these dependencies change
    // Render loading state
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading patient information...</p>
        </div>
      </div>
    );
  }
    // Render error state if there's an error or patient not found
  if (error || !patient) {
    const patientEndpoint = `/patients/${id}`;
    const hasRepeatedErrors = hasRecurringErrors(patientEndpoint);
    
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error ? 'Error Loading Patient' : 'Patient Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The patient you are looking for does not exist or has been removed.'}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              onClick={() => navigate('/patients')}
            >
              Back to Patients
            </button>
            
            <button
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              onClick={() => {
                resetErrorTracking(patientEndpoint);
                setError(null);
                setLoading(true);
                // Force rerun of the useEffect
                const fetchData = async () => {
                  try {
                    const patientResponse = await withRetry(
                      () => patientService.getPatientById(id),
                      { maxRetries: 2, initialDelay: 500 }
                    );
                    
                    let patientData = null;
                    if (patientResponse) {
                      if (patientResponse.data?.patient) {
                        patientData = patientResponse.data.patient;
                      } else if (patientResponse.patient) {
                        patientData = patientResponse.patient;
                      } else if (typeof patientResponse === 'object' && patientResponse.id) {
                        patientData = patientResponse;
                      }
                    }
                    
                    if (patientData) {
                      setPatient(patientData);
                      setLoading(false);
                    } else {
                      throw new Error('Patient data not found');
                    }
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    setError(`Failed to load patient data: ${errorMessage}`);
                    trackApiError(patientEndpoint, error, 'Failed to reload patient information');
                    setLoading(false);
                  }
                };
                fetchData();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
          
          {hasRepeatedErrors && (
            <p className="mt-6 text-sm text-orange-600">
              Multiple errors detected. The server may be experiencing issues. Please try again later.
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
          onClick={() => navigate('/patients')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Patients</span>
        </button>
      </div>
      
      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
              {patient.firstName?.[0] || '?'}{patient.lastName?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {patient.firstName || 'Unknown'} {patient.lastName || ''}
              </h1>
              <div className="flex items-center mt-1 text-gray-600 text-sm">
                <User className="h-4 w-4 mr-1" />
                <span>{patient.gender || 'Unknown'}, {patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : '?'} years</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>DOB: {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Unknown'}</span>
                <span className="mx-2">•</span>
                <Heart className="h-4 w-4 mr-1" />
                <span>Blood: {patient.bloodGroup || 'Unknown'}</span>
              </div>
            </div>
          </div>
            <div className="mt-4 md:mt-0 flex gap-2">            <PermissionGuard permission={Permission.EDIT_PATIENT}>
              <button
                className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                onClick={() => navigate(`/patients/edit/${patient.id}`)}
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              {/* Note: When implementing the edit functionality, ensure that last visited date remains view-only */}
            </PermissionGuard>
              <PermissionGuard permission={Permission.ADD_APPOINTMENT}>
              <button
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                onClick={() => navigate(`/appointments/create?patientId=${patient.id}`)}
              >
                <Plus className="w-4 h-4" />
                <span>New Appointment</span>
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-orange-200 mb-6">
        <nav className="flex space-x-8">
          <button
            className={`py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          
          <button
            className={`py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'appointments'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          
          <button
            className={`py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'medicalRecords'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('medicalRecords')}
          >
            Medical Records
          </button>
          
          <button
            className={`py-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'serviceRequests'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('serviceRequests')}
          >
            Service Requests
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-gray-800">{patient.firstName} {patient.lastName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-gray-800">{formatDate(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)} years)</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-gray-800">{patient.gender}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-gray-800">{patient.email}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-gray-800">{patient.phone}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="flex">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-1 flex-shrink-0" />
                    <p className="text-gray-800">{patient.address}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Registered Date</p>
                  <p className="text-gray-800">{formatDate(patient.registeredDate)}</p>
                </div>
              </div>
            </div>
            
            {/* Medical Information */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical Information</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="text-gray-800">{patient.bloodGroup}</p>
                </div>
                  <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-800">No known allergies</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Medical History</p>
                  <p className="text-gray-800 whitespace-pre-line">{patient.medicalHistory || 'No medical history recorded'}</p>
                </div>
              </div>
            </div>
            
            {/* Emergency Contact */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-800">{patient.emergencyContact?.name || 'Not provided'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Relationship</p>
                  <p className="text-gray-800">{patient.emergencyContact?.relationship || 'Not provided'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-gray-800">{patient.emergencyContact?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Appointments</h3>
                <button
                  className="text-sm text-orange-600 hover:text-orange-700"
                  onClick={() => setActiveTab('appointments')}
                >
                  View All
                </button>
              </div>
              
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map(appointment => (
                    <div key={appointment.id} className="border border-orange-100 rounded-lg p-4 hover:bg-orange-50 transition-colors">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{appointment.departmentName}</p>
                          <p className="text-sm text-gray-600 mt-1">{appointment.doctorName}</p>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDateTime(appointment.date, appointment.timeSlot)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <Clipboard className="h-4 w-4 inline mr-1" />
                          {appointment.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-6">No appointment records found.</p>
              )}
            </div>
            
            {/* Recent Medical Records */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Medical Records</h3>
                <button
                  className="text-sm text-orange-600 hover:text-orange-700"
                  onClick={() => setActiveTab('medicalRecords')}
                >
                  View All
                </button>
              </div>
              
              {medicalRecords.length > 0 ? (
                <div className="space-y-4">
                  {medicalRecords.slice(0, 2).map(record => (
                    <div key={record.id} className="border border-orange-100 rounded-lg p-4 hover:bg-orange-50 transition-colors">
                      <div className="flex justify-between">
                        <p className="font-medium text-gray-800">{record.title}</p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                          {record.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{record.departmentName} • {record.doctorName}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(record.date)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-6">No medical records found.</p>
              )}
            </div>
          </div>
        )}
        
        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">            <div className="p-6 border-b border-orange-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Appointment History</h3>
                <PermissionGuard permission={Permission.ADD_APPOINTMENT}>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={() => navigate(`/appointments/create?patientId=${patient.id}`)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Appointment</span>
                  </button>
                </PermissionGuard>
              </div>
            </div>
            
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-orange-200">
                  <thead className="bg-orange-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Reason
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-orange-100">
                    {appointments.map(appointment => (
                      <tr key={appointment.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{formatDate(appointment.date)}</div>
                          <div className="text-xs text-gray-500">{appointment.timeSlot}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{appointment.departmentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{appointment.doctorName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">{appointment.reason}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                            onClick={() => navigate(`/appointments/${appointment.id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-600">No appointment records found for this patient.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Medical Records Tab */}
        {activeTab === 'medicalRecords' && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">            <div className="p-6 border-b border-orange-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Medical Records</h3>
                <PermissionGuard permission={Permission.ADD_MEDICAL_RECORD}>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={() => navigate(`/medical-records/create?patientId=${patient.id}`)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Record</span>
                  </button>
                </PermissionGuard>
              </div>
            </div>
            
            {medicalRecords.length > 0 ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicalRecords.map(record => (
                  <div key={record.id} className="border border-orange-100 rounded-lg p-4 hover:bg-orange-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{record.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {record.departmentName} • {record.doctorName}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                        {record.type}
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(record.date)}
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-sm text-gray-800 mt-1">{record.description}</p>
                    </div>
                    
                    {record.diagnosis && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                        <p className="text-sm text-gray-800 mt-1">{record.diagnosis}</p>
                      </div>
                    )}
                    
                    {record.prescription && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Prescription</p>
                        <p className="text-sm text-gray-800 mt-1">{record.prescription}</p>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button 
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                        onClick={() => navigate(`/medical-records/${record.id}`)}
                      >
                        View Full Record
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-600">No medical records found for this patient.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Service Requests Tab */}
        {activeTab === 'serviceRequests' && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">            <div className="p-6 border-b border-orange-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Service Requests</h3>
                <PermissionGuard permission={Permission.ADD_SERVICE_REQUEST}>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={() => navigate(`/service-requests/create?patientId=${patient.id}`)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Service Request</span>
                  </button>
                </PermissionGuard>
              </div>
            </div>
            
            {serviceRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-orange-200">
                  <thead className="bg-orange-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Service
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Requested By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Requested At
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
                    {serviceRequests.map(request => (
                      <tr key={request.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{request.serviceName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{request.departmentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{request.requestedByName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{formatDateTime(request.requestedAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            request.priority === 'emergency' 
                              ? 'bg-red-100 text-red-800' 
                              : request.priority === 'urgent'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                            onClick={() => navigate(`/service-requests/${request.id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-600">No service requests found for this patient.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
