import React, { useEffect, useState } from 'react';
// Remove unused imports and add proper type definitions to avoid dependency issues
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchLeaveTypes } from '../../store/slices/leaveTypesSlice';
import { createLeaveRequest, updateLeaveRequest } from '../../store/slices/leaveRequestsSlice';
import { LeaveRequest } from '../../store/slices/leaveRequestsSlice';
import EntitySelector, { EntityType } from './EntitySelector';
import { formatDate, formatDisplayDate } from '../../utils/dateUtils';

interface LeaveRequestFormProps {
  onSuccess?: () => void;
  leaveRequest?: LeaveRequest; // For editing an existing request
  isEdit?: boolean;
}

// Define the form data interface to replace zod schema
interface LeaveRequestFormData {
  leaveTypeId: string;
  leaveMode: 'dateRange' | 'specificDates';
  startDate?: string;
  endDate?: string;
  reason: string;
  contactDetails?: string;
  entityType: EntityType;
  staffId?: string;
  doctorId?: string;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ 
  onSuccess,
  leaveRequest, 
  isEdit = false 
}) => {
  const dispatch = useAppDispatch();
  const { leaveTypes } = useAppSelector((state) => state.leaveTypes);
  const { loading, error, success } = useAppSelector((state) => state.leaveRequests);
  // Determine entity type from the leaveRequest if provided
  const getInitialEntityType = (): EntityType => {
    if (leaveRequest?.staffId) return 'staff';
    if (leaveRequest?.doctorId) return 'doctor';
    return 'staff'; // Default to staff instead of user
  };

  // Create state for form fields
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    leaveTypeId: leaveRequest?.leaveTypeId || '',
    leaveMode: (leaveRequest?.dates && leaveRequest.dates.length > 0) ? 'specificDates' : 'dateRange',
    startDate: leaveRequest?.startDate ? formatDate(new Date(leaveRequest.startDate)) : '',
    endDate: leaveRequest?.endDate ? formatDate(new Date(leaveRequest.endDate)) : '',
    reason: leaveRequest?.reason || '',
    contactDetails: leaveRequest?.contactDetails || '',
    entityType: getInitialEntityType(),
    staffId: leaveRequest?.staffId || '',
    doctorId: leaveRequest?.doctorId || '',
  });

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Helper function to format dates without date-fns
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for display
  function formatDisplayDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  useEffect(() => {
    if (leaveTypes.length === 0) {
      dispatch(fetchLeaveTypes(true)); // Passing activeOnly=true to match the expected parameter
    }
  }, [dispatch, leaveTypes.length]);

  useEffect(() => {
    if (leaveRequest?.dates && leaveRequest.dates.length > 0) {
      const dates = leaveRequest.dates.map(date => new Date(date));
      setSelectedDates(dates);
    }
  }, [leaveRequest]);

  useEffect(() => {
    if (success && onSuccess) {
      onSuccess();
    }
  }, [success, onSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEntityTypeChange = (entityType: EntityType) => {
    setFormData(prev => ({
      ...prev,
      entityType,
      staffId: entityType !== 'staff' ? '' : prev.staffId,
      doctorId: entityType !== 'doctor' ? '' : prev.doctorId,
    }));
  };

  const handleEntitySelect = (id: string) => {
    if (formData.entityType === 'staff') {
      setFormData(prev => ({
        ...prev,
        staffId: id,
        doctorId: '',
      }));
    } else if (formData.entityType === 'doctor') {
      setFormData(prev => ({
        ...prev,
        doctorId: id,
        staffId: '',
      }));
    }
  };

  const handleRadioChange = (value: 'dateRange' | 'specificDates') => {
    setFormData(prev => ({
      ...prev,
      leaveMode: value
    }));
  };
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.leaveTypeId) {
      errors.leaveTypeId = 'Leave type is required';
    }

    if (formData.leaveMode === 'dateRange') {
      if (!formData.startDate) {
        errors.startDate = 'Start date is required';
      }
      if (!formData.endDate) {
        errors.endDate = 'End date is required';
      } else if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
    } else if (formData.leaveMode === 'specificDates' && selectedDates.length === 0) {
      errors.dates = 'Please select at least one date';
    }

    if (!formData.reason || formData.reason.length < 3) {
      errors.reason = 'Please provide a reason for your leave (minimum 3 characters)';
    } else if (formData.reason.length > 500) {
      errors.reason = 'Reason is too long (maximum 500 characters)';
    }

    if (formData.entityType === 'staff' && !formData.staffId) {
      errors.staffId = 'Please select a staff member';
    } else if (formData.entityType === 'doctor' && !formData.doctorId) {
      errors.doctorId = 'Please select a doctor';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const requestData: any = {
      leaveTypeId: formData.leaveTypeId,
      reason: formData.reason,
      contactDetails: formData.contactDetails,
    };

    // Add entity-specific fields
    if (formData.entityType === 'staff' && formData.staffId) {
      requestData.staffId = formData.staffId;
    } else if (formData.entityType === 'doctor' && formData.doctorId) {
      requestData.doctorId = formData.doctorId;
    }

    if (formData.leaveMode === 'dateRange') {
      if (formData.startDate && formData.endDate) {
        requestData.startDate = formData.startDate;
        requestData.endDate = formData.endDate;
      }
    } else {
      requestData.dates = selectedDates.map(date => formatDate(date));
    }

    if (isEdit && leaveRequest?._id) {
      dispatch(updateLeaveRequest({ 
        id: leaveRequest._id, 
        data: requestData 
      }));
    } else {
      dispatch(createLeaveRequest(requestData));
    }
  };

  const handleDateSelect = (dateStr: string) => {
    const date = new Date(dateStr);
    
    setSelectedDates(prev => {
      // Check if date is already selected
      const dateExists = prev.some(d => 
        d.getDate() === date.getDate() && 
        d.getMonth() === date.getMonth() && 
        d.getFullYear() === date.getFullYear()
      );
      
      // If date exists, remove it, otherwise add it
      if (dateExists) {
        return prev.filter(d => 
          !(d.getDate() === date.getDate() && 
            d.getMonth() === date.getMonth() && 
            d.getFullYear() === date.getFullYear())
        );
      } else {
        return [...prev, date];
      }
    });
  };

  const handleRemoveDate = (index: number) => {
    setSelectedDates(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalDays = (): number => {
    if (formData.leaveMode === 'dateRange' && formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }

      // Calculate difference in days
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else if (formData.leaveMode === 'specificDates') {
      return selectedDates.length;
    }
    return 0;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {isEdit ? 'Update Leave Request' : 'Apply for Leave'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Entity Selector */}
          {!isEdit && (
            <EntitySelector
              entityType={formData.entityType}
              onEntityTypeChange={handleEntityTypeChange}
              selectedEntityId={formData.entityType === 'staff' ? formData.staffId || '' : formData.doctorId || ''}
              onEntitySelect={handleEntitySelect}
            />
          )}
          
          {/* Show error for entity selection */}
          {(validationErrors.staffId || validationErrors.doctorId) && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.staffId || validationErrors.doctorId}
            </p>
          )}
          
          {/* Leave Type */}
          <div>
            <label htmlFor="leaveTypeId" className="block text-sm font-medium text-gray-700">
              Leave Type
            </label>
            <select
              id="leaveTypeId"
              name="leaveTypeId"
              className={`mt-1 block w-full px-3 py-2 border ${
                validationErrors.leaveTypeId ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
              value={formData.leaveTypeId}
              onChange={handleInputChange}
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
            {validationErrors.leaveTypeId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.leaveTypeId}</p>
            )}
          </div>
          
          {/* Leave Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Leave Duration
            </label>
            <div className="mt-2 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="leaveMode"
                  value="dateRange"
                  checked={formData.leaveMode === 'dateRange'}
                  onChange={() => handleRadioChange('dateRange')}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Date Range</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="leaveMode"
                  value="specificDates"
                  checked={formData.leaveMode === 'specificDates'}
                  onChange={() => handleRadioChange('specificDates')}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Specific Dates</span>
              </label>
            </div>
          </div>
          
          {/* Date Range Selection */}
          {formData.leaveMode === 'dateRange' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                  min={formatDate(new Date())}
                />
                {validationErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                  min={formData.startDate || formatDate(new Date())}
                />
                {validationErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Specific Dates Selection */}
          {formData.leaveMode === 'specificDates' && (
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Select Dates
                </label>
                <button
                  type="button"
                  className="text-sm text-orange-600 hover:text-orange-800"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  {showDatePicker ? 'Hide Calendar' : 'Show Calendar'}
                </button>
              </div>
              
              {showDatePicker && (
                <div className="mt-2 border border-gray-200 rounded-md p-4">
                  <input
                    type="date"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    min={formatDate(new Date())}
                    onChange={(e) => handleDateSelect(e.target.value)}
                  />
                </div>
              )}
              
              <div className="mt-2">
                {selectedDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                        >
                          {formatDisplayDate(date)}
                          <button
                            type="button"
                            className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-orange-200"
                            onClick={() => handleRemoveDate(index)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No dates selected</p>
                )}
              </div>
              
              {validationErrors.dates && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.dates}</p>
              )}
            </div>
          )}
          
          {/* Total Days */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">
              Total Days: <span className="font-medium">{calculateTotalDays()}</span>
            </p>
          </div>
          
          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for Leave
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              value={formData.reason}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                validationErrors.reason ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
              placeholder="Please provide a reason for your leave request"
            ></textarea>
            {validationErrors.reason && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.reason}</p>
            )}
          </div>
          
          {/* Contact Details */}
          <div>
            <label htmlFor="contactDetails" className="block text-sm font-medium text-gray-700">
              Contact Details During Leave (Optional)
            </label>
            <input
              type="text"
              id="contactDetails"
              name="contactDetails"
              value={formData.contactDetails || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Phone number or emergency contact"
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isEdit ? 'Update Leave Request' : 'Submit Leave Request'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm;
