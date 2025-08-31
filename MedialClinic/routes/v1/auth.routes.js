import express from 'express';
import { AuthController } from '../../src/controllers/auth.controller.js';
import { protect, restrictTo, validate, authorize } from '../../utils/middleware.js';
import { userValidation } from '../../utils/validations.js';

const router = express.Router();

// Public routes
router.post('/signup', validate(userValidation.signup), AuthController.signup);
router.post('/login', validate(userValidation.login), AuthController.login);
router.get('/validate-token', protect, AuthController.validateToken);

// Direct approval/rejection with token (for email links)
router.post('/approve-with-token', AuthController.approveUser);
router.post('/reject-with-token', AuthController.rejectUser);

// Protected routes - require admin authentication
router.use(protect);
router.post('/approve/:userId', validate(userValidation.userApproval), restrictTo('admin'), AuthController.approveUser);
router.post('/reject/:userId', validate(userValidation.userApproval), restrictTo('admin'), AuthController.rejectUser);

// Get users who can be assigned as doctors (users without doctor profiles)
router.get('/available-doctor-users', restrictTo('admin'), AuthController.getAvailableDoctorUsers);

// Get current user profile
router.get('/profile', AuthController.getProfile);

export default router;
