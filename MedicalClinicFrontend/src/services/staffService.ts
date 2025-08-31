import api from './api';

// Staff
export const fetchAllStaff = async (filters = {}) => {
  try {
    const response = await api.get('/staff', { params: filters });
    return response.data.data.staff;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

export const fetchStaffById = async (id: string) => {
  try {
    const response = await api.get(`/staff/${id}`);
    return response.data.data.staff;
  } catch (error) {
    console.error(`Error fetching staff ${id}:`, error);
    throw error;
  }
};

export const createStaff = async (staffData: any) => {
  try {
    const response = await api.post('/staff', staffData);
    return response.data.data.staff;
  } catch (error) {
    console.error('Error creating staff:', error);
    throw error;
  }
};

export const updateStaff = async (id: string, staffData: any) => {
  try {
    const response = await api.patch(`/staff/${id}`, staffData);
    return response.data.data.staff;
  } catch (error) {
    console.error(`Error updating staff ${id}:`, error);
    throw error;
  }
};

export const fetchStaffLeaveRequests = async (staffId: string, filters = {}) => {
  try {
    const response = await api.get(`/leave-requests/staff/${staffId}`, { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error(`Error fetching leave requests for staff ${staffId}:`, error);
    throw error;
  }
};

const staffService = {
  fetchAllStaff,
  fetchStaffById,
  createStaff,
  updateStaff,
  fetchStaffLeaveRequests
};

export default staffService;
