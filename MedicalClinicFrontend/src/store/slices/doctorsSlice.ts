import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import doctorService from '../../services/doctorService';

export interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  specialization: string;
  status: 'active' | 'inactive';
  linkedUserId?: string;
}

interface DoctorState {
  doctors: Doctor[];
  currentDoctor: Doctor | null;
  loading: boolean;
  error: string | null;
}

const initialState: DoctorState = {
  doctors: [],
  currentDoctor: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllDoctors = createAsyncThunk(
  'doctors/fetchAll',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await doctorService.fetchAllDoctors(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

export const fetchDoctorById = createAsyncThunk(
  'doctors/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await doctorService.fetchDoctorById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctor');
    }
  }
);

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearDoctorError: (state) => {
      state.error = null;
    },
    clearCurrentDoctor: (state) => {
      state.currentDoctor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all doctors
      .addCase(fetchAllDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDoctors.fulfilled, (state, action: PayloadAction<Doctor[]>) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchAllDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch doctor by id
      .addCase(fetchDoctorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action: PayloadAction<Doctor>) => {
        state.loading = false;
        state.currentDoctor = action.payload;
      })
      .addCase(fetchDoctorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDoctorError, clearCurrentDoctor } = doctorsSlice.actions;
export default doctorsSlice.reducer;
