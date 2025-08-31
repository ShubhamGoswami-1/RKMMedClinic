import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  LeaveRequest, 
  cancelLeaveRequest, 
  approveLeaveRequest, 
  rejectLeaveRequest 
} from '../../store/slices/leaveRequestsSlice';
import LeaveRequestStatusBadge from './LeaveRequestStatusBadge';

interface LeaveRequestDetailProps {
  leaveRequest: LeaveRequest;
  isAdmin?: boolean;
  onUpdateSuccess?: () => void;
}

const LeaveRequestDetail: React.FC<LeaveRequestDetailProps> = ({ 
  leaveRequest, 
  isAdmin = false,
  onUpdateSuccess
}) => {
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector((state) => state.leaveRequests);
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  
  // Format dates
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMMM d, yyyy');
  };
  
  const getDateRangeText = () => {
    if (leaveRequest.dates && leaveRequest.dates.length > 0) {
      if (leaveRequest.dates.length === 1) {
        return formatDate(leaveRequest.dates[0]);
      } else {
        return leaveRequest.dates
          .map(date => formatDate(date))
          .join(', ');
      }
    } else if (leaveRequest.startDate && leaveRequest.endDate) {
      const start = formatDate(leaveRequest.startDate);
      const end = formatDate(leaveRequest.endDate);
      
      if (start === end) {
        return start;
      }
      
      return `${start} to ${end}`;
    }
    
    return 'No dates specified';
  };
  
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      dispatch(cancelLeaveRequest(leaveRequest._id))
        .then((result) => {
          if (result.meta.requestStatus === 'fulfilled' && onUpdateSuccess) {
            onUpdateSuccess();
          }
        });
    }
  };
  
  const handleApprove = () => {
    dispatch(approveLeaveRequest({ id: leaveRequest._id, comments }))
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          setShowApproveModal(false);
          setComments('');
          if (onUpdateSuccess) onUpdateSuccess();
        }
      });
  };
  
  const handleReject = () => {
    if (!comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    dispatch(rejectLeaveRequest({ id: leaveRequest._id, comments }))
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          setShowRejectModal(false);
          setComments('');
          if (onUpdateSuccess) onUpdateSuccess();
        }
      });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Leave Request Details</h2>
        <LeaveRequestStatusBadge status={leaveRequest.status} />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
            <p className="text-base text-gray-900">{leaveRequest.leaveTypeName}</p>
          </div>
          
          {isAdmin && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Employee</h3>
              <p className="text-base text-gray-900">{leaveRequest.userName}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date(s)</h3>
            <p className="text-base text-gray-900">{getDateRangeText()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Applied On</h3>
            <p className="text-base text-gray-900">{formatDate(leaveRequest.createdAt)}</p>
          </div>
        </div>
        
        {leaveRequest.reason && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reason</h3>
            <p className="text-base text-gray-900">{leaveRequest.reason}</p>
          </div>
        )}
        
        {leaveRequest.contactDetails && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Contact Details</h3>
            <p className="text-base text-gray-900">{leaveRequest.contactDetails}</p>
          </div>
        )}
        
        {leaveRequest.status === 'approved' && leaveRequest.approvedBy && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Approved By</h3>
            <p className="text-base text-gray-900">{leaveRequest.approvedBy}</p>
            {leaveRequest.comments && (
              <div className="mt-1">
                <h4 className="text-xs font-medium text-gray-500">Comments</h4>
                <p className="text-sm text-gray-700">{leaveRequest.comments}</p>
              </div>
            )}
          </div>
        )}
        
        {leaveRequest.status === 'rejected' && leaveRequest.rejectedBy && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Rejected By</h3>
            <p className="text-base text-gray-900">{leaveRequest.rejectedBy}</p>
            {leaveRequest.comments && (
              <div className="mt-1">
                <h4 className="text-xs font-medium text-gray-500">Reason for Rejection</h4>
                <p className="text-sm text-gray-700">{leaveRequest.comments}</p>
              </div>
            )}
          </div>
        )}
        
        {leaveRequest.status === 'cancelled' && leaveRequest.cancelledBy && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Cancelled By</h3>
            <p className="text-base text-gray-900">{leaveRequest.cancelledBy}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {/* User Actions */}
          {!isAdmin && leaveRequest.status === 'pending' && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel Request
            </button>
          )}
          
          {/* Admin Actions */}
          {isAdmin && leaveRequest.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Approve Leave Request</h3>
            <div className="mb-4">
              <label htmlFor="approveComments" className="block text-sm font-medium text-gray-700 mb-1">
                Comments (Optional)
              </label>
              <textarea
                id="approveComments"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Add any comments about this approval (optional)"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {loading ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Leave Request</h3>
            <div className="mb-4">
              <label htmlFor="rejectComments" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectComments"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Please provide a reason for rejecting this leave request"
              ></textarea>
              {comments.trim() === '' && (
                <p className="mt-1 text-sm text-red-600">Rejection reason is required</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading || comments.trim() === ''}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestDetail;
