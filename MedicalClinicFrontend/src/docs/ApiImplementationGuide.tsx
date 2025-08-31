import React from 'react';
import { useNavigate } from 'react-router-dom';

// This file provides instructions for connecting the frontend components to the backend API

/**
 * How to implement API connections for ServiceRequestManagement.tsx:
 * 
 * 1. Import the API services:
 *    ```tsx
 *    import { serviceRequestService, departmentService } from '../services/api';
 *    ```
 * 
 * 2. Replace the mock data fetching with API calls:
 *    ```tsx
 *    // Fetch service requests
 *    const fetchServiceRequests = async () => {
 *      setIsLoading(true);
 *      setError(null);
 *      
 *      try {
 *        const apiFilters: { status?: string; priority?: string; departmentId?: string } = {};
 *        
 *        if (filter.status !== 'all') apiFilters.status = filter.status;
 *        if (filter.priority !== 'all') apiFilters.priority = filter.priority;
 *        if (filter.department !== 'all') apiFilters.departmentId = filter.department;
 *        
 *        const response = await serviceRequestService.getAllRequests(
 *          pagination.currentPage,
 *          pagination.limit,
 *          apiFilters
 *        );
 *        
 *        setServiceRequests(response.requests);
 *        setPagination({
 *          currentPage: response.pagination.page,
 *          totalPages: response.pagination.totalPages,
 *          totalItems: response.pagination.total,
 *          limit: response.pagination.limit
 *        });
 *      } catch (err) {
 *        console.error('Failed to fetch service requests:', err);
 *        setError('Failed to load service requests. Please try again later.');
 *        showAlert('error', 'Failed to load service requests');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 * 
 * 3. Implement department fetching:
 *    ```tsx
 *    // Fetch departments for filter
 *    const fetchDepartments = async () => {
 *      try {
 *        const departments = await departmentService.getAllDepartments(true);
 *        setDepartments(departments);
 *      } catch (err) {
 *        console.error('Failed to fetch departments:', err);
 *        showAlert('error', 'Failed to load departments for filtering');
 *      }
 *    };
 *    ```
 * 
 * 4. Implement approval/rejection/completion functions:
 *    ```tsx
 *    const handleApprove = async (requestId: string) => {
 *      try {
 *        setIsLoading(true);
 *        await serviceRequestService.approveRequest(requestId);
 *        showAlert('success', 'Request approved successfully');
 *        setIsDetailModalOpen(false);
 *        fetchServiceRequests();
 *      } catch (err) {
 *        console.error('Failed to approve request:', err);
 *        showAlert('error', 'Failed to approve request');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    
 *    const handleReject = async (requestId: string) => {
 *      try {
 *        setIsLoading(true);
 *        await serviceRequestService.rejectRequest(requestId);
 *        showAlert('success', 'Request rejected successfully');
 *        setIsDetailModalOpen(false);
 *        fetchServiceRequests();
 *      } catch (err) {
 *        console.error('Failed to reject request:', err);
 *        showAlert('error', 'Failed to reject request');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    
 *    const handleComplete = async (requestId: string, results?: string) => {
 *      try {
 *        setIsLoading(true);
 *        await serviceRequestService.completeRequest(requestId, results);
 *        showAlert('success', 'Request marked as completed successfully');
 *        setIsDetailModalOpen(false);
 *        fetchServiceRequests();
 *      } catch (err) {
 *        console.error('Failed to complete request:', err);
 *        showAlert('error', 'Failed to mark request as completed');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 */

/**
 * How to implement API connections for DoctorManagement.tsx:
 * 
 * 1. Import the API services:
 *    ```tsx
 *    import { doctorService, departmentService } from '../services/api';
 *    ```
 * 
 * 2. Replace the mock data fetching with API calls:
 *    ```tsx
 *    // Fetch doctors
 *    const fetchDoctors = async () => {
 *      setIsLoading(true);
 *      setError(null);
 *      
 *      try {
 *        const doctors = await doctorService.getAllDoctors(
 *          true, // activeOnly
 *          filter.departmentId !== 'all' ? filter.departmentId : undefined
 *        );
 *        
 *        setDoctors(doctors);
 *      } catch (err) {
 *        console.error('Failed to fetch doctors:', err);
 *        setError('Failed to load doctors. Please try again later.');
 *        showAlert('error', 'Failed to load doctors');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 * 
 * 3. Implement department fetching:
 *    ```tsx
 *    // Fetch departments
 *    const fetchDepartments = async () => {
 *      try {
 *        const departments = await departmentService.getAllDepartments(true);
 *        setDepartments(departments);
 *      } catch (err) {
 *        console.error('Failed to fetch departments:', err);
 *        showAlert('error', 'Failed to load departments');
 *      }
 *    };
 *    ```
 * 
 * 4. Implement doctor schedule fetch/update:
 *    ```tsx
 *    // Fetch doctor schedule
 *    const fetchDoctorSchedule = async (doctorId: string) => {
 *      try {
 *        setIsLoading(true);
 *        const schedule = await doctorService.getDoctorSchedule(doctorId);
 *        setSelectedDoctorSchedule(schedule);
 *      } catch (err) {
 *        console.error('Failed to fetch doctor schedule:', err);
 *        showAlert('error', 'Failed to load doctor schedule');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    
 *    // Update doctor schedule
 *    const updateDoctorSchedule = async (doctorId: string, scheduleData: any) => {
 *      try {
 *        setIsLoading(true);
 *        await doctorService.updateDoctorSchedule(doctorId, scheduleData);
 *        showAlert('success', 'Doctor schedule updated successfully');
 *        fetchDoctorSchedule(doctorId);
 *      } catch (err) {
 *        console.error('Failed to update doctor schedule:', err);
 *        showAlert('error', 'Failed to update doctor schedule');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 */

/**
 * How to implement API connections for DepartmentManagement.tsx:
 * 
 * 1. Import the API services:
 *    ```tsx
 *    import { departmentService, doctorService } from '../services/api';
 *    ```
 * 
 * 2. Replace the mock data fetching with API calls:
 *    ```tsx
 *    // Fetch departments
 *    const fetchDepartments = async () => {
 *      setIsLoading(true);
 *      setError(null);
 *      
 *      try {
 *        const departments = await departmentService.getAllDepartments(false); // include inactive
 *        setDepartments(departments);
 *      } catch (err) {
 *        console.error('Failed to fetch departments:', err);
 *        setError('Failed to load departments. Please try again later.');
 *        showAlert('error', 'Failed to load departments');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 * 
 * 3. Implement department doctors fetching:
 *    ```tsx
 *    // Fetch department doctors
 *    const fetchDepartmentDoctors = async (departmentId: string) => {
 *      try {
 *        const doctors = await departmentService.getDepartmentDoctors(departmentId);
 *        setDoctors(doctors);
 *      } catch (err) {
 *        console.error('Failed to fetch department doctors:', err);
 *        showAlert('error', 'Failed to load department doctors');
 *      }
 *    };
 *    ```
 * 
 * 4. Implement department create/update:
 *    ```tsx
 *    // Create department
 *    const createDepartment = async (departmentData: any) => {
 *      try {
 *        setIsLoading(true);
 *        await departmentService.createDepartment(departmentData);
 *        showAlert('success', 'Department created successfully');
 *        fetchDepartments();
 *        setIsCreateModalOpen(false);
 *      } catch (err) {
 *        console.error('Failed to create department:', err);
 *        showAlert('error', 'Failed to create department');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    
 *    // Update department
 *    const updateDepartment = async (departmentId: string, updateData: any) => {
 *      try {
 *        setIsLoading(true);
 *        await departmentService.updateDepartment(departmentId, updateData);
 *        showAlert('success', 'Department updated successfully');
 *        fetchDepartments();
 *        setIsEditModalOpen(false);
 *      } catch (err) {
 *        console.error('Failed to update department:', err);
 *        showAlert('error', 'Failed to update department');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 */

/**
 * How to implement API connections for PatientDetail.tsx:
 * 
 * 1. Import the API services:
 *    ```tsx
 *    import { patientService, serviceRequestService } from '../services/api';
 *    ```
 * 
 * 2. Replace the mock data fetching with API calls:
 *    ```tsx
 *    // Fetch patient details
 *    const fetchPatientDetails = async () => {
 *      setIsLoading(true);
 *      setError(null);
 *      
 *      try {
 *        const patientData = await patientService.getPatientById(patientId);
 *        setPatient(patientData);
 *      } catch (err) {
 *        console.error('Failed to fetch patient details:', err);
 *        setError('Failed to load patient details. Please try again later.');
 *        showAlert('error', 'Failed to load patient details');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 * 
 * 3. Implement patient appointments fetching:
 *    ```tsx
 *    // Fetch patient appointments
 *    const fetchPatientAppointments = async () => {
 *      try {
 *        const appointments = await patientService.getPatientAppointments(patientId);
 *        setAppointments(appointments);
 *      } catch (err) {
 *        console.error('Failed to fetch patient appointments:', err);
 *        showAlert('error', 'Failed to load patient appointments');
 *      }
 *    };
 *    ```
 * 
 * 4. Implement patient service requests fetching:
 *    ```tsx
 *    // Fetch patient service requests
 *    const fetchPatientServiceRequests = async () => {
 *      try {
 *        const requests = await patientService.getPatientServiceRequests(patientId);
 *        setServiceRequests(requests);
 *      } catch (err) {
 *        console.error('Failed to fetch patient service requests:', err);
 *        showAlert('error', 'Failed to load patient service requests');
 *      }
 *    };
 *    ```
 * 
 * 5. Implement patient medical records fetching:
 *    ```tsx
 *    // Fetch patient medical records
 *    const fetchPatientMedicalRecords = async () => {
 *      try {
 *        const records = await patientService.getPatientMedicalRecords(patientId);
 *        setMedicalRecords(records);
 *      } catch (err) {
 *        console.error('Failed to fetch patient medical records:', err);
 *        showAlert('error', 'Failed to load patient medical records');
 *      }
 *    };
 *    ```
 */

/**
 * How to implement API connections for MedicalServiceCreate.tsx:
 * 
 * 1. Import the API services:
 *    ```tsx
 *    import { medicalServiceService, departmentService } from '../services/api';
 *    ```
 * 
 * 2. Replace the mock data fetching with API calls:
 *    ```tsx
 *    // Fetch departments
 *    const fetchDepartments = async () => {
 *      try {
 *        const departments = await departmentService.getAllDepartments(true);
 *        setDepartments(departments);
 *      } catch (err) {
 *        console.error('Failed to fetch departments:', err);
 *        showAlert('error', 'Failed to load departments');
 *      }
 *    };
 *    ```
 * 
 * 3. Implement service creation:
 *    ```tsx
 *    // Create medical service
 *    const createMedicalService = async (e: React.FormEvent) => {
 *      e.preventDefault();
 *      
 *      if (!isFormValid()) {
 *        showAlert('error', 'Please fill in all required fields correctly');
 *        return;
 *      }
 *      
 *      setIsSubmitting(true);
 *      
 *      try {
 *        const serviceData = {
 *          name: formData.name,
 *          code: formData.code,
 *          description: formData.description,
 *          departmentId: formData.departmentId,
 *          price: parseFloat(formData.price),
 *          duration: parseInt(formData.duration),
 *          requiredEquipment: formData.requiredEquipment.filter(Boolean),
 *          prerequisiteInstructions: formData.prerequisiteInstructions
 *        };
 *        
 *        await medicalServiceService.createService(serviceData);
 *        showAlert('success', 'Medical service created successfully');
 *        navigate('/medical-services');
 *      } catch (err) {
 *        console.error('Failed to create medical service:', err);
 *        showAlert('error', 'Failed to create medical service');
 *      } finally {
 *        setIsSubmitting(false);
 *      }
 *    };
 *    ```
 */

/**
 * How to implement API connections for AdminDashboard.tsx:
 * 
 * 1. Import the API services:
 *    ```tsx
 *    import { adminDashboardService } from '../services/api';
 *    ```
 * 
 * 2. Replace the mock data fetching with API calls:
 *    ```tsx
 *    // Fetch dashboard metrics
 *    const fetchDashboardData = async () => {
 *      setIsLoading(true);
 *      setError(null);
 *      
 *      try {
 *        const [financialMetrics, operationalMetrics, departmentMetrics, serviceMetrics, doctorMetrics] = await Promise.all([
 *          adminDashboardService.getFinancialMetrics(timePeriod),
 *          adminDashboardService.getOperationalMetrics(timePeriod),
 *          adminDashboardService.getDepartmentMetrics(),
 *          adminDashboardService.getServiceMetrics(),
 *          adminDashboardService.getDoctorMetrics()
 *        ]);
 *        
 *        setFinancialData(financialMetrics);
 *        setOperationalData(operationalMetrics);
 *        setDepartmentData(departmentMetrics);
 *        setTopServices(serviceMetrics);
 *        setTopDoctors(doctorMetrics);
 *      } catch (err) {
 *        console.error('Failed to fetch dashboard data:', err);
 *        setError('Failed to load dashboard data. Please try again later.');
 *        showAlert('error', 'Failed to load dashboard data');
 *      } finally {
 *        setIsLoading(false);
 *      }
 *    };
 *    ```
 * 
 * 3. Update effect to fetch data when time period changes:
 *    ```tsx
 *    useEffect(() => {
 *      fetchDashboardData();
 *    }, [timePeriod]);
 *    ```
 */

export const ApiImplementationGuide = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">API Implementation Guide</h1>
      <p className="text-gray-600 mb-8">
        This document provides instructions for connecting the frontend components to the backend API.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Service Request Management</h2>
          <p className="text-gray-600 mb-4">
            Implement API connections for managing service requests.
          </p>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
            onClick={() => navigate('/service-requests')}
          >
            Go to Service Requests
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Doctor Management</h2>
          <p className="text-gray-600 mb-4">
            Implement API connections for managing doctors.
          </p>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
            onClick={() => navigate('/doctors')}
          >
            Go to Doctors
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Department Management</h2>
          <p className="text-gray-600 mb-4">
            Implement API connections for managing departments.
          </p>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
            onClick={() => navigate('/departments')}
          >
            Go to Departments
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Patient Detail</h2>
          <p className="text-gray-600 mb-4">
            Implement API connections for viewing patient details.
          </p>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
            onClick={() => navigate('/patients')}
          >
            Go to Patients
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Medical Service Create</h2>
          <p className="text-gray-600 mb-4">
            Implement API connections for creating medical services.
          </p>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
            onClick={() => navigate('/medical-services/create')}
          >
            Go to Create Service
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Admin Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Implement API connections for the admin dashboard.
          </p>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg"
            onClick={() => navigate('/admin/dashboard')}
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiImplementationGuide;
