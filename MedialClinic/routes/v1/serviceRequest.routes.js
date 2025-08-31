import express from 'express';
import { ServiceRequestController } from '../../src/controllers/serviceRequest.controller.js';
import { protect, restrictTo } from '../../utils/middleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible to all authenticated users
router.get('/my-requests', ServiceRequestController.getMyRequests);
router.get('/', ServiceRequestController.getAllRequests);
router.get('/pending', ServiceRequestController.getPendingRequests);
router.get('/:id', ServiceRequestController.getRequestById);

// Routes for creating and updating service requests
router.use(restrictTo('admin', 'manager', 'doctor', 'nurse', 'lab-technician'));
router.post('/', ServiceRequestController.createRequest);
router.patch('/:id', ServiceRequestController.updateRequest);
router.delete('/:id', ServiceRequestController.deleteRequest);

// Routes for approving/rejecting service requests (admin only)
router.use(restrictTo('admin', 'manager'));
router.patch('/:id/approve', ServiceRequestController.approveRequest);
router.patch('/:id/reject', ServiceRequestController.rejectRequest);

export default router;
