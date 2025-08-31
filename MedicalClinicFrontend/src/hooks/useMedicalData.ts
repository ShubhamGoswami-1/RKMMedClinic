import { useState, useEffect } from 'react';
import { useGlobalAlert } from './useGlobalAlert';
import { departmentService, doctorService } from '../services/api';
import { Department, Doctor } from '../types/models';

/**
 * Custom hook for managing medical data (departments and doctors)
 * Used in appointment creation flow and other places where department/doctor selection is needed
 */
export const useMedicalData = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useGlobalAlert();

  // Fetch initial data - departments and active doctors
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Clear doctor cache to ensure fresh data
        doctorService.clearCache();
        
        // Fetch departments and active doctors in parallel
        const [deptResponse, doctorsResponse] = await Promise.all([
          departmentService.getAllDepartments(true),
          doctorService.getAllDoctors(true)
        ]);
      
      // Extract departments data safely with type safety
      let departmentsData: Department[] = [];
      if (deptResponse && typeof deptResponse === 'object') {
        if ('data' in deptResponse) {
          if (deptResponse.data?.departments) {
            departmentsData = deptResponse.data.departments;
          } else if (Array.isArray(deptResponse.data)) {
            departmentsData = deptResponse.data;
          }
        } else if ('normalizedDepartments' in deptResponse) {
          departmentsData = deptResponse.normalizedDepartments;
        } else if (Array.isArray(deptResponse)) {
          departmentsData = deptResponse;
        }
      }      
      console.log('Fetched departments:', departmentsData);
      console.log('Department IDs:', departmentsData.map(d => ({ id: d.id, name: d.name })));
      setDepartments(departmentsData);
        
        // Extract doctors data safely with type safety
        let doctorsData: Doctor[] = [];
        if (doctorsResponse && typeof doctorsResponse === 'object') {
          if ('data' in doctorsResponse && doctorsResponse.data?.doctors) {
            doctorsData = doctorsResponse.data.doctors;
          } else if (Array.isArray(doctorsResponse)) {
            doctorsData = doctorsResponse;
          }
        }
        
        // Ensure doctors have proper department names by cross-referencing with departments
        if (doctorsData.length > 0 && departmentsData.length > 0) {
          doctorsData = doctorsData.map(doctor => {
            // If doctor already has a department name, leave it
            if (doctor.departmentName && doctor.departmentName !== 'Unknown Department') {
              return doctor;
            }
            
            // Try to find matching department - ensure IDs are compared as strings
            const doctorDeptId = String(doctor.departmentId || '').trim();
            const department = departmentsData.find(dept => String(dept.id || '').trim() === doctorDeptId);
            
            console.log(`Doctor ${doctor.firstName} ${doctor.lastName} with deptId ${doctorDeptId} matched with department: ${department ? department.name : 'none'}`);
            
            if (department) {
              return {
                ...doctor,
                departmentName: department.name
              };
            }
            
            return doctor;
          });
        }
        
        console.log('Processed doctors with department info:', doctorsData);
        setDoctors(doctorsData);
        
        console.log('Initial medical data loaded successfully', {
          departmentsCount: departmentsData.length,
          doctorsCount: doctorsData.length,
          departments: departmentsData.map(d => ({ id: d.id, name: d.name })),
          doctors: doctorsData.map(d => ({ 
            id: d.id, 
            name: `${d.firstName} ${d.lastName}`, 
            departmentId: d.departmentId,
            departmentName: d.departmentName
          }))
        });
      } catch (error: any) {
        console.error('Error fetching initial medical data:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to load departments and doctors';
        showAlert('error', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [showAlert]);  
  // Filter doctors by department
  const filterDoctorsByDepartment = async (departmentId: string) => {
    if (!departmentId || departmentId.trim() === '') {
      console.log('Empty departmentId provided, returning empty list');
      setFilteredDoctors([]);
      return [];
    }
    
    // Log all available departments for debugging
    console.log('All available departments:', departments.map(dept => ({ id: dept.id, name: dept.name })));
    
    // Check if departmentId is actually a name instead of an ID
    // MongoDB IDs are typically 24-character hex strings
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(departmentId);
    let actualDepartmentId = departmentId;
    
    if (!isMongoId) {
      console.log(`Received departmentId "${departmentId}" which doesn't look like a MongoDB ID, trying to find actual ID...`);
      
      // First attempt: Find by exact ID match (might be non-MongoDB format)
      const exactIdMatch = departments.find(dept => dept.id === departmentId);
      
      if (exactIdMatch) {
        console.log(`Found department with exact ID match: ${exactIdMatch.name} with ID: ${exactIdMatch.id}`);
        actualDepartmentId = exactIdMatch.id;
      } else {
        // Second attempt: Find by name
        const matchingDept = departments.find(dept => 
          dept.name === departmentId || 
          dept.name.toLowerCase() === departmentId.toLowerCase()
        );
        
        if (matchingDept) {
          console.log(`Found matching department by name: ${matchingDept.name} with ID: ${matchingDept.id}`);
          actualDepartmentId = matchingDept.id;
        } else {
          console.warn(`Could not find department with name or ID: "${departmentId}"`);
          
          // Last resort: Attempt to parse if it's a JSON string of a department object
          try {
            if (typeof departmentId === 'string' && departmentId.includes('{')) {
              const deptObj = JSON.parse(departmentId);
              if (deptObj && (deptObj.id || deptObj._id)) {
                console.log('Parsed department object from string:', deptObj);
                actualDepartmentId = deptObj.id || deptObj._id;
              }
            }
          } catch (e) {
            console.warn('Failed to parse potential department object:', e);
          }
        }
      }
    }
    
    // Verify we now have a valid MongoDB ID format
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(actualDepartmentId);
    
    console.log('Filtering doctors for department ID:', actualDepartmentId);
    console.log('Department ID is valid MongoDB format:', isValidMongoId);
    
    // If we still don't have a valid MongoDB ID, try one last approach - 
    // check if any department has a matching ID in any format
    if (!isValidMongoId) {
      console.log('Still not a valid MongoDB ID, checking all departments one more time...');
      for (const dept of departments) {
        // Convert department ID to string for comparison
        const deptIdStr = String(dept.id || '');
        // Check for any kind of match (partial, etc.)
        if (deptIdStr && (
            deptIdStr === actualDepartmentId || 
            deptIdStr.includes(actualDepartmentId) || 
            actualDepartmentId.includes(deptIdStr)
        )) {
          console.log(`Found potential ID match: ${dept.name} with ID: ${dept.id}`);
          actualDepartmentId = dept.id;
          break;
        }
      }
    }
    
    try {
      // Attempt to use the dedicated API endpoint first
      console.log(`Fetching doctors directly from department API endpoint for departmentId: ${actualDepartmentId}`);
      console.log('Final department ID type:', typeof actualDepartmentId);
      console.log('Final department ID value:', actualDepartmentId);
      console.log('Is valid MongoDB ID:', /^[0-9a-fA-F]{24}$/.test(actualDepartmentId));
      
      // Skip API call if department ID is undefined or invalid
      if (!actualDepartmentId || actualDepartmentId === 'undefined' || !(/^[0-9a-fA-F]{24}$/.test(actualDepartmentId))) {
        console.error('Invalid department ID detected, skipping API call');
        setFilteredDoctors([]);
        return [];
      }
      
      const deptDoctorsResponse = await departmentService.getDepartmentDoctors(actualDepartmentId);
      console.log('API response:', deptDoctorsResponse);
      
      if (deptDoctorsResponse?.data?.doctors && Array.isArray(deptDoctorsResponse.data.doctors)) {
        const apiDoctors = deptDoctorsResponse.data.doctors;
        console.log(`Department API returned ${apiDoctors.length} doctors:`, apiDoctors);
        
        // Update the filtered doctors state
        setFilteredDoctors(apiDoctors);
        return apiDoctors;
      } else {
        console.log('Department API did not return expected data format, falling back to client-side filtering');
      }
    } catch (error) {
      console.warn('Error fetching doctors from department API, falling back to client-side filtering:', error);
    }
    
    // Fallback to client-side filtering if API call fails
    console.log('Using client-side filtering as fallback');
    
    // Use client-side filtering as fallback
    const filtered = doctors.filter(doctor => {
      if (!doctor) {
        console.warn('Encountered null/undefined doctor in the list');
        return false;
      }
      
      // Handle the case where departmentId might be different types
      let doctorDeptId = '';
      if (doctor.departmentId === null || doctor.departmentId === undefined) {
        doctorDeptId = '';
      } 
      // Using any to handle potential runtime type mismatches that TypeScript doesn't expect
      else if (typeof doctor.departmentId === 'object') {
        // If it's an object, try to get the id/._id property or stringify it
        const deptObj = doctor.departmentId as any;
        doctorDeptId = ((deptObj.id || deptObj._id || JSON.stringify(deptObj)) || '').toString().trim();
      } else {
        // Otherwise convert to string
        doctorDeptId = doctor.departmentId.toString().trim();
      }
      
      const selectedDeptId = String(actualDepartmentId || '').trim();
      
      // Check for a match with more detailed logging
      const isMatch = doctorDeptId === selectedDeptId;
      const isActive = doctor.active !== false;
      
      console.log(`Doctor: ${doctor.firstName} ${doctor.lastName}, ` + 
                 `DeptId: "${doctorDeptId}", Selected: "${selectedDeptId}", ` + 
                 `Match: ${isMatch}, Active: ${isActive}`);
      
      return isMatch && isActive;
    });
    
    console.log(`Client-side filtering result: ${filtered.length} doctors matched for department ${departmentId}`);
    setFilteredDoctors(filtered);
    return filtered;
  };
  
  return {
    departments,
    doctors,
    filteredDoctors,
    isLoading,
    filterDoctorsByDepartment
  };
};
