import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import leaveTypesReducer from './slices/leaveTypesSlice';
import leaveBalancesReducer from './slices/leaveBalancesSlice';
import leaveRequestsReducer from './slices/leaveRequestsSlice';
import staffReducer from './slices/staffSlice';
import doctorsReducer from './slices/doctorsSlice';
import departmentsReducer from './slices/departmentsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leaveTypes: leaveTypesReducer,
    leaveBalances: leaveBalancesReducer,
    leaveRequests: leaveRequestsReducer,
    staff: staffReducer,
    doctors: doctorsReducer,
    departments: departmentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;