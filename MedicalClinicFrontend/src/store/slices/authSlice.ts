import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  role: 'admin' | 'doctor' | 'staff' | 'accountant';
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,
};

// Async thunk for validating token and loading user data
export const validateTokenAndLoadUser = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      // Check if token is valid and get user data in one call
      const validationResponse = await authService.validateToken();
      if (!validationResponse) {
        return rejectWithValue('Invalid token');
      }
      
      // Return user data directly from the validation response
      return validationResponse.data.user;
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || 'Authentication failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    },
    setAuthFromToken: (state, action: PayloadAction<{ user: User }>) => {
      if (state.token) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateTokenAndLoadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateTokenAndLoadUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(validateTokenAndLoadUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = action.payload as string;
        localStorage.removeItem('token');
      });
  },
});

export const { loginSuccess, logout, setAuthFromToken, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// Helper functions for role-based access control
export const hasRole = (user: User | null, roles: string | string[]): boolean => {
  if (!user) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  
  return user.role === roles;
};