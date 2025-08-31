import { DoctorService } from '../services/doctor.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for doctor-related endpoints
 */
export class DoctorController {
  /**
   * Get all doctors
   * @route GET /api/v1/doctors
   */
  static getAllDoctors = asyncErrorHandler(async (req, res, next) => {
    const { activeOnly = 'true' } = req.query;
    
    // Convert query param to boolean
    const showActiveOnly = activeOnly === 'true';
    
    const doctors = await DoctorService.getAllDoctors(showActiveOnly, true);
    
    res.status(200).json({
      status: 'success',
      results: doctors.length,
      data: { doctors }
    });
  });
  
  /**
   * Get doctors by department
   * @route GET /api/v1/departments/:departmentId/doctors
   */
  static getDoctorsByDepartment = asyncErrorHandler(async (req, res, next) => {
    const { departmentId } = req.params;
    const { activeOnly = 'true' } = req.query;

    console.log("departmentId : ", departmentId);
    console.log("activeOnly : ", activeOnly);
    
    // Convert query param to boolean
    const showActiveOnly = activeOnly === 'true';
    
    const doctors = await DoctorService.getDoctorsByDepartment(departmentId, showActiveOnly, true);
    
    res.status(200).json({
      status: 'success',
      results: doctors.length,
      data: { doctors }
    });
  });
  
  /**
   * Get a doctor by ID
   * @route GET /api/v1/doctors/:id
   */
  static getDoctorById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const doctor = await DoctorService.getDoctorById(id, true);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
  
  /**
   * Get a doctor by user ID
   * @route GET /api/v1/users/:userId/doctor
   */
  static getDoctorByUserId = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params;
    
    const doctor = await DoctorService.getDoctorByUserId(userId, true);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
  
  /**
   * Get the current authenticated doctor's profile
   * @route GET /api/v1/doctors/me
   */
  static getMyDoctorProfile = asyncErrorHandler(async (req, res, next) => {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const doctor = await DoctorService.getDoctorByUserId(userId, true);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
    /**
   * Create a new doctor
   * @route POST /api/v1/doctors
   */  static createDoctor = asyncErrorHandler(async (req, res, next) => {
    try {
      const doctorData = req.body;
      
      // Validate department is required
      if (!doctorData.departmentId) {
        return next(new AppError('Department ID is required', 400));
      }
      
      // If no userId is provided, make sure we have firstName and lastName
      if (!doctorData.userId && (!doctorData.firstName || !doctorData.lastName)) {
        return next(new AppError('First name and last name are required when creating a doctor without a user', 400));
      }
      
      // Format availability data
      if (doctorData.availableDays && doctorData.availableTimeSlots) {
        // Convert to the format expected by the Doctor model
        doctorData.availability = doctorData.availableDays.map(day => {
          return doctorData.availableTimeSlots.map(slot => ({
            day,
            startTime: slot.start,
            endTime: slot.end,
            isAvailable: true
          }));
        }).flat();
        
        // Remove the old format properties
        delete doctorData.availableDays;
        delete doctorData.availableTimeSlots;
      }
      
      console.log('Creating doctor with data:', JSON.stringify(doctorData, null, 2));
      
      // Create doctor profile
      const doctor = await DoctorService.createDoctor(doctorData);
      
      res.status(201).json({
        status: 'success',
        data: { doctor }
      });
    } catch (error) {
      console.error('Error creating doctor:', error);
      return next(error);
    }
  });
  
  /**
   * Update a doctor
   * @route PATCH /api/v1/doctors/:id
   */
  static updateDoctor = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const doctor = await DoctorService.updateDoctor(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
  
  /**
   * Delete a doctor
   * @route DELETE /api/v1/doctors/:id
   */
  static deleteDoctor = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await DoctorService.deleteDoctor(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  /**
   * Reassign a doctor to a different department
   * @route PATCH /api/v1/doctors/:id/reassign
   */
  static reassignDoctor = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { departmentId } = req.body;
    
    if (!departmentId) {
      return next(new AppError('Department ID is required', 400));
    }
    
    const doctor = await DoctorService.reassignDoctor(id, departmentId);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
  
  /**
   * Activate or deactivate a doctor
   * @route PATCH /api/v1/doctors/:id/status
   */
  static setDoctorStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return next(new AppError('Active status is required', 400));
    }
    
    const doctor = await DoctorService.setDoctorStatus(id, active);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
  
  /**
   * Update doctor availability
   * @route PATCH /api/v1/doctors/:id/availability
   */
  static updateDoctorAvailability = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { availability } = req.body;
    
    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      return next(new AppError('Availability must be a non-empty array', 400));
    }
    
    const doctor = await DoctorService.updateDoctorAvailability(id, availability);
    
    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  });
  
  /**
   * Check doctor availability for an appointment
   * @route GET /api/v1/doctors/:id/check-availability
   */
  static checkDoctorAvailability = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { date, time } = req.query;
    
    if (!date || !time) {
      return next(new AppError('Date and time are required', 400));
    }
    
    const appointmentDate = new Date(date);
    
    if (isNaN(appointmentDate.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }
    
    const isAvailable = await DoctorService.checkDoctorAvailability(id, appointmentDate, time);
    
    res.status(200).json({
      status: 'success',
      data: { isAvailable }
    });
  });

  /**
   * Get leave requests for a doctor
   * @route GET /api/v1/doctors/:id/leave-requests
   */
  static getDoctorLeaveRequests = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status, startDate, endDate, leaveTypeId, page = 1, limit = 20 } = req.query;
    
    // Validate MongoDB ObjectId format for id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError('Invalid doctor ID format', 400));
    }
    
    const filters = {};
    
    if (status) filters.status = status;
    if (leaveTypeId) {
      // Validate MongoDB ObjectId format for leaveTypeId if provided
      if (!/^[0-9a-fA-F]{24}$/.test(leaveTypeId)) {
        return next(new AppError('Invalid leave type ID format', 400));
      }
      filters.leaveTypeId = leaveTypeId;
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    
    const { LeaveRequestService } = await import('../services/leaveRequest.service.js');
    const result = await LeaveRequestService.getEntityLeaveRequests('doctor', id, filters, page, limit);
    
    res.status(200).json({
      status: 'success',
      results: result.requests.length,
      pagination: result.pagination,
      data: { leaveRequests: result.requests }
    });
  });
}
