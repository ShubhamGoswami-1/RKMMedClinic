import React from 'react';
import { Calendar, User } from 'lucide-react';
import { Doctor, Department, Patient } from '../../types/models';

interface AppointmentFormProps {
  selectedPatient: Patient;
  departments: Department[];
  doctors: Doctor[];
  filteredDoctors: Doctor[];
  appointmentData: {
    departmentId: string;
    doctorId: string;
    appointmentDate: string;
    reason: string;
  };
  handleAppointmentChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isLoadingData: boolean;
  onCancel: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  selectedPatient,
  departments,
  doctors,
  filteredDoctors,
  appointmentData,
  handleAppointmentChange,
  handleSubmit,
  isLoading,
  isLoadingData,
  onCancel
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Patient information */}
        <div className="flex flex-col justify-center items-center p-6 rounded-lg">
          <div className="relative w-full max-w-md">
            {/* SVG illustration - simplified for clarity */}
            <div className="w-full h-64 flex items-center justify-center">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 800 600" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="200" y="150" width="400" height="350" rx="20" fill="#ffffff" />
                <rect x="200" y="150" width="400" height="60" rx="20" fill="#ff6b35" />
                {/* Calendar current day */}
                <rect 
                  x="295" 
                  y="350" 
                  width="50" 
                  height="40" 
                  rx="5" 
                  fill="#bfdbfe"
                  className="animate-pulse"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <text x="320" y="375" fontSize="18" fontWeight="bold" fill="#1e3a8a" textAnchor="middle">
                  {new Date().getDate()}
                </text>
              </svg>
            </div>
          </div>
          
          {/* Patient information card */}
          <div className="bg-white rounded-lg shadow-md p-4 mt-6 w-full max-w-md border-l-4 border-blue-500">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Patient Information</h3>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <div className="text-lg font-medium text-gray-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1)} | 
                  DOB: {selectedPatient.dateOfBirth} | 
                  Phone: {selectedPatient.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Appointment form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Book Your Appointment</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                {isLoadingData ? (
                  <div className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-gray-50 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 mr-2"></div>
                    Loading departments...
                  </div>
                ) : (                  <select
                    id="departmentId"
                    name="departmentId"
                    required
                    value={appointmentData.departmentId}
                    onChange={(e) => {
                      // Get the selected department's MongoDB ID from the departments array
                      const selectedDeptId = e.target.value;
                      console.log('Department selected in form:', selectedDeptId);
                      console.log('Selected department option text:', e.target.options[e.target.selectedIndex].text);
                      
                      // Find the selected department to verify its ID
                      const selectedDept = departments.find(d => d.id === selectedDeptId);
                      console.log('Selected department full object:', selectedDept);
                      
                      // Verify MongoDB ID format (24 chars hexadecimal)
                      const isValidMongoId = selectedDeptId && /^[0-9a-fA-F]{24}$/.test(selectedDeptId);
                      console.log('Is valid MongoDB ID format:', isValidMongoId);
                      
                      if (selectedDeptId && !isValidMongoId) {
                        console.warn('Warning: Selected department ID is not in MongoDB format:', selectedDeptId);
                      }
                      
                      // Add this check to prevent empty or invalid selection
                      if (!selectedDeptId || selectedDeptId === '') {
                        console.warn('Empty department selection detected');
                      }
                      
                      // Always pass the raw selected value to the handler
                      handleAppointmentChange(e);
                    }}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => {
                      // Verify the department has a valid ID
                      const isValidId = dept.id && /^[0-9a-fA-F]{24}$/.test(dept.id);
                      if (!isValidId) {
                        console.warn(`Department "${dept.name}" has invalid ID format:`, dept.id);
                      }
                      
                      console.log('Department option:', dept.id, dept.name);
                      return (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      );
                    })}
                  </select>
                )}
              </div>
              
              <div>
                <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                {isLoadingData ? (
                  <div className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-gray-50 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 mr-2"></div>
                    Loading doctors...
                  </div>
                ) : (
                  <select
                    id="doctorId"
                    name="doctorId"
                    required
                    value={appointmentData.doctorId}
                    onChange={handleAppointmentChange}
                    disabled={!appointmentData.departmentId}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Select doctor</option>
                    {filteredDoctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>Dr. {doctor.firstName} {doctor.lastName}</option>
                    ))}
                  </select>
                )}
                {!isLoadingData && !appointmentData.departmentId && (
                  <p className="mt-1 text-sm text-gray-500">Please select a department first</p>
                )}
                {!isLoadingData && appointmentData.departmentId && filteredDoctors.length === 0 && (
                  <div className="mt-1">
                    <p className="text-sm text-red-500">No doctors available for this department</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try selecting a different department or contact the clinic administrator.
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                <div className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-blue-50 text-gray-700 flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  {new Date(appointmentData.appointmentDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} <span className="ml-2 text-blue-600 font-medium">(Today)</span>
                </div>
                <input
                  type="hidden"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={appointmentData.appointmentDate}
                />
              </div>
              
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit *</label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  rows={4}
                  value={appointmentData.reason}
                  onChange={handleAppointmentChange}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Please describe your symptoms or reason for this appointment"
                ></textarea>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 flex items-center shadow-md transition-all duration-200 hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;
