import api from './api';

// Doctors
export const fetchAllDoctors = async (filters = {}) => {
  try {
    const response = await api.get('/doctors', { params: filters });
    return response.data.data.doctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

export const fetchDoctorById = async (id: string) => {
  try {
    const response = await api.get(`/doctors/${id}`);
    return response.data.data.doctor;
  } catch (error) {
    console.error(`Error fetching doctor ${id}:`, error);
    throw error;
  }
};

export const fetchDoctorLeaveRequests = async (doctorId: string, filters = {}) => {
  try {
    const response = await api.get(`/leave-requests/doctor/${doctorId}`, { params: filters });
    return response.data.data.leaveRequests;
  } catch (error) {
    console.error(`Error fetching leave requests for doctor ${doctorId}:`, error);
    throw error;
  }
};

const doctorService = {
  fetchAllDoctors,
  fetchDoctorById,
  fetchDoctorLeaveRequests
};

export default doctorService;
