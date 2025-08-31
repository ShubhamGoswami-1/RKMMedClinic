import React from 'react';
import { format, parseISO } from 'date-fns';
import { LeaveRequest } from '../../store/slices/leaveRequestsSlice';
import LeaveRequestStatusBadge from './LeaveRequestStatusBadge';

interface LeaveRequestCardProps {
  leaveRequest: LeaveRequest;
  onClick?: () => void;
  showEmployeeName?: boolean;
}

const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ 
  leaveRequest, 
  onClick,
  showEmployeeName = false 
}) => {
  // Format dates
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const getDateRangeText = () => {
    if (leaveRequest.dates && leaveRequest.dates.length > 0) {
      if (leaveRequest.dates.length === 1) {
        return formatDate(leaveRequest.dates[0]);
      } else {
        return `${leaveRequest.dates.length} days`;
      }
    } else if (leaveRequest.startDate && leaveRequest.endDate) {
      const start = formatDate(leaveRequest.startDate);
      const end = formatDate(leaveRequest.endDate);
      
      if (start === end) {
        return start;
      }
      
      return `${start} - ${end}`;
    }
    
    return 'No dates specified';
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${
        leaveRequest.status === 'pending'
          ? 'border-blue-500'
          : leaveRequest.status === 'approved'
          ? 'border-green-500'
          : leaveRequest.status === 'rejected'
          ? 'border-red-500'
          : 'border-gray-500'
      } hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{leaveRequest.leaveTypeName}</h3>
          {showEmployeeName && leaveRequest.userName && (
            <p className="text-sm text-gray-600 mt-1">{leaveRequest.userName}</p>
          )}
          <p className="text-sm text-gray-600 mt-1">{getDateRangeText()}</p>
        </div>
        <LeaveRequestStatusBadge status={leaveRequest.status} />
      </div>
      
      {leaveRequest.reason && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            <span className="font-medium">Reason:</span> {leaveRequest.reason}
          </p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Applied on {format(parseISO(leaveRequest.createdAt), 'MMM d, yyyy')}
      </div>
    </div>
  );
};

export default LeaveRequestCard;
