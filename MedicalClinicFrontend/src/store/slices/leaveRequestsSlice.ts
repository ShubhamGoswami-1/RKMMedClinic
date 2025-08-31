import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import leaveManagementService from '../../services/leaveManagement';

export interface LeaveRequest {
  _id: string;
  userId?: string;
  userName?: string;
  staffId?: string;
  staffName?: string;
  doctorId?: string;
  doctorName?: string;
  requestedBy?: string;
  requestedByName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  startDate?: string;
  endDate?: string;
  dates?: string[];
  reason?: string;
  contactDetails?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  rejectedBy?: string;
  cancelledBy?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveRequestsState {
  myRequests: LeaveRequest[];
  userRequests: { [userId: string]: LeaveRequest[] };
  staffRequests: { [staffId: string]: LeaveRequest[] };
  doctorRequests: { [doctorId: string]: LeaveRequest[] };
  allRequests: LeaveRequest[];
  currentRequest: LeaveRequest | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: LeaveRequestsState = {
  myRequests: [],
  userRequests: {},
  staffRequests: {},
  doctorRequests: {},
  allRequests: [],
  currentRequest: null,
  loading: false,
  error: null,
  success: null,
};

// Async thunks
export const fetchMyLeaveRequests = createAsyncThunk(
  'leaveRequests/fetchMy',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await leaveManagementService.fetchMyLeaveRequests(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave requests');
    }
  }
);

export const fetchUserLeaveRequests = createAsyncThunk(
  'leaveRequests/fetchUser',
  async ({ userId, filters = {} }: { userId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const data = await leaveManagementService.fetchUserLeaveRequests(userId, filters);
      return { userId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user leave requests');
    }
  }
);

export const fetchStaffLeaveRequests = createAsyncThunk(
  'leaveRequests/fetchStaff',
  async ({ staffId, filters = {} }: { staffId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const data = await leaveManagementService.fetchStaffLeaveRequests(staffId, filters);
      return { staffId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff leave requests');
    }
  }
);

export const fetchDoctorLeaveRequests = createAsyncThunk(
  'leaveRequests/fetchDoctor',
  async ({ doctorId, filters = {} }: { doctorId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const data = await leaveManagementService.fetchDoctorLeaveRequests(doctorId, filters);
      return { doctorId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctor leave requests');
    }
  }
);

export const fetchAllLeaveRequests = createAsyncThunk(
  'leaveRequests/fetchAll',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await leaveManagementService.fetchAllLeaveRequests(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all leave requests');
    }
  }
);

export const fetchLeaveRequestById = createAsyncThunk(
  'leaveRequests/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await leaveManagementService.fetchLeaveRequestById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave request');
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  'leaveRequests/create',
  async (leaveRequestData: Partial<LeaveRequest>, { rejectWithValue }) => {
    try {
      return await leaveManagementService.createLeaveRequest(leaveRequestData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave request');
    }
  }
);

export const updateLeaveRequest = createAsyncThunk(
  'leaveRequests/update',
  async ({ id, data }: { id: string; data: Partial<LeaveRequest> }, { rejectWithValue }) => {
    try {
      return await leaveManagementService.updateLeaveRequest(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave request');
    }
  }
);

export const cancelLeaveRequest = createAsyncThunk(
  'leaveRequests/cancel',
  async (id: string, { rejectWithValue }) => {
    try {
      return await leaveManagementService.cancelLeaveRequest(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel leave request');
    }
  }
);

export const approveLeaveRequest = createAsyncThunk(
  'leaveRequests/approve',
  async ({ id, comments }: { id: string; comments?: string }, { rejectWithValue }) => {
    try {
      return await leaveManagementService.approveLeaveRequest(id, comments);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve leave request');
    }
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  'leaveRequests/reject',
  async ({ id, comments }: { id: string; comments: string }, { rejectWithValue }) => {
    try {
      return await leaveManagementService.rejectLeaveRequest(id, comments);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject leave request');
    }
  }
);

const leaveRequestsSlice = createSlice({
  name: 'leaveRequests',
  initialState,
  reducers: {
    clearLeaveRequestsError: (state) => {
      state.error = null;
    },
    clearLeaveRequestsSuccess: (state) => {
      state.success = null;
    },
    clearCurrentRequest: (state) => {
      state.currentRequest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my leave requests
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action: PayloadAction<LeaveRequest[]>) => {
        state.loading = false;
        state.myRequests = action.payload;
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user leave requests
      .addCase(fetchUserLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserLeaveRequests.fulfilled, (state, action: PayloadAction<{ userId: string; data: LeaveRequest[] }>) => {
        state.loading = false;
        state.userRequests[action.payload.userId] = action.payload.data;
      })
      .addCase(fetchUserLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch staff leave requests
      .addCase(fetchStaffLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffLeaveRequests.fulfilled, (state, action: PayloadAction<{ staffId: string; data: LeaveRequest[] }>) => {
        state.loading = false;
        state.staffRequests[action.payload.staffId] = action.payload.data;
      })
      .addCase(fetchStaffLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch doctor leave requests
      .addCase(fetchDoctorLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorLeaveRequests.fulfilled, (state, action: PayloadAction<{ doctorId: string; data: LeaveRequest[] }>) => {
        state.loading = false;
        state.doctorRequests[action.payload.doctorId] = action.payload.data;
      })
      .addCase(fetchDoctorLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch all leave requests
      .addCase(fetchAllLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLeaveRequests.fulfilled, (state, action: PayloadAction<LeaveRequest[]>) => {
        state.loading = false;
        state.allRequests = action.payload;
      })
      .addCase(fetchAllLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch leave request by ID
      .addCase(fetchLeaveRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveRequestById.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.loading = false;
        state.currentRequest = action.payload;
      })
      .addCase(fetchLeaveRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create leave request
      .addCase(createLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.loading = false;
        state.myRequests.unshift(action.payload);
        state.success = 'Leave request submitted successfully';
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update leave request
      .addCase(updateLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.loading = false;
        
        // Update in myRequests
        const myIndex = state.myRequests.findIndex(req => req._id === action.payload._id);
        if (myIndex !== -1) {
          state.myRequests[myIndex] = action.payload;
        }
        
        // Update in allRequests
        const allIndex = state.allRequests.findIndex(req => req._id === action.payload._id);
        if (allIndex !== -1) {
          state.allRequests[allIndex] = action.payload;
        }
        
        // Update in userRequests if present
        if (state.userRequests[action.payload.userId]) {
          const userIndex = state.userRequests[action.payload.userId].findIndex(
            req => req._id === action.payload._id
          );
          if (userIndex !== -1) {
            state.userRequests[action.payload.userId][userIndex] = action.payload;
          }
        }
        
        // Update currentRequest if this is the one being viewed
        if (state.currentRequest && state.currentRequest._id === action.payload._id) {
          state.currentRequest = action.payload;
        }
        
        state.success = 'Leave request updated successfully';
      })
      .addCase(updateLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Cancel leave request
      .addCase(cancelLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(cancelLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.loading = false;
        
        // Update in myRequests
        const myIndex = state.myRequests.findIndex(req => req._id === action.payload._id);
        if (myIndex !== -1) {
          state.myRequests[myIndex] = action.payload;
        }
        
        // Update in allRequests
        const allIndex = state.allRequests.findIndex(req => req._id === action.payload._id);
        if (allIndex !== -1) {
          state.allRequests[allIndex] = action.payload;
        }
        
        // Update in userRequests if present
        if (state.userRequests[action.payload.userId]) {
          const userIndex = state.userRequests[action.payload.userId].findIndex(
            req => req._id === action.payload._id
          );
          if (userIndex !== -1) {
            state.userRequests[action.payload.userId][userIndex] = action.payload;
          }
        }
        
        // Update currentRequest if this is the one being viewed
        if (state.currentRequest && state.currentRequest._id === action.payload._id) {
          state.currentRequest = action.payload;
        }
        
        state.success = 'Leave request cancelled successfully';
      })
      .addCase(cancelLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Approve leave request
      .addCase(approveLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(approveLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.loading = false;
        
        // Update in myRequests if it belongs to current user
        const myIndex = state.myRequests.findIndex(req => req._id === action.payload._id);
        if (myIndex !== -1) {
          state.myRequests[myIndex] = action.payload;
        }
        
        // Update in allRequests
        const allIndex = state.allRequests.findIndex(req => req._id === action.payload._id);
        if (allIndex !== -1) {
          state.allRequests[allIndex] = action.payload;
        }
        
        // Update in userRequests if present
        if (state.userRequests[action.payload.userId]) {
          const userIndex = state.userRequests[action.payload.userId].findIndex(
            req => req._id === action.payload._id
          );
          if (userIndex !== -1) {
            state.userRequests[action.payload.userId][userIndex] = action.payload;
          }
        }
        
        // Update currentRequest if this is the one being viewed
        if (state.currentRequest && state.currentRequest._id === action.payload._id) {
          state.currentRequest = action.payload;
        }
        
        state.success = 'Leave request approved successfully';
      })
      .addCase(approveLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reject leave request
      .addCase(rejectLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.loading = false;
        
        // Update in myRequests if it belongs to current user
        const myIndex = state.myRequests.findIndex(req => req._id === action.payload._id);
        if (myIndex !== -1) {
          state.myRequests[myIndex] = action.payload;
        }
        
        // Update in allRequests
        const allIndex = state.allRequests.findIndex(req => req._id === action.payload._id);
        if (allIndex !== -1) {
          state.allRequests[allIndex] = action.payload;
        }
        
        // Update in userRequests if present
        if (state.userRequests[action.payload.userId]) {
          const userIndex = state.userRequests[action.payload.userId].findIndex(
            req => req._id === action.payload._id
          );
          if (userIndex !== -1) {
            state.userRequests[action.payload.userId][userIndex] = action.payload;
          }
        }
        
        // Update currentRequest if this is the one being viewed
        if (state.currentRequest && state.currentRequest._id === action.payload._id) {
          state.currentRequest = action.payload;
        }
        
        state.success = 'Leave request rejected successfully';
      })
      .addCase(rejectLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLeaveRequestsError, clearLeaveRequestsSuccess, clearCurrentRequest } = leaveRequestsSlice.actions;
export default leaveRequestsSlice.reducer;
