// Define interface for department
export interface Department {
  id: string;
  _id?: string;  // Add _id for MongoDB compatibility
  name: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Define interface for doctor
export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  departmentName?: string;
  specialization: string;
  active: boolean;
  email?: string;
  phone?: string;
  qualification?: string;
  licenseNumber?: string;
  joiningDate?: string;
  availableDays?: string[];
  availableTimeSlots?: {
    startTime: string;
    endTime: string;
  }[];
  profileImage?: string;
}

// Define interface for patient
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  aadharNumber?: string;
  panNumber?: string;
}

// Define interface for appointment
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: string;
}

// Define interface for appointment data used in forms
export interface AppointmentFormData {
  departmentId: string;
  doctorId: string;
  appointmentDate: string;
  reason: string;
}
