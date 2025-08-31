# API Integration Implementation Plan

This document outlines the steps to integrate the frontend components with the backend APIs for the Medical Clinic application.

## API Architecture Overview

We've implemented a comprehensive API service layer with the following structure:

1. **Base API Client**: `api.ts` - Contains the Axios instance with authentication and error interceptors
2. **Service-Specific API Modules**: Each major entity has its own service within the API client
3. **Error Handling**: Centralized through `apiErrorHandler.ts`

## Backend API Endpoints

The backend provides RESTful API endpoints for the following resources:

- Authentication: `/api/v1/auth/*`
- Patients: `/api/v1/patients/*`
- Doctors: `/api/v1/doctors/*`
- Departments: `/api/v1/departments/*`
- Medical Services: `/api/v1/medical-services/*`
- Service Requests: `/api/v1/service-requests/*`
- Appointments: `/api/v1/appointments/*`
- Admin Dashboard: `/api/v1/admin/dashboard/*`

## Implementation Steps for Each Component

### 1. Service Request Management

The Service Request Management component needs to connect to:
- `serviceRequestService.getAllRequests()` - To fetch all service requests with pagination and filtering
- `serviceRequestService.getRequestById()` - To fetch details of a specific service request
- `serviceRequestService.approveRequest()` - To approve a pending service request
- `serviceRequestService.rejectRequest()` - To reject a pending service request
- `serviceRequestService.completeRequest()` - To mark an approved service request as completed
- `departmentService.getAllDepartments()` - To fetch departments for filtering

### 2. Doctor Management

The Doctor Management component needs to connect to:
- `doctorService.getAllDoctors()` - To fetch all doctors with optional filtering by department
- `doctorService.getDoctorById()` - To fetch details of a specific doctor
- `doctorService.updateDoctor()` - To update doctor information
- `doctorService.getDoctorSchedule()` - To fetch a doctor's schedule
- `doctorService.updateDoctorSchedule()` - To update a doctor's schedule
- `departmentService.getAllDepartments()` - To fetch departments for filtering

### 3. Department Management

The Department Management component needs to connect to:
- `departmentService.getAllDepartments()` - To fetch all departments
- `departmentService.getDepartmentById()` - To fetch details of a specific department
- `departmentService.createDepartment()` - To create a new department
- `departmentService.updateDepartment()` - To update department information
- `departmentService.getDepartmentDoctors()` - To fetch doctors in a department
- `doctorService.getAllDoctors()` - To fetch all doctors for head doctor assignment

### 4. Patient Detail

The Patient Detail component needs to connect to:
- `patientService.getPatientById()` - To fetch patient details
- `patientService.updatePatient()` - To update patient information
- `patientService.getPatientAppointments()` - To fetch patient appointments
- `patientService.getPatientServiceRequests()` - To fetch patient service requests
- `patientService.getPatientMedicalRecords()` - To fetch patient medical records

### 5. Medical Service Create

The Medical Service Create component needs to connect to:
- `medicalServiceService.createService()` - To create a new medical service
- `departmentService.getAllDepartments()` - To fetch departments for assignment

### 6. Admin Dashboard

The Admin Dashboard component needs to connect to:
- `adminDashboardService.getFinancialMetrics()` - To fetch financial metrics
- `adminDashboardService.getOperationalMetrics()` - To fetch operational metrics
- `adminDashboardService.getDepartmentMetrics()` - To fetch department metrics
- `adminDashboardService.getServiceMetrics()` - To fetch service metrics
- `adminDashboardService.getDoctorMetrics()` - To fetch doctor metrics

## Error Handling Strategy

All API calls should use the centralized error handling mechanism:

```typescript
import { useApiErrorHandler } from '../utils/apiErrorHandler';

// In your component
const { handleApiError } = useApiErrorHandler();

// When making API calls
try {
  // API call
} catch (err) {
  handleApiError(err, 'Custom error message if needed');
}
```

## Authentication and Authorization

API requests automatically include the authentication token through the Axios interceptor in `api.ts`. The token is stored in localStorage after login.

Components should use the `PermissionGuard` component to control access to features based on user permissions:

```typescript
<PermissionGuard requiredPermissions={[Permission.VIEW_PATIENTS]}>
  <button>Sensitive Action</button>
</PermissionGuard>
```

## Testing Approach

1. Test each API endpoint integration individually
2. Verify error handling for each endpoint
3. Test with various filter combinations
4. Verify pagination works correctly
5. Test with different user roles to ensure proper authorization

## Implementation Timeline

1. Set up API services and error handling (Completed)
2. Implement Service Request Management API integration
3. Implement Doctor Management API integration
4. Implement Department Management API integration
5. Implement Patient Detail API integration
6. Implement Medical Service Create API integration
7. Implement Admin Dashboard API integration
8. Comprehensive testing and debugging

## Resources

- Backend API documentation is available at `/api/v1/docs`
- Sample API calls are documented in `ApiImplementationGuide.tsx`
