import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import staffService from '../../services/staffService';

export interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  status: 'active' | 'inactive';
  joinDate?: string | Date;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

interface StaffState {
  staff: Staff[];
  currentStaff: Staff | null;
  loading: boolean;
  error: string | null;
}

const initialState: StaffState = {
  staff: [],
  currentStaff: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllStaff = createAsyncThunk(
  'staff/fetchAll',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await staffService.fetchAllStaff(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff');
    }
  }
);

export const fetchStaffById = createAsyncThunk(
  'staff/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await staffService.fetchStaffById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff member');
    }
  }
);

export const createStaff = createAsyncThunk(
  'staff/create',
  async (staffData: any, { rejectWithValue }) => {
    try {
      return await staffService.createStaff(staffData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create staff member');
    }
  }
);

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ id, staffData }: { id: string; staffData: any }, { rejectWithValue }) => {
    try {
      return await staffService.updateStaff(id, staffData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update staff member');
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearStaffError: (state) => {
      state.error = null;
    },
    clearCurrentStaff: (state) => {
      state.currentStaff = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all staff
      .addCase(fetchAllStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action: PayloadAction<Staff[]>) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchAllStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch staff by id
      .addCase(fetchStaffById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffById.fulfilled, (state, action: PayloadAction<Staff>) => {
        state.loading = false;
        state.currentStaff = action.payload;
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearStaffError, clearCurrentStaff } = staffSlice.actions;
export default staffSlice.reducer;
