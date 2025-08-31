import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';
import { Permission, hasPermission } from '../utils/rbac';
import { RootState } from '../store/store';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import { useMedicalData } from '../hooks/useMedicalData';
import { appointmentService } from '../services/api';
import { Patient, AppointmentFormData, Doctor } from '../types/models';

// Import components
import PatientSearch from '../components/appointment/PatientSearch';
import PatientRegistration from '../components/appointment/PatientRegistration';
import AppointmentForm from '../components/appointment/AppointmentForm';

const AppointmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { user } = useAppSelector((state: RootState) => state.auth);
    
  // Custom hook for medical data (departments and doctors)
  const { departments, doctors, filteredDoctors, isLoading: isLoadingData, filterDoctorsByDepartment } = useMedicalData();
  
  // Check permissions
  const canAddAppointment = hasPermission(user, Permission.ADD_APPOINTMENT);
  
  // State variables
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'search' | 'register' | 'appointment'>('search');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Get current date in IST format (YYYY-MM-DD)
  const currentDate = new Date().toLocaleDateString('en-CA'); // en-CA format gives YYYY-MM-DD
  
  const [appointmentData, setAppointmentData] = useState<AppointmentFormData>({
    departmentId: '',
    doctorId: '',
    appointmentDate: currentDate,
    reason: ''
  });  // Update filtered doctors when department changes
  useEffect(() => {
    console.log('Department changed in AppointmentCreate:', appointmentData.departmentId);
    
    // Only filter if we have a department ID
    if (appointmentData.departmentId) {
      // Validate MongoDB ID format
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(appointmentData.departmentId);
      console.log('Department ID is valid MongoDB format:', isValidMongoId);
      
      if (!isValidMongoId) {
        console.warn('Department ID is not in valid MongoDB format, trying to find matching department');
        
        // Try to find the department in our departments list
        const matchingDept = departments.find(dept => {
          // Check different ways this could match
          return (
            dept.id === appointmentData.departmentId || 
            dept.name === appointmentData.departmentId ||
            dept.name.toLowerCase() === appointmentData.departmentId.toLowerCase()
          );
        });
        
        if (matchingDept) {
          console.log('Found matching department:', matchingDept);
          
          // Use the matched department's ID which should be valid
          if (matchingDept.id !== appointmentData.departmentId) {
            console.log('Updating appointment data with correct department ID:', matchingDept.id);
            // Update the appointment data with the correct ID
            setAppointmentData(prev => ({ 
              ...prev, 
              departmentId: matchingDept.id,
              doctorId: '' // Reset doctor selection for consistency
            }));
            return; // The useEffect will be triggered again with the updated departmentId
          }
          
          // If IDs match but format is invalid, still attempt to filter
          filterDoctorsByDepartment(matchingDept.id)
            .then((filtered: Doctor[]) => {
              console.log('Filtered doctors result (from matched department):', filtered.length);
              
              // Reset doctor selection if selected doctor is not in filtered list
              if (appointmentData.doctorId && filtered.length > 0 && 
                  !filtered.some((d: Doctor) => d.id === appointmentData.doctorId)) {
                console.log('Resetting doctor selection as current selection is not available in this department');
                setAppointmentData(prev => ({ ...prev, doctorId: '' }));
              }
            })
            .catch((error: Error | unknown) => {
              console.error('Error filtering doctors:', error);
              setAppointmentData(prev => ({ ...prev, doctorId: '' }));
            });
          return;
        } else {
          console.warn('Could not find matching department for ID:', appointmentData.departmentId);
        }
      }
      
      // Normal flow with valid MongoDB ID or fallback if we couldn't find a match
      console.log('Filtering doctors with department ID:', appointmentData.departmentId);
      
      // Filter the doctors by department - this is now async
      filterDoctorsByDepartment(appointmentData.departmentId)
        .then((filtered: Doctor[]) => {
          console.log('Filtered doctors result:', filtered.length);
          
          // Reset doctor selection if selected doctor is not in filtered list
          if (appointmentData.doctorId && filtered.length > 0 && 
              !filtered.some((d: Doctor) => d.id === appointmentData.doctorId)) {
            console.log('Resetting doctor selection as current selection is not available in this department');
            setAppointmentData(prev => ({ ...prev, doctorId: '' }));
          }
        })
        .catch((error: Error | unknown) => {
          console.error('Error filtering doctors:', error);
          setAppointmentData(prev => ({ ...prev, doctorId: '' }));
        });
    } else {
      // Clear filtered doctors if no department is selected
      setAppointmentData(prev => ({ ...prev, doctorId: '' }));
    }
  }, [appointmentData.departmentId, doctors, filterDoctorsByDepartment, departments]);
  
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('appointment');
  };
  
  const handlePatientCreate = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('appointment');
  };  const handleAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for department changes
    if (name === 'departmentId') {
      console.log('Department selection changed to:', value);
      console.log('Department data type:', typeof value);
      
      // Find the department object by ID to ensure we have the correct ID format
      const selectedDepartment = departments.find(dept => dept.id === value);
      console.log('Found department object:', selectedDepartment);
      
      if (!selectedDepartment) {
        console.warn('Could not find department with ID:', value);
        // Try finding by name as fallback
        const departmentByName = departments.find(dept => 
          dept.name === value || 
          dept.name.toLowerCase() === value.toLowerCase()
        );
        
        if (departmentByName) {
          console.log('Found department by name instead:', departmentByName);
          
          // Reset doctor selection when department changes and use valid ID
          setAppointmentData(prev => ({ 
            ...prev, 
            [name]: departmentByName.id, // Use the correct ID from the found department
            doctorId: '' // Reset doctor when department changes
          }));
          
          // Call filterDoctorsByDepartment with the correct ID
          if (departmentByName.id) {
            console.log('Filtering doctors using department ID from found department:', departmentByName.id);
            filterDoctorsByDepartment(departmentByName.id)
              .then((filtered: Doctor[]) => {
                console.log(`Found ${filtered.length} doctors for department`);
              })
              .catch((err: Error | unknown) => {
                console.error('Error filtering doctors:', err);
              });
          }
          return;
        }
      }
      
      // We have a valid department, use its ID
      const departmentId = selectedDepartment ? selectedDepartment.id : value;
      
      // Validate MongoDB ID format
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(departmentId);
      console.log('Department ID is valid MongoDB format:', isValidMongoId);
      
      if (!isValidMongoId) {
        console.warn('Department ID is not in valid MongoDB format:', departmentId);
      }
      
      // Reset doctor selection when department changes
      setAppointmentData(prev => ({ 
        ...prev, 
        [name]: departmentId,
        doctorId: '' // Reset doctor when department changes
      }));
      
      // Immediately filter doctors for the selected department
      if (departmentId) {
        console.log('Filtering doctors for newly selected department ID:', departmentId);
        console.log('Department list:', departments.map((d) => ({ id: d.id, name: d.name })));
        
        // The filterDoctorsByDepartment function is now async
        filterDoctorsByDepartment(departmentId)
          .then((filtered: Doctor[]) => {
            console.log(`Found ${filtered.length} doctors for department`);
          })
          .catch((err: Error | unknown) => {
            console.error('Error filtering doctors:', err);
          });
      }
    } else {
      // Normal handling for other fields
      setAppointmentData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      showAlert('error', 'Please select a patient first');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare appointment data for API
      const payload = {
        patientId: selectedPatient.id,
        doctorId: appointmentData.doctorId,
        departmentId: appointmentData.departmentId,
        appointmentDate: appointmentData.appointmentDate,
        reason: appointmentData.reason,
        // For simplicity, assuming the time is the current time
        appointmentTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      };
      
      // Check if this is a new patient (has temporary ID)
      if (selectedPatient.id.startsWith('new-')) {
        // Use registerAndBook endpoint to create patient and appointment in one call
        await appointmentService.registerAndBook(
          selectedPatient,
          payload
        );
      } else {
        // Use regular appointment creation for existing patients
        await appointmentService.createAppointment(payload);
      }
      
      showAlert('success', 'Appointment booked successfully');
      navigate('/appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      showAlert('error', 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If user doesn't have permission to add appointments
  if (!canAddAppointment) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
        <p className="text-gray-700">
          You don't have permission to book appointments. Please contact an administrator
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
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/appointments')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Book New Appointment</h1>
      </div>
      
      {/* Patient selection or registration */}
      {step === 'search' && (
        <PatientSearch
          onPatientSelect={handlePatientSelect}
          onRegisterNew={() => setStep('register')}
        />
      )}
      
      {step === 'register' && (
        <PatientRegistration
          onPatientCreate={handlePatientCreate}
          onCancel={() => setStep('search')}
        />
      )}
      
      {/* Appointment form */}
      {step === 'appointment' && selectedPatient && (
        <>
          {console.log('Appointment form props - departments:', departments.map(d => ({ id: d.id, name: d.name })))}
          <AppointmentForm
            selectedPatient={selectedPatient}
            departments={departments}
            doctors={doctors}
            filteredDoctors={filteredDoctors}
            appointmentData={appointmentData}
            handleAppointmentChange={handleAppointmentChange}
            handleSubmit={handleSubmit}
            isLoading={isSubmitting}
            isLoadingData={isLoadingData}
            onCancel={() => navigate('/appointments')}
          />
        </>
      )}
    </div>
  );
};

export default AppointmentCreate;
