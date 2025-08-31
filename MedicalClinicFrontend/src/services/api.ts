import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import circuitBreaker from '../utils/circuitBreaker';
import { Department } from '../types/models';

// Create caches for frequently called endpoints
const apiCache = {
  availableDoctorUsers: {
    data: null,
    timestamp: 0,
    expiryTime: 5 * 60 * 1000, // 5 minutes cache
  }
};

// Cache for doctor data
const doctorCache = {
  allActive: null as any[] | null,
  byDepartment: {} as Record<string, any[]>,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000, // Increase cache time to 5 minutes (was 2 minutes)
  pendingRequests: {} as Record<string, Promise<any[]>>, // Track in-flight requests to prevent duplicates
  
  // Helper method to clear cache
  clearCache: () => {
    doctorCache.allActive = null;
    doctorCache.byDepartment = {};
    doctorCache.timestamp = 0;
    console.log('Doctor cache cleared');
  }
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Extract the endpoint from the URL for circuit breaker tracking
    const url = config.url || '';
    const endpoint = url.split('?')[0]; // Remove query parameters
    
    // Check if circuit breaker allows this request
    if (!circuitBreaker.canRequest(endpoint)) {
      // If circuit is open, reject the request without calling the API
      const circuitOpenError = new Error(`Circuit is open for ${endpoint}. Too many recent failures.`);
      circuitOpenError.name = 'CircuitBreakerOpenError';
      return Promise.reject(circuitOpenError);
    }
    
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract the endpoint from the URL for circuit breaker tracking
    const url = response.config.url || '';
    const endpoint = url.split('?')[0]; // Remove query parameters
    
    // Record successful request
    circuitBreaker.recordSuccess(endpoint);
    
    return response;
  },
  (error: AxiosError) => {
    // Handle circuit breaker errors
    if (error.name === 'CircuitBreakerOpenError') {
      console.warn(`API request blocked by circuit breaker: ${error.message}`);
      return Promise.reject(error);
    }
    
    // Extract the endpoint from the URL for circuit breaker tracking
    const url = error.config?.url || '';
    const endpoint = url.split('?')[0]; // Remove query parameters
    
    // Record failure for circuit breaker
    if (endpoint) {
      // Only record server errors (5xx) or specific 4xx errors that indicate service issues
      const status = error.response?.status || 0;
      if (status >= 500 || status === 429 || status === 408) {
        circuitBreaker.recordFailure(endpoint);
        console.warn(`Circuit breaker recorded failure for ${endpoint}: ${status}`);
      }
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (loginIdentifier: string, password: string) => {
    const response = await api.post('/auth/login', { 
      // The backend expects either email or userName based on the identifier
      [loginIdentifier.includes('@') ? 'email' : 'userName']: loginIdentifier,
      password 
    });
    return response.data;
  },
  
  signup: async (userData: {
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  
  // Get users who don't have a doctor profile yet and can be assigned as doctors
  getAvailableDoctorUsers: async () => {
    try {
      const now = Date.now();
      if (
        apiCache.availableDoctorUsers.data &&
        (now - apiCache.availableDoctorUsers.timestamp) < apiCache.availableDoctorUsers.expiryTime
      ) {
        console.log('Using cached available doctor users');
        return apiCache.availableDoctorUsers.data;
      }

      const response = await api.get('/auth/available-doctor-users');
      apiCache.availableDoctorUsers.data = response.data;
      apiCache.availableDoctorUsers.timestamp = now;
      return response.data;
    } catch (error) {
      console.error('Error fetching available doctor users:', error);
      throw error;
    }
  },
    approveUser: async (token: string) => {
    const response = await api.post('/auth/approve-with-token', { token });
    return response.data;
  },
    rejectUser: async (token: string, deleteUser: boolean = false) => {
    try {
      console.log(`API: Rejecting user with token, deleteUser=${deleteUser}`);
      const response = await api.post('/auth/reject-with-token', { token, deleteUser });
      console.log('API: Rejection response received:', response);
      return response;
    } catch (error) {
      console.error('API: Error in rejectUser:', error);
      throw error; // Re-throw to allow component to handle
    }
  },
  
  approveUserById: async (userId: string) => {
    const response = await api.post(`/auth/approve/${userId}`);
    return response.data;
  },
    rejectUserById: async (userId: string, deleteUser: boolean = false) => {
    try {
      console.log(`API: Rejecting user by ID ${userId}, deleteUser=${deleteUser}`);
      const response = await api.post(`/auth/reject/${userId}`, { deleteUser });
      console.log('API: Rejection by ID response received:', response);
      return response;
    } catch (error) {
      console.error('API: Error in rejectUserById:', error);
      throw error; // Re-throw to allow component to handle
    }
  },
  validateToken: async () => {
    try {
      const response = await api.get('/auth/validate-token');
      return response.data;
    } catch (error) {
      // Token validation failed
      return null;
    }
  },  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    } catch (error) {
      // If refresh fails, force logout
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
      throw error;
    }
  },
};

// Service Request API
export const serviceRequestService = {
  getAllRequests: async (
    page: number = 1,
    limit: number = 20,
    filters: { status?: string; priority?: string; departmentId?: string } = {}
  ) => {
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
    
    const response = await api.get(`/service-requests?${queryParams.toString()}`);
    return response.data;
  },
  
  getRequestById: async (requestId: string) => {
    const response = await api.get(`/service-requests/${requestId}`);
    return response.data;
  },
  
  createRequest: async (requestData: {
    patientId: string;
    medicalServiceId: string;
    notes?: string;
    priority: 'normal' | 'urgent' | 'emergency';
    scheduledDate?: string;
  }) => {
    const response = await api.post('/service-requests', requestData);
    return response.data;
  },
  
  updateRequest: async (
    requestId: string,
    updateData: {
      notes?: string;
      priority?: 'normal' | 'urgent' | 'emergency';
      scheduledDate?: string;
    }
  ) => {
    const response = await api.patch(`/service-requests/${requestId}`, updateData);
    return response.data;
  },
  
  approveRequest: async (requestId: string, notes?: string) => {
    const response = await api.post(`/service-requests/${requestId}/approve`, { notes });
    return response.data;
  },
  
  rejectRequest: async (requestId: string, notes?: string) => {
    const response = await api.post(`/service-requests/${requestId}/reject`, { notes });
    return response.data;
  },
  
  completeRequest: async (requestId: string, results?: string) => {
    const response = await api.post(`/service-requests/${requestId}/complete`, { results });
    return response.data;
  },
  
  cancelRequest: async (requestId: string, notes?: string) => {
    const response = await api.post(`/service-requests/${requestId}/cancel`, { notes });
    return response.data;
  },

  getPatientRequests: async (patientId: string) => {
    const response = await api.get(`/service-requests/patient/${patientId}`);
    return response.data;
  },
};

// Doctor API
export const doctorService = {
    getAllDoctors: async (activeOnly: boolean = true, departmentId?: string) => {
    try {
      const now = Date.now();
      const cacheKey = departmentId ? `dept_${departmentId}_${activeOnly}` : `all_${activeOnly}`;
      
      // Check if we can use cached data
      if (doctorCache.timestamp > 0 && (now - doctorCache.timestamp) < doctorCache.expiryTime) {
        if (activeOnly && !departmentId && doctorCache.allActive) {
          console.log('Using cached active doctors list');
          return doctorCache.allActive;
        }
        
        if (departmentId && doctorCache.byDepartment[departmentId]) {
          console.log(`Using cached doctors for department ${departmentId}`);
          return doctorCache.byDepartment[departmentId];
        }
      }
      
      // Check for in-flight requests to prevent duplicates
      if (Object.prototype.hasOwnProperty.call(doctorCache.pendingRequests, cacheKey)) {
        console.log(`Reusing in-flight request for ${cacheKey}`);
        return doctorCache.pendingRequests[cacheKey];
      }
      
      // No cache hit, fetch from API
      let queryParams = new URLSearchParams();
      queryParams.append('activeOnly', activeOnly.toString());
      if (departmentId) queryParams.append('departmentId', departmentId);
      
      console.log(`Fetching doctors with params: ${queryParams.toString()}`);
        // First, fetch all departments to have department names available
      let departments = [];
      try {
        // Use activeOnly=false to get all departments including inactive ones
        const deptResponse = await api.get('/departments?activeOnly=false');
        const deptData = deptResponse.data;
        
        // Extract departments array based on response structure
        if (deptData && deptData.data && Array.isArray(deptData.data.departments)) {
          departments = deptData.data.departments;
        } else if (deptData && deptData.data && Array.isArray(deptData.data)) {
          departments = deptData.data;
        } else if (deptData && Array.isArray(deptData.departments)) {
          departments = deptData.departments;
        } else if (deptData && Array.isArray(deptData)) {
          departments = deptData;
        } else if (deptData && deptData.normalizedDepartments && Array.isArray(deptData.normalizedDepartments)) {
          // Handle the normalized departments from our own processing
          departments = deptData.normalizedDepartments;
        }
        
        // Log fetched departments with their IDs for debugging
        console.log(`Fetched ${departments.length} departments for doctor resolution`);
        departments.forEach((dept: any) => {
          console.log(`Department: ${dept.name}, ID: ${dept.id || dept._id}`);
        });
      } catch (error) {
        console.error('Error fetching departments for doctor data enrichment:', error);
        // Continue without departments data
      }
      
      // Create a promise and store it in pendingRequests
      const requestPromise = (async () => {
        const response = await api.get(`/doctors?${queryParams.toString()}`);
        
        // Process the response
        let doctorsData = [];
        
        // The API consistently returns this structure:
        // { status: 'success', results: number, data: { doctors: [...] } }
        if (response.data && response.data.status === 'success') {
          if (response.data.data && Array.isArray(response.data.data.doctors)) {
            doctorsData = response.data.data.doctors;
          }
        } 
        // Fallback handling for other structures
        else if (Array.isArray(response.data)) {
          doctorsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          doctorsData = response.data.data;
        } else if (response.data && response.data.doctors && Array.isArray(response.data.doctors)) {
          doctorsData = response.data.doctors;
        } else {
          console.error('Could not extract doctors array from response:', response.data);
          doctorsData = [];
        }        // Enrich doctor data with department names
        doctorsData = doctorsData.map((doctor: any) => {
          // If department is already populated as an object with name, use that
          if (doctor.departmentId && typeof doctor.departmentId === 'object' && doctor.departmentId.name) {
            return {
              ...doctor,
              departmentName: doctor.departmentId.name,
              departmentId: doctor.departmentId._id || doctor.departmentId.id
            };
          }
          
          // Otherwise, look up department name from our departments list
          // Make sure to convert IDs to strings for comparison
          const departmentId = doctor.departmentId ? doctor.departmentId.toString() : '';
          
          if (!departmentId) {
            console.warn('Doctor has no departmentId:', doctor);
            return {
              ...doctor,
              departmentName: 'Unknown Department'
            };
          }
          
          // Try to find matching department - normalize IDs to ensure proper comparison
          const department = departments.find((d: any) => {
            // Get department ID (handle both id and _id formats)
            const deptId = (d.id || d._id || '').toString();
            // Compare normalized IDs
            return deptId === departmentId;
          });
          
          if (department) {
            console.log(`Found department match: Doctor's departmentId ${departmentId} matches department "${department.name}"`);
          } else {
            console.warn(`No department found for doctor with departmentId: ${departmentId}`);
          }
          
          return {
            ...doctor,
            departmentName: department?.name || 'Unknown Department'
          };
        });
        
        console.log(`Processed ${doctorsData.length} doctors with department info`);
        
        // Package in expected format
        const formattedResponse = {
          status: 'success',
          data: {
            doctors: doctorsData
          }
        };
          // Update cache
        doctorCache.timestamp = now;
        
        // Cache for active doctors (most common use case)
        if (activeOnly && !departmentId) {
          doctorCache.allActive = doctorsData; // Store just the array instead of the formatted response
        }
        
        // Cache by department
        if (departmentId) {
          doctorCache.byDepartment[departmentId] = doctorsData; // Store just the array
        }
        
        // Clear the pending request reference
        delete doctorCache.pendingRequests[cacheKey];
        
        return formattedResponse;
      })();
        // Store the promise in pendingRequests
      doctorCache.pendingRequests[cacheKey] = requestPromise as unknown as Promise<any[]>;
      
      return requestPromise;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Return empty but properly structured response instead of throwing
      return {
        status: 'error',
        message: 'Failed to fetch doctors',
        data: {
          doctors: []
        }
      };
    }
  },
  
  getDoctorById: async (doctorId: string) => {
    const response = await api.get(`/doctors/${doctorId}`);
    return response.data;
  },  createDoctor: async (doctorData: {
    userId?: string;  // Make userId optional
    firstName?: string;  // Add firstName
    lastName?: string;   // Add lastName
    email?: string;      // Add email
    specialization: string;
    departmentId: string;
    qualification: string;
    experience: number;
    consultationFee: number;
    availableDays: string[];
    availableTimeSlots: {
      start: string;
      end: string;
    }[];
  }) => {
    try {
      console.log('Creating doctor with data:', doctorData);
      const response = await api.post('/doctors', doctorData);
      
      // Log the response for debugging
      console.log('Doctor creation response:', response.data);
      
      // Clear cache to ensure fresh data on next fetch
      doctorService.clearCache();
      
      return response.data;
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  },
    updateDoctor: async (
    doctorId: string,
    updateData: {
      specialization?: string;
      departmentId?: string;
      qualification?: string;
      experience?: number;
      consultationFee?: number;
      isActive?: boolean;
      availableDays?: string[];
      availableTimeSlots?: {
        start: string;
        end: string;
      }[];
    }
  ) => {
    const response = await api.patch(`/doctors/${doctorId}`, updateData);
    
    // Clear cache to ensure fresh data on next fetch
    doctorService.clearCache();
    
    return response.data;
  },
    reassignDoctor: async (doctorId: string, departmentId: string) => {
    try {
      const response = await api.patch(`/doctors/${doctorId}/reassign`, { departmentId });
      
      // Clear cache to ensure fresh data on next fetch
      doctorService.clearCache();
      
      return response.data;
    } catch (error) {
      console.error('Error reassigning doctor:', error);
      throw error;
    }
  },
  
  setDoctorStatus: async (doctorId: string, active: boolean) => {
    try {
      const response = await api.patch(`/doctors/${doctorId}/status`, { active });
      
      // Clear cache to ensure fresh data on next fetch
      doctorService.clearCache();
      
      return response.data;
    } catch (error) {
      console.error('Error updating doctor status:', error);
      throw error;
    }
  },
  
  getDoctorSchedule: async (doctorId: string, date?: string) => {
    let queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    
    const response = await api.get(`/doctors/${doctorId}/schedule?${queryParams.toString()}`);
    return response.data;
  },
  
  updateDoctorSchedule: async (
    doctorId: string,
    scheduleData: {
      availableDays: string[];
      availableTimeSlots: {
        start: string;
        end: string;
      }[];
    }
  ) => {
    const response = await api.post(`/doctors/${doctorId}/schedule`, scheduleData);
    return response.data;  },
    // Method to clear doctor cache (useful after updates)
  clearCache: () => {
    doctorCache.clearCache();
  },
};

// Department API
// Cache for department data
const departmentCache = {
  data: null,
  activeOnlyData: null,
  timestamp: 0,
  expiryTime: 2 * 60 * 1000, // 2 minutes cache
  
  // Helper method to clear cache
  clearCache: () => {
    departmentCache.data = null;
    departmentCache.activeOnlyData = null;
    departmentCache.timestamp = 0;
    console.log('Department cache cleared');
  }
};

export const departmentService = {
  getAllDepartments: async (activeOnly: boolean = false) => {
    // Check if we have valid cached data
    const now = Date.now();
    const cacheKey = activeOnly ? 'activeOnlyData' : 'data';
    
    if (
      departmentCache[cacheKey] && 
      departmentCache.timestamp > 0 && 
      (now - departmentCache.timestamp) < departmentCache.expiryTime
    ) {
      console.log(`Using cached departments (activeOnly=${activeOnly})`);
      return departmentCache[cacheKey];
    }
    
    // No cache or expired, make API call
    let queryParams = new URLSearchParams();
    queryParams.append('activeOnly', activeOnly.toString());
      try {
      console.log(`Fetching departments from API (activeOnly=${activeOnly})`);
      const response = await api.get(`/departments?${queryParams.toString()}`);
      
      // Debug the raw response
      console.log('Department API raw response:', JSON.stringify(response.data, null, 2));
      
      // Process the response before caching to ensure IDs are correctly handled
      const processedData = {
        ...response.data,
        // Add normalized departments array with consistent ID format
        normalizedDepartments: ((data) => {
          // Extract departments from the response based on its structure
          let rawDepartments = [];
          
          if (Array.isArray(data)) {
            rawDepartments = data;
          } else if (data.departments && Array.isArray(data.departments)) {
            rawDepartments = data.departments;
          } else if (data.data && data.data.departments && Array.isArray(data.data.departments)) {
            rawDepartments = data.data.departments;
          } else if (data.data && Array.isArray(data.data)) {
            // Handle standard API response structure: { status, data: [...] }
            rawDepartments = data.data;          } else if (data.results && Array.isArray(data.results)) {
            // Alternative structure: { status, results: [...] }
            rawDepartments = data.results;
          } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
            // Handle nested data structure
            rawDepartments = data.data.data;
          }
          
          console.log('Extracted raw departments:', rawDepartments);
          
          // Map to consistent structure and filter out invalid entries
          return rawDepartments.map((dept: any) => {
            // If dept is null or undefined, skip it
            if (!dept) return null;
            
            let id = dept._id || dept.id;
            const name = dept.name;
            const active = dept.active === undefined ? true : dept.active; // Default to true if not specified
            
            // Handle ObjectId conversion if the ID is an object with toString method
            if (id && typeof id === 'object' && id.toString) {
              id = id.toString();
            }
            
            // Log problematic departments
            if (!id) console.warn('Department missing ID:', dept);
            if (!name) console.warn('Department missing name:', dept);
              return {
              id: id || '',
              name: name || 'Unnamed Department',
              active: active, // Include active status
              // Keep original properties but override with normalized ones
              ...dept,
              _id: id || dept._id || '', // Ensure _id is also available
            };
          }).filter((dept: any) => {
            if (!dept) return false;
            if (!dept.id) {
              console.warn('Filtering out department with missing ID:', dept);
              return false;
            }
            
            // Convert ObjectId to string if needed
            if (typeof dept.id === 'object' && dept.id.toString) {
              dept.id = dept.id.toString();
            }
            
            // Check for valid MongoDB ObjectId format
            const isValidObjectId = typeof dept.id === 'string' && /^[0-9a-fA-F]{24}$/.test(dept.id);
            
            if (!isValidObjectId) {
              console.warn(`Filtering out department with invalid ID format: ${dept.id}, name: ${dept.name}`);
              return false;
            }
            
            return true;
          });
        })(response.data)
      };
      
      // Check if we found any valid departments
      if (!processedData.normalizedDepartments || processedData.normalizedDepartments.length === 0) {
        console.warn('No valid departments found in API response:', response.data);
      } else {
        console.log(`Successfully normalized ${processedData.normalizedDepartments.length} departments`);
      }
      
      // Cache the processed response
      departmentCache[cacheKey] = processedData;
      departmentCache.timestamp = now;
      
      return processedData;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
  
  getDepartmentById: async (departmentId: string) => {
    const response = await api.get(`/departments/${departmentId}`);
    return response.data;
  },
  
  getDepartmentStatistics: async (departmentId: string) => {
    try {
      const response = await api.get(`/departments/${departmentId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching department statistics:', error);
      throw error;
    }
  },  getDepartmentDoctors: async (departmentId: string, activeOnly: boolean = true) => {
    try {
      // Enhanced validation for departmentId
      if (!departmentId) {
        console.error('Received null or undefined departmentId in getDepartmentDoctors');
        return {
          status: 'error',
          message: 'No department ID provided',
          data: {
            doctors: []
          }
        };
      }
      
      // Convert to string if somehow not a string
      const departmentIdStr = String(departmentId).trim();
      
      if (departmentIdStr === '' || departmentIdStr === 'undefined' || departmentIdStr === 'null') {
        console.error('Received invalid departmentId in getDepartmentDoctors:', departmentIdStr);
        return {
          status: 'error',
          message: 'Invalid department ID provided',
          data: {
            doctors: []
          }
        };
      }
      
      let queryParams = new URLSearchParams();
      queryParams.append('activeOnly', activeOnly.toString());
      
      // Log the department ID we're trying to use
      console.log(`Fetching doctors for department ${departmentIdStr}, activeOnly: ${activeOnly}`);
      console.log('Department ID type:', typeof departmentIdStr);
      console.log('Department ID value:', departmentIdStr);
      
      // Verify the department ID format (should be a 24-character MongoDB ObjectID)
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(departmentIdStr);
      console.log(`Department ID is valid MongoDB format: ${isValidMongoId}`);
      
      // If not a valid MongoDB ID, try to find the department by name or ID
      if (!isValidMongoId) {
        // First, try to find the department by name or other means
        console.log(`Attempting to find department ID for non-MongoDB ID format: "${departmentIdStr}"`);
        
        try {
          const allDepts = await departmentService.getAllDepartments(false);
          let allDepartments: Department[] = [];
          
          // Extract departments from response based on structure
          if (allDepts && typeof allDepts === 'object') {
            if ('normalizedDepartments' in allDepts) {
              allDepartments = allDepts.normalizedDepartments;
            } else if ('data' in allDepts && Array.isArray(allDepts.data.departments)) {
              allDepartments = allDepts.data.departments;
            } else if (Array.isArray(allDepts)) {
              allDepartments = allDepts;
            }
          }
          
          // Find the department with matching name
          const matchingDept = allDepartments.find(dept => 
            dept.name === departmentId || 
            dept.name.toLowerCase() === departmentId.toLowerCase()
          );
          
          if (matchingDept) {
            console.log(`Found matching department by name: ${matchingDept.name} with ID: ${matchingDept.id}`);
            departmentId = matchingDept.id;
          } else {
            console.warn(`Could not find department with name: "${departmentId}"`);
            // Return empty results if we can't find the department
            return {
              status: 'success',
              data: {
                doctors: []
              }
            };
          }
        } catch (error) {
          console.error('Error finding department by name:', error);
        }
      }
      
      // Get department info first to ensure we have the name
      const departmentResponse = await api.get(`/departments/${departmentId}`);
      const departmentData = departmentResponse.data;
      
      // Extract department name
      let departmentName = 'Unknown Department';
      if (departmentData && departmentData.data && departmentData.data.department) {
        departmentName = departmentData.data.department.name;
      } else if (departmentData && departmentData.name) {
        departmentName = departmentData.name;
      }
      
      console.log(`Department name: ${departmentName}`);
      
      // Get doctors for this department
      const response = await api.get(`/departments/${departmentId}/doctors?${queryParams.toString()}`);
      const responseData = response.data;
      
      // Process the doctors to ensure they have the department name
      let doctors = [];
      
      if (responseData && responseData.data && Array.isArray(responseData.data.doctors)) {
        doctors = responseData.data.doctors;
      } else if (responseData && Array.isArray(responseData.data)) {
        doctors = responseData.data;
      } else if (responseData && Array.isArray(responseData)) {
        doctors = responseData;
      }
        // Ensure each doctor has the correct department info
      const processedDoctors = doctors.map((doctor: any) => {
        return {
          ...doctor,
          departmentId: departmentId,
          departmentName: departmentName
        };
      });
      
      console.log(`Processed ${processedDoctors.length} doctors with department info`);
      
      // Return in the expected format
      return {
        status: 'success',
        data: {
          doctors: processedDoctors
        }
      };
    } catch (error) {
      console.error('Error fetching department doctors:', error);
      throw error;
    }
  },
  // Method to clear department cache (useful after updates)
  clearCache: () => {
    departmentCache.clearCache();
  },
    createDepartment: async (departmentData: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await api.post('/departments', departmentData);
      // Clear cache after creating a department
      departmentService.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },    updateDepartment: async (
    departmentId: string,
    updateData: {
      name?: string;
      description?: string;
      active?: boolean; // Change to 'active' to match backend model
    }
  ) => {
    try {
      // Map to the correct field name for backward compatibility
      const backendData = {
        ...updateData,
        // If isActive is provided (from old code), map it to active
        ...(updateData.hasOwnProperty('isActive') && { active: updateData['isActive' as keyof typeof updateData] })
      };
      
      const response = await api.patch(`/departments/${departmentId}`, backendData);
      // Clear cache after updating a department
      departmentService.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },
    deleteDepartment: async (departmentId: string) => {
    try {
      const response = await api.delete(`/departments/${departmentId}`);
      // Clear cache after deleting a department
      departmentService.clearCache();
      return response.data;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },
  
  getDepartmentServices: async (departmentId: string, activeOnly: boolean = true) => {
    let queryParams = new URLSearchParams();
    queryParams.append('activeOnly', activeOnly.toString());
    
    const response = await api.get(`/departments/${departmentId}/services?${queryParams.toString()}`);
    return response.data;
  },
};

// Patient API
export const patientService = {
  getAllPatients: async (page = 1, limit = 20) => {
    const response = await api.get(`/patients?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPatientById: async (patientId: string) => {
    // Validate patientId to prevent unnecessary API calls
    if (!patientId || patientId === 'undefined' || patientId === 'null') {
      console.error('Invalid patient ID provided to getPatientById:', patientId);
      throw new Error('Invalid patient ID provided');
    }
    
    try {
      const response = await api.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient with ID ${patientId}:`, error);
      throw error; // Re-throw to allow component to handle
    }
  },
  
  searchPatients: async (searchParams: {
    name?: string;
    email?: string;
    phone?: string;
    aadhar?: string;
    pan?: string;
  }) => {
    let queryParams = new URLSearchParams();
    
    if (searchParams.name) queryParams.append('name', searchParams.name);
    if (searchParams.email) queryParams.append('email', searchParams.email);
    if (searchParams.phone) queryParams.append('phone', searchParams.phone);
    if (searchParams.aadhar) queryParams.append('aadhar', searchParams.aadhar);
    if (searchParams.pan) queryParams.append('pan', searchParams.pan);
    
    const response = await api.get(`/patients/search?${queryParams.toString()}`);
    return response.data;
  },
  
  createPatient: async (patientData: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    aadharNumber?: string;
    panNumber?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicDiseases?: string[];
  }) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },
  
  updatePatient: async (
    patientId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      gender?: string;
      dateOfBirth?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      aadharNumber?: string;
      panNumber?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      bloodGroup?: string;
      allergies?: string[];
      chronicDiseases?: string[];
    }
  ) => {
    const response = await api.patch(`/patients/${patientId}`, updateData);
    return response.data;
  },
    getPatientAppointments: async (patientId: string) => {
    // Validate patientId to prevent unnecessary API calls
    if (!patientId || patientId === 'undefined' || patientId === 'null') {
      console.error('Invalid patient ID provided to getPatientAppointments:', patientId);
      throw new Error('Invalid patient ID provided');
    }
    
    try {
      const response = await api.get(`/patients/${patientId}/appointments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointments for patient ID ${patientId}:`, error);
      throw error; // Re-throw to allow component to handle
    }
  },
  
  getPatientServiceRequests: async (patientId: string) => {
    // Validate patientId to prevent unnecessary API calls
    if (!patientId || patientId === 'undefined' || patientId === 'null') {
      console.error('Invalid patient ID provided to getPatientServiceRequests:', patientId);
      throw new Error('Invalid patient ID provided');
    }
    
    try {
      const response = await api.get(`/patients/${patientId}/service-requests`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching service requests for patient ID ${patientId}:`, error);
      throw error; // Re-throw to allow component to handle
    }
  },
  
  getPatientMedicalRecords: async (patientId: string) => {
    // Validate patientId to prevent unnecessary API calls
    if (!patientId || patientId === 'undefined' || patientId === 'null') {
      console.error('Invalid patient ID provided to getPatientMedicalRecords:', patientId);
      throw new Error('Invalid patient ID provided');
    }
    
    try {
      const response = await api.get(`/patients/${patientId}/medical-records`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching medical records for patient ID ${patientId}:`, error);
      throw error; // Re-throw to allow component to handle
    }
  },
};

// Medical Service API
export const medicalServiceService = {
  getAllServices: async (
    page: number = 1, 
    limit: number = 20,
    activeOnly: boolean = true,
    departmentId?: string
  ) => {
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('activeOnly', activeOnly.toString());
    if (departmentId) queryParams.append('departmentId', departmentId);
    
    const response = await api.get(`/medical-services?${queryParams.toString()}`);
    return response.data;
  },
  
  getServiceById: async (serviceId: string) => {
    const response = await api.get(`/medical-services/${serviceId}`);
    return response.data;
  },
  
  searchServices: async (searchText: string, activeOnly: boolean = true) => {
    let queryParams = new URLSearchParams();
    queryParams.append('search', searchText);
    queryParams.append('activeOnly', activeOnly.toString());
    
    const response = await api.get(`/medical-services/search?${queryParams.toString()}`);
    return response.data;
  },
  
  createService: async (serviceData: {
    name: string;
    code: string;
    description: string;
    departmentId: string;
    price: number;
    duration: number;
    requiredEquipment?: string[];
    prerequisiteInstructions?: string;
  }) => {
    const response = await api.post('/medical-services', serviceData);
    return response.data;
  },
  
  updateService: async (
    serviceId: string,
    updateData: {
      name?: string;
      description?: string;
      departmentId?: string;
      price?: number;
      duration?: number;
      isActive?: boolean;
      requiredEquipment?: string[];
      prerequisiteInstructions?: string;
    }
  ) => {
    const response = await api.patch(`/medical-services/${serviceId}`, updateData);
    return response.data;
  },
};

// Admin Dashboard API
export const adminDashboardService = {
  getFinancialMetrics: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const response = await api.get(`/admin/dashboard/financial?period=${period}`);
    return response.data;
  },
  
  getOperationalMetrics: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const response = await api.get(`/admin/dashboard/operational?period=${period}`);
    return response.data;
  },
  
  getDepartmentMetrics: async () => {
    const response = await api.get('/admin/dashboard/departments');
    return response.data;
  },
  
  getServiceMetrics: async (limit: number = 10) => {
    const response = await api.get(`/admin/dashboard/services?limit=${limit}`);
    return response.data;
  },
  
  getDoctorMetrics: async (limit: number = 10) => {
    const response = await api.get(`/admin/dashboard/doctors?limit=${limit}`);
    return response.data;
  },
};

// Appointment API
export const appointmentService = {
  getAllAppointments: async (
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      patientId?: string;
      doctorId?: string;
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) => {
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.patientId) queryParams.append('patientId', filters.patientId);
    if (filters.doctorId) queryParams.append('doctorId', filters.doctorId);
    if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    const response = await api.get(`/appointments?${queryParams.toString()}`);
    return response.data;
  },
  
  getTodayAppointments: async (
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      doctorId?: string;
      departmentId?: string;
    } = {}
  ) => {
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.doctorId) queryParams.append('doctorId', filters.doctorId);
    if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
    
    const response = await api.get(`/appointments/today?${queryParams.toString()}`);
    return response.data;
  },
  
  getAppointmentById: async (appointmentId: string) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },
  
  createAppointment: async (appointmentData: {
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    fee?: number;
  }) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  
  updateAppointment: async (
    appointmentId: string,
    updateData: {
      doctorId?: string;
      departmentId?: string;
      appointmentDate?: string;
      appointmentTime?: string;
      reason?: string;
      fee?: number;
    }
  ) => {
    const response = await api.patch(`/appointments/${appointmentId}`, updateData);
    return response.data;
  },
  
  updateAppointmentStatus: async (
    appointmentId: string,
    status: 'initiated' | 'cancelled' | 'no-show',
    remarks?: string
  ) => {
    const response = await api.patch(`/appointments/${appointmentId}/status`, { status, remarks });
    return response.data;
  },
  
  cancelAppointment: async (appointmentId: string, reason?: string) => {
    const response = await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
    return response.data;
  },
  
  markNoShow: async (appointmentId: string) => {
    const response = await api.patch(`/appointments/${appointmentId}/no-show`);
    return response.data;
  },
  
  registerAndBook: async (
    patientData: any,
    appointmentData: any
  ) => {
    const response = await api.post('/appointments/register-and-book', {
      patientData,
      appointmentData
    });
    return response.data;
  },
};

export default api;
