import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAllStaff } from '../../store/slices/staffSlice';
import { fetchAllDoctors } from '../../store/slices/doctorsSlice';
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  LeaveRequest
} from '../../store/slices/leaveRequestsSlice';
import LeaveRequestsList from '../../components/leave/LeaveRequestsList';
import { Modal } from '../../components/common/Modal';
import LeaveRequestForm from '../../components/leave/LeaveRequestForm';

type EntityType = 'user' | 'staff' | 'doctor';

const ManageLeaveRequestsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { staff } = useAppSelector((state) => state.staff);
  const { doctors } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('user');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; name: string } | null>(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  useEffect(() => {
    if (staff.length === 0) {
      dispatch(fetchAllStaff());
    }
    
    if (doctors.length === 0) {
      dispatch(fetchAllDoctors());
    }
  }, [dispatch, staff.length, doctors.length]);
  
  const handleEntityTypeChange = (type: EntityType) => {
    setSelectedEntityType(type);
    setSelectedEntityId('');
    setSelectedEntity(null);
  };
  
  const handleEntitySelect = (id: string) => {
    setSelectedEntityId(id);
    
    if (selectedEntityType === 'staff') {
      const selectedStaff = staff.find(s => s._id === id);
      if (selectedStaff) {
        setSelectedEntity({
          id: selectedStaff._id,
          name: `${selectedStaff.firstName} ${selectedStaff.lastName}`
        });
      }
    } else if (selectedEntityType === 'doctor') {
      const selectedDoctor = doctors.find(d => d._id === id);
      if (selectedDoctor) {
        setSelectedEntity({
          id: selectedDoctor._id,
          name: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`
        });
      }
    } else {
      setSelectedEntity({
        id: user?._id || '',
        name: `${user?.firstName} ${user?.lastName}`
      });
    }
  };
  
  const handleViewRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };
  
  const handleEditRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };
  
  const handleCancelRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowCancelModal(true);
  };
  
  const handleApproveRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };
  
  const handleRejectRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };
  
  const confirmCancel = () => {
    if (selectedRequest) {
      dispatch(cancelLeaveRequest(selectedRequest._id));
      setShowCancelModal(false);
    }
  };
  
  const confirmApprove = () => {
    if (selectedRequest) {
      dispatch(approveLeaveRequest({ id: selectedRequest._id }));
      setShowApproveModal(false);
    }
  };
  
  const confirmReject = () => {
    if (selectedRequest && rejectReason.trim()) {
      dispatch(rejectLeaveRequest({ id: selectedRequest._id, comments: rejectReason }));
      setShowRejectModal(false);
    }
  };
  
  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowCancelModal(false);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setSelectedRequest(null);
  };
  
  const filteredStaff = staff.filter(
    s => 
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredDoctors = doctors.filter(
    d => 
      d.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Leave Requests</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="space-y-4">
          {/* Entity type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Leave Requests For
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="entityType"
                  value="user"
                  checked={selectedEntityType === 'user'}
                  onChange={() => handleEntityTypeChange('user')}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Yourself</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="entityType"
                  value="staff"
                  checked={selectedEntityType === 'staff'}
                  onChange={() => handleEntityTypeChange('staff')}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Staff</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="entityType"
                  value="doctor"
                  checked={selectedEntityType === 'doctor'}
                  onChange={() => handleEntityTypeChange('doctor')}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Doctor</span>
              </label>
            </div>
          </div>
          
          {/* Entity selection */}
          {selectedEntityType !== 'user' && (
            <div>
              <label htmlFor="entitySearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search {selectedEntityType === 'staff' ? 'Staff' : 'Doctor'}
              </label>
              <input
                type="text"
                id="entitySearch"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder={`Search by name or email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="mt-2">
                <label htmlFor="entitySelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Select {selectedEntityType === 'staff' ? 'Staff' : 'Doctor'}
                </label>
                <select
                  id="entitySelect"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  value={selectedEntityId}
                  onChange={(e) => handleEntitySelect(e.target.value)}
                >
                  <option value="">Select {selectedEntityType === 'staff' ? 'a staff member' : 'a doctor'}</option>
                  {selectedEntityType === 'staff' ? (
                    filteredStaff.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.firstName} {s.lastName} ({s.email})
                      </option>
                    ))
                  ) : (
                    filteredDoctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.firstName} {d.lastName} ({d.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Leave Requests List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {selectedEntityType === 'user' 
            ? 'Your Leave Requests' 
            : selectedEntity 
              ? `Leave Requests for ${selectedEntity.name}` 
              : 'Select a user to view leave requests'}
        </h2>
        
        {(selectedEntityType === 'user' || selectedEntityId) && (
          <LeaveRequestsList
            entityType={selectedEntityType}
            entityId={selectedEntityType === 'user' ? undefined : selectedEntityId}
            onView={handleViewRequest}
            onEdit={handleEditRequest}
            onCancel={handleCancelRequest}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        )}
      </div>
      
      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={closeModals}
        title="Leave Request Details"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
              <p className="mt-1">{selectedRequest.leaveTypeName}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="mt-1">
                {selectedRequest.dates && selectedRequest.dates.length > 0 
                  ? `${selectedRequest.dates.length} day(s)` 
                  : `From ${selectedRequest.startDate} to ${selectedRequest.endDate}`
                }
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reason</h3>
              <p className="mt-1">{selectedRequest.reason}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 capitalize">{selectedRequest.status}</p>
            </div>
            
            {selectedRequest.comments && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                <p className="mt-1">{selectedRequest.comments}</p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={closeModals}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeModals}
        title="Edit Leave Request"
      >
        {selectedRequest && (
          <LeaveRequestForm
            leaveRequest={selectedRequest}
            isEdit={true}
            onSuccess={closeModals}
          />
        )}
      </Modal>
      
      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={closeModals}
        title="Cancel Leave Request"
      >
        <div className="space-y-4">
          <p>Are you sure you want to cancel this leave request?</p>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={closeModals}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              No, Keep It
            </button>
            <button
              onClick={confirmCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Yes, Cancel It
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={closeModals}
        title="Approve Leave Request"
      >
        <div className="space-y-4">
          <p>Are you sure you want to approve this leave request?</p>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={closeModals}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={confirmApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={closeModals}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <p>Please provide a reason for rejecting this leave request:</p>
          
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={closeModals}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageLeaveRequestsPage;
