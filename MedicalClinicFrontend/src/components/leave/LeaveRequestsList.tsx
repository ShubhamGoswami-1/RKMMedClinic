import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchMyLeaveRequests, 
  fetchStaffLeaveRequests, 
  fetchDoctorLeaveRequests,
  LeaveRequest 
} from '../../store/slices/leaveRequestsSlice';
import { formatDate } from '../../utils/dateUtils';

interface LeaveRequestsListProps {
  entityType: 'user' | 'staff' | 'doctor';
  entityId?: string;
  showControls?: boolean;
  onView?: (request: LeaveRequest) => void;
  onEdit?: (request: LeaveRequest) => void;
  onCancel?: (request: LeaveRequest) => void;
  onApprove?: (request: LeaveRequest) => void;
  onReject?: (request: LeaveRequest) => void;
}

const LeaveRequestsList: React.FC<LeaveRequestsListProps> = ({
  entityType,
  entityId,
  showControls = true,
  onView,
  onEdit,
  onCancel,
  onApprove,
  onReject
}) => {
  const dispatch = useAppDispatch();
  const { myRequests, staffRequests, doctorRequests, loading } = useAppSelector((state) => state.leaveRequests);
  const [filter, setFilter] = useState<string>('all');
  const { user } = useAppSelector((state) => state.auth);
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canApproveReject = isAdmin || isManager;
  
  useEffect(() => {
    if (entityType === 'user') {
      dispatch(fetchMyLeaveRequests({}));
    } else if (entityType === 'staff' && entityId) {
      dispatch(fetchStaffLeaveRequests({ staffId: entityId, filters: {} }));
    } else if (entityType === 'doctor' && entityId) {
      dispatch(fetchDoctorLeaveRequests({ doctorId: entityId, filters: {} }));
    }
  }, [dispatch, entityType, entityId]);

  // Get the appropriate list based on entity type
  const getLeaveRequests = () => {
    if (entityType === 'user') {
      return myRequests;
    } else if (entityType === 'staff' && entityId) {
      return staffRequests[entityId] || [];
    } else if (entityType === 'doctor' && entityId) {
      return doctorRequests[entityId] || [];
    }
    return [];
  };

  const leaveRequests = getLeaveRequests();
  
  // Filter the leave requests based on status
  const filteredRequests = leaveRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  // Check if user can edit a leave request
  const canEdit = (request: LeaveRequest) => {
    if (!showControls) return false;
    if (request.status !== 'pending') return false;
    
    // Only the requester or admin can edit
    return (user?._id === request.requestedBy) || isAdmin;
  };

  // Check if user can cancel a leave request
  const canCancel = (request: LeaveRequest) => {
    if (!showControls) return false;
    if (request.status !== 'pending') return false;
    
    // Only the requester or admin can cancel
    return (user?._id === request.requestedBy) || isAdmin;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = '';
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'approved':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        bgColor = 'bg-red-100 text-red-800';
        break;
      case 'cancelled':
        bgColor = 'bg-gray-100 text-gray-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'approved' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'rejected' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'cancelled' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Cancelled
        </button>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {/* No data state */}
      {!loading && filteredRequests.length === 0 && (
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-600">No leave requests found.</p>
        </div>
      )}
      
      {/* Leave requests list */}
      {!loading && filteredRequests.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Leave Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Duration</th>
                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Reason</th>
                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                {showControls && (
                  <th className="py-3 px-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">{request.leaveTypeName}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {request.dates && request.dates.length > 0 ? (
                      <span>{request.dates.length} day(s): {request.dates.map(d => formatDate(new Date(d))).join(', ')}</span>
                    ) : (
                      <span>
                        {formatDate(new Date(request.startDate || ''))} to {formatDate(new Date(request.endDate || ''))}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={request.status} />
                  </td>
                  {showControls && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        {onView && (
                          <button
                            onClick={() => onView(request)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                        )}
                        
                        {onEdit && canEdit(request) && (
                          <button
                            onClick={() => onEdit(request)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Edit
                          </button>
                        )}
                        
                        {onCancel && canCancel(request) && (
                          <button
                            onClick={() => onCancel(request)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        )}
                        
                        {onApprove && canApproveReject && request.status === 'pending' && (
                          <button
                            onClick={() => onApprove(request)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                        )}
                        
                        {onReject && canApproveReject && request.status === 'pending' && (
                          <button
                            onClick={() => onReject(request)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestsList;
