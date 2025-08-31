import { AppointmentService } from '../services/appointment.service.js';
import { asyncErrorHandler } from '../../utils/asyncErrorHandler.js';
import AppError from '../../utils/appError.js';

/**
 * Controller for appointment-related endpoints
 */
export class AppointmentController {
  /**
   * Get all appointments with pagination and filtering
   * @route GET /api/v1/appointments
   */
  static getAllAppointments = asyncErrorHandler(async (req, res, next) => {
    const { 
      page = 1, 
      limit = 20, 
      status,
      patientId,
      doctorId,
      departmentId,
      startDate,
      endDate
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (patientId) {
      filter.patientId = patientId;
    }
    
    if (doctorId) {
      filter.doctorId = doctorId;
    }
    
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    // If date range is provided
    if (startDate && endDate) {
      const result = await AppointmentService.getAppointmentsByDateRange(
        new Date(startDate),
        new Date(endDate),
        filter,
        parseInt(page, 10), 
        parseInt(limit, 10), 
        true // Populate references
      );
      
      return res.status(200).json({
        status: 'success',
        results: result.appointments.length,
        pagination: result.pagination,
        data: { appointments: result.appointments }
      });
    }
    
    // Regular pagination-based query
    const result = await AppointmentService.getAllAppointments(
      filter, 
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.appointments.length,
      pagination: result.pagination,
      data: { appointments: result.appointments }
    });
  });
  
  /**
   * Get today's appointments
   * @route GET /api/v1/appointments/today
   */
  static getTodayAppointments = asyncErrorHandler(async (req, res, next) => {
    const { 
      page = 1, 
      limit = 20, 
      doctorId,
      departmentId,
      status
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (doctorId) {
      filter.doctorId = doctorId;
    }
    
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    const result = await AppointmentService.getTodayAppointments(
      filter,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.appointments.length,
      pagination: result.pagination,
      data: { appointments: result.appointments }
    });
  });
  
  /**
   * Get appointments by patient
   * @route GET /api/v1/patients/:patientId/appointments
   */
  static getAppointmentsByPatient = asyncErrorHandler(async (req, res, next) => {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await AppointmentService.getAppointmentsByPatient(
      patientId,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.appointments.length,
      pagination: result.pagination,
      data: { appointments: result.appointments }
    });
  });
  
  /**
   * Get appointments by doctor
   * @route GET /api/v1/doctors/:doctorId/appointments
   */
  static getAppointmentsByDoctor = asyncErrorHandler(async (req, res, next) => {
    const { doctorId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await AppointmentService.getAppointmentsByDoctor(
      doctorId,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.appointments.length,
      pagination: result.pagination,
      data: { appointments: result.appointments }
    });
  });
  
  /**
   * Get appointments by department
   * @route GET /api/v1/departments/:departmentId/appointments
   */
  static getAppointmentsByDepartment = asyncErrorHandler(async (req, res, next) => {
    const { departmentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await AppointmentService.getAppointmentsByDepartment(
      departmentId,
      parseInt(page, 10), 
      parseInt(limit, 10), 
      true // Populate references
    );
    
    res.status(200).json({
      status: 'success',
      results: result.appointments.length,
      pagination: result.pagination,
      data: { appointments: result.appointments }
    });
  });
  
  /**
   * Get an appointment by ID
   * @route GET /api/v1/appointments/:id
   */
  static getAppointmentById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const appointment = await AppointmentService.getAppointmentById(id, true);
    
    res.status(200).json({
      status: 'success',
      data: { appointment }
    });
  });
  
  /**
   * Create a new appointment
   * @route POST /api/v1/appointments
   */
  static createAppointment = asyncErrorHandler(async (req, res, next) => {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const appointmentData = req.body;
    
    const appointment = await AppointmentService.createAppointment(appointmentData, userId);
    
    res.status(201).json({
      status: 'success',
      data: { appointment }
    });
  });
  
  /**
   * Update an appointment
   * @route PATCH /api/v1/appointments/:id
   */
  static updateAppointment = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const appointment = await AppointmentService.updateAppointment(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { appointment }
    });
  });
  
  /**
   * Update appointment status
   * @route PATCH /api/v1/appointments/:id/status
   */
  static updateAppointmentStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return next(new AppError('Status is required', 400));
    }
    
    const appointment = await AppointmentService.updateAppointmentStatus(id, status);
    
    res.status(200).json({
      status: 'success',
      data: { appointment }
    });
  });
    /**
   * Cancel an appointment
   * @route PATCH /api/v1/appointments/:id/cancel
   */
  static cancelAppointment = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const appointment = await AppointmentService.cancelAppointment(id);
    
    res.status(200).json({
      status: 'success',
      data: { appointment }
    });
  });
  
  /**
   * Mark an appointment as no-show
   * @route PATCH /api/v1/appointments/:id/no-show
   */
  static markNoShow = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const appointment = await AppointmentService.markNoShow(id);
    
    res.status(200).json({
      status: 'success',
      data: { appointment }
    });
  });
  
  /**
   * Register a patient and book appointment in one flow
   * @route POST /api/v1/appointments/register-and-book
   */
  static registerAndBook = asyncErrorHandler(async (req, res, next) => {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }
    
    const { patientData, appointmentData } = req.body;
    
    if (!patientData || !appointmentData) {
      return next(new AppError('Patient and appointment data are required', 400));
    }
    
    const result = await AppointmentService.registerPatientAndBookAppointment(
      patientData,
      appointmentData,
      userId
    );
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  });
}
