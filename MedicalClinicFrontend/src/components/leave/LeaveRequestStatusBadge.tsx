import React from 'react';

interface LeaveRequestStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  className?: string;
}

const LeaveRequestStatusBadge: React.FC<LeaveRequestStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <span 
      className={`px-3 py-1 text-xs font-medium capitalize rounded-full border ${getStatusStyles()} ${className}`}
    >
      {getStatusText()}
    </span>
  );
};

export default LeaveRequestStatusBadge;
