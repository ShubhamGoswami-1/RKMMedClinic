import api from './api';

// Leave Types
export const fetchLeaveTypes = async (activeOnly = true) => {
  try {
    const response = await api.get(`/leave-types?activeOnly=${activeOnly}`);
    return response.data.data.leaveTypes;
  } catch (error) {
    console.error('Error fetching leave types:', error);
    throw error;
  }
};

export const fetchLeaveTypeById = async (id: string) => {
  try {
    const response = await api.get(`/leave-types/${id}`);
    return response.data.data.leaveType;
  } catch (error) {
    console.error(`Error fetching leave type ${id}:`, error);
    throw error;
  }
};

export const createLeaveType = async (leaveTypeData: any) => {
  try {
    const response = await api.post('/leave-types', leaveTypeData);
    return response.data.data.leaveType;
  } catch (error) {
    console.error('Error creating leave type:', error);
    throw error;
  }
};

export const updateLeaveType = async (id: string, leaveTypeData: any) => {
  try {
    const response = await api.patch(`/leave-types/${id}`, leaveTypeData);
    return response.data.data.leaveType;
  } catch (error) {
    console.error(`Error updating leave type ${id}:`, error);
    throw error;
  }
};

export const deleteLeaveType = async (id: string) => {
  try {
    await api.delete(`/leave-types/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting leave type ${id}:`, error);
    throw error;
  }
};

// Leave Balances
export const fetchMyLeaveBalances = async (year = new Date().getFullYear()) => {
  try {
    const response = await api.get(`/leave-balances/my?year=${year}`);
    return response.data.data.leaveBalances;
  } catch (error) {
    console.error('Error fetching my leave balances:', error);
    throw error;
  }
};

export const createLeaveBalance = async (balanceData: {
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}) => {
  try {
    const response = await api.post('/leave-balances', balanceData);
    return response.data.data.leaveBalance;
  } catch (error) {
    console.error('Error creating leave balance:', error);
    throw error;
  }
};

export const fetchUserLeaveBalances = async (userId: string, year = new Date().getFullYear()) => {
  try {
    const response = await api.get(`/leave-balances/user/${userId}?year=${year}`);
    return response.data.data.leaveBalances;
  } catch (error) {
    console.error(`Error fetching leave balances for user ${userId}:`, error);
    throw error;
  }
};

export const fetchAllUserLeaveBalances = async (year = new Date().getFullYear()) => {
  try {
    const response = await api.get(`/leave-balances?year=${year}`);
    return response.data.data.leaveBalances;
  } catch (error) {
    console.error('Error fetching all user leave balances:', error);
    throw error;
  }
};

export const updateLeaveAllocation = async (userId: string, leaveTypeId: string, days: number, year = new Date().getFullYear()) => {
  try {
    const response = await api.patch(`/leave-balances/user/${userId}/allocate`, {
      leaveTypeId,
      days,
      year
    });
    return response.data.data.leaveBalance;
  } catch (error) {
    console.error(`Error updating leave allocation for user ${userId}:`, error);
    throw error;
  }
};

export const updateLeaveCarryForward = async (userId: string, leaveTypeId: string, days: number, fromYear: number, toYear: number) => {
  try {
    const response = await api.patch(`/leave-balances/user/${userId}/carry-forward`, {
      leaveTypeId,
      days,
      fromYear,
      toYear
    });
    return response.data.data.leaveBalance;
  } catch (error) {
    console.error(`Error updating leave carry forward for user ${userId}:`, error);
    throw error;
  }
};

// Leave Requests
export const fetchMyLeaveRequests = async (filters = {}) => {
  try {
    const response = await api.get('/leave-requests/my', { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error('Error fetching my leave requests:', error);
    throw error;
  }
};

export const fetchUserLeaveRequests = async (userId: string, filters = {}) => {
  try {
    const response = await api.get(`/leave-requests/user/${userId}`, { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error(`Error fetching leave requests for user ${userId}:`, error);
    throw error;
  }
};

export const fetchAllLeaveRequests = async (filters = {}) => {
  try {
    const response = await api.get('/leave-requests', { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    throw error;
  }
};

export const fetchLeaveRequestById = async (id: string) => {
  try {
    const response = await api.get(`/leave-requests/${id}`);
    return response.data.data.leaveRequest;
  } catch (error) {
    console.error(`Error fetching leave request ${id}:`, error);
    throw error;
  }
};

export const createLeaveRequest = async (leaveRequestData: any) => {
  try {
    const response = await api.post('/leave-requests', leaveRequestData);
    return response.data.data.leaveRequest;
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

export const updateLeaveRequest = async (id: string, leaveRequestData: any) => {
  try {
    const response = await api.patch(`/leave-requests/${id}`, leaveRequestData);
    return response.data.data.leaveRequest;
  } catch (error) {
    console.error(`Error updating leave request ${id}:`, error);
    throw error;
  }
};

export const cancelLeaveRequest = async (id: string) => {
  try {
    const response = await api.patch(`/leave-requests/${id}/cancel`);
    return response.data.data.leaveRequest;
  } catch (error) {
    console.error(`Error canceling leave request ${id}:`, error);
    throw error;
  }
};

export const approveLeaveRequest = async (id: string, comments?: string) => {
  try {
    const response = await api.patch(`/leave-requests/${id}/approve`, { comments });
    return response.data.data.leaveRequest;
  } catch (error) {
    console.error(`Error approving leave request ${id}:`, error);
    throw error;
  }
};

export const rejectLeaveRequest = async (id: string, comments: string) => {
  try {
    const response = await api.patch(`/leave-requests/${id}/reject`, { comments });
    return response.data.data.leaveRequest;
  } catch (error) {
    console.error(`Error rejecting leave request ${id}:`, error);
    throw error;
  }
};

// Staff Leave Requests
export const fetchStaffLeaveRequests = async (staffId: string, filters = {}) => {
  try {
    const response = await api.get(`/leave-requests/staff/${staffId}`, { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error(`Error fetching leave requests for staff ${staffId}:`, error);
    throw error;
  }
};

// Doctor Leave Requests
export const fetchDoctorLeaveRequests = async (doctorId: string, filters = {}) => {
  try {
    const response = await api.get(`/leave-requests/doctor/${doctorId}`, { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error(`Error fetching leave requests for doctor ${doctorId}:`, error);
    throw error;
  }
};

const leaveManagementService = {
  // Leave Types
  fetchLeaveTypes,
  fetchLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  
  // Leave Balances
  fetchMyLeaveBalances,
  fetchUserLeaveBalances,
  fetchAllUserLeaveBalances,
  updateLeaveAllocation,
  updateLeaveCarryForward,
  
  // Leave Requests
  fetchMyLeaveRequests,
  fetchUserLeaveRequests,
  fetchAllLeaveRequests,
  fetchLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,

  // Staff Leave Requests
  fetchStaffLeaveRequests,

  // Doctor Leave Requests
  fetchDoctorLeaveRequests
};

export default leaveManagementService;
