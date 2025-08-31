import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import leaveManagementService from '../../services/leaveManagement';

export interface LeaveType {
  _id: string;
  name: string;
  description?: string;
  defaultDays: number;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LeaveTypesState {
  leaveTypes: LeaveType[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaveTypesState = {
  leaveTypes: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchLeaveTypes = createAsyncThunk(
  'leaveTypes/fetchAll',
  async (activeOnly: boolean = true, { rejectWithValue }) => {
    try {
      return await leaveManagementService.fetchLeaveTypes(activeOnly);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave types');
    }
  }
);

export const createLeaveType = createAsyncThunk(
  'leaveTypes/create',
  async (leaveTypeData: Partial<LeaveType>, { rejectWithValue }) => {
    try {
      return await leaveManagementService.createLeaveType(leaveTypeData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave type');
    }
  }
);

export const updateLeaveType = createAsyncThunk(
  'leaveTypes/update',
  async ({ id, data }: { id: string; data: Partial<LeaveType> }, { rejectWithValue }) => {
    try {
      return await leaveManagementService.updateLeaveType(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave type');
    }
  }
);

export const deleteLeaveType = createAsyncThunk(
  'leaveTypes/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await leaveManagementService.deleteLeaveType(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete leave type');
    }
  }
);

const leaveTypesSlice = createSlice({
  name: 'leaveTypes',
  initialState,
  reducers: {
    clearLeaveTypesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leave types
      .addCase(fetchLeaveTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveTypes.fulfilled, (state, action: PayloadAction<LeaveType[]>) => {
        state.loading = false;
        state.leaveTypes = action.payload;
      })
      .addCase(fetchLeaveTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create leave type
      .addCase(createLeaveType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeaveType.fulfilled, (state, action: PayloadAction<LeaveType>) => {
        state.loading = false;
        state.leaveTypes.push(action.payload);
      })
      .addCase(createLeaveType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update leave type
      .addCase(updateLeaveType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveType.fulfilled, (state, action: PayloadAction<LeaveType>) => {
        state.loading = false;
        const index = state.leaveTypes.findIndex(type => type._id === action.payload._id);
        if (index !== -1) {
          state.leaveTypes[index] = action.payload;
        }
      })
      .addCase(updateLeaveType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete leave type
      .addCase(deleteLeaveType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLeaveType.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.leaveTypes = state.leaveTypes.filter(type => type._id !== action.payload);
      })
      .addCase(deleteLeaveType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLeaveTypesError } = leaveTypesSlice.actions;
export default leaveTypesSlice.reducer;
