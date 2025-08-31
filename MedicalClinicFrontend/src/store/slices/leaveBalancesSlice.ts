import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import leaveManagementService from '../../services/leaveManagement';

export interface LeaveBalanceDetail {
  leaveTypeId: string;
  leaveTypeName: string;
  allocated: number;
  used: number;
  pending: number;
  carryForward: number;
  available: number;
}

export interface LeaveBalance {
  _id: string;
  userId: string;
  year: number;
  balances: LeaveBalanceDetail[];
  createdAt: string;
  updatedAt: string;
}

interface LeaveBalancesState {
  myBalances: LeaveBalance | null;
  userBalances: { [userId: string]: LeaveBalance };
  allBalances: LeaveBalance[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaveBalancesState = {
  myBalances: null,
  userBalances: {},
  allBalances: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchMyLeaveBalances = createAsyncThunk(
  'leaveBalances/fetchMy',
  async (year: number = new Date().getFullYear(), { rejectWithValue }) => {
    try {
      return await leaveManagementService.fetchMyLeaveBalances(year);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave balances');
    }
  }
);

export const createLeaveBalance = createAsyncThunk(
  'leaveBalances/create',
  async (balanceData: {
    userId: string;
    leaveTypeId: string;
    year: number;
    allocated: number;
    used: number;
    pending: number;
    available: number;
  }, { rejectWithValue }) => {
    try {
      return await leaveManagementService.createLeaveBalance(balanceData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave balance');
    }
  }
);

export const fetchUserLeaveBalances = createAsyncThunk(
  'leaveBalances/fetchUser',
  async ({ userId, year = new Date().getFullYear() }: { userId: string; year?: number }, { rejectWithValue }) => {
    try {
      const data = await leaveManagementService.fetchUserLeaveBalances(userId, year);
      return { userId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user leave balances');
    }
  }
);

export const fetchAllUserLeaveBalances = createAsyncThunk(
  'leaveBalances/fetchAll',
  async (year: number = new Date().getFullYear(), { rejectWithValue }) => {
    try {
      return await leaveManagementService.fetchAllUserLeaveBalances(year);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all leave balances');
    }
  }
);

export const updateLeaveAllocation = createAsyncThunk(
  'leaveBalances/updateAllocation',
  async (
    {
      userId,
      leaveTypeId,
      days,
      year = new Date().getFullYear(),
    }: {
      userId: string;
      leaveTypeId: string;
      days: number;
      year?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await leaveManagementService.updateLeaveAllocation(userId, leaveTypeId, days, year);
      return { userId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave allocation');
    }
  }
);

export const updateLeaveCarryForward = createAsyncThunk(
  'leaveBalances/updateCarryForward',
  async (
    {
      userId,
      leaveTypeId,
      days,
      fromYear,
      toYear,
    }: {
      userId: string;
      leaveTypeId: string;
      days: number;
      fromYear: number;
      toYear: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await leaveManagementService.updateLeaveCarryForward(
        userId,
        leaveTypeId,
        days,
        fromYear,
        toYear
      );
      return { userId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave carry forward');
    }
  }
);

const leaveBalancesSlice = createSlice({
  name: 'leaveBalances',
  initialState,
  reducers: {
    clearLeaveBalancesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my leave balances
      .addCase(fetchMyLeaveBalances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaveBalances.fulfilled, (state, action: PayloadAction<LeaveBalance>) => {
        state.loading = false;
        state.myBalances = action.payload;
      })
      .addCase(fetchMyLeaveBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user leave balances
      .addCase(fetchUserLeaveBalances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserLeaveBalances.fulfilled, (state, action: PayloadAction<{ userId: string; data: LeaveBalance }>) => {
        state.loading = false;
        state.userBalances[action.payload.userId] = action.payload.data;
      })
      .addCase(fetchUserLeaveBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch all user leave balances
      .addCase(fetchAllUserLeaveBalances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserLeaveBalances.fulfilled, (state, action: PayloadAction<LeaveBalance[]>) => {
        state.loading = false;
        state.allBalances = action.payload;
      })
      .addCase(fetchAllUserLeaveBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update leave allocation
      .addCase(updateLeaveAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveAllocation.fulfilled, (state, action: PayloadAction<{ userId: string; data: LeaveBalance }>) => {
        state.loading = false;
        state.userBalances[action.payload.userId] = action.payload.data;
        
        // Also update allBalances if this user is in there
        const index = state.allBalances.findIndex(balance => balance.userId === action.payload.userId);
        if (index !== -1) {
          state.allBalances[index] = action.payload.data;
        }
        
        // Update myBalances if this is the current user
        if (state.myBalances && state.myBalances.userId === action.payload.userId) {
          state.myBalances = action.payload.data;
        }
      })
      .addCase(updateLeaveAllocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update leave carry forward
      .addCase(updateLeaveCarryForward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveCarryForward.fulfilled, (state, action: PayloadAction<{ userId: string; data: LeaveBalance }>) => {
        state.loading = false;
        state.userBalances[action.payload.userId] = action.payload.data;
        
        // Also update allBalances if this user is in there
        const index = state.allBalances.findIndex(balance => balance.userId === action.payload.userId);
        if (index !== -1) {
          state.allBalances[index] = action.payload.data;
        }
        
        // Update myBalances if this is the current user
        if (state.myBalances && state.myBalances.userId === action.payload.userId) {
          state.myBalances = action.payload.data;
        }
      })      .addCase(updateLeaveCarryForward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create leave balance
      .addCase(createLeaveBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeaveBalance.fulfilled, (state, action: PayloadAction<LeaveBalance>) => {
        state.loading = false;
        
        // Update appropriate collections
        if (action.payload.userId) {
          state.userBalances[action.payload.userId] = action.payload;
          
          // Add to allBalances if not already there
          const index = state.allBalances.findIndex(balance => 
            balance.userId === action.payload.userId && 
            balance.year === action.payload.year
          );
          
          if (index !== -1) {
            state.allBalances[index] = action.payload;
          } else {
            state.allBalances.push(action.payload);
          }
        }
      })
      .addCase(createLeaveBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLeaveBalancesError } = leaveBalancesSlice.actions;
export default leaveBalancesSlice.reducer;
