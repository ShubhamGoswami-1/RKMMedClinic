import React from 'react';
import { LeaveBalanceDetail } from '../../store/slices/leaveBalancesSlice';

interface LeaveBalanceCardProps {
  balance: LeaveBalanceDetail;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ balance }) => {
  // Calculate available percentage
  const totalAllocated = balance.allocated + balance.carryForward;
  const availablePercentage = totalAllocated > 0 
    ? Math.round((balance.available / totalAllocated) * 100) 
    : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div 
        className="h-2" 
        style={{ backgroundColor: balance.leaveTypeName === 'Sick Leave' 
          ? '#ef4444' 
          : balance.leaveTypeName === 'Casual Leave' 
            ? '#f97316' 
            : balance.leaveTypeName === 'Earned Leave' 
              ? '#8b5cf6'
              : '#3b82f6' 
        }}
      ></div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{balance.leaveTypeName}</h3>
        
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Available</span>
            <span className="text-lg font-bold text-green-600">{balance.available}</span>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${availablePercentage}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <span className="text-gray-500">Allocated</span>
              <p className="font-medium">{balance.allocated}</p>
            </div>
            <div>
              <span className="text-gray-500">Carry Forward</span>
              <p className="font-medium">{balance.carryForward}</p>
            </div>
            <div>
              <span className="text-gray-500">Used</span>
              <p className="font-medium text-orange-600">{balance.used}</p>
            </div>
            <div>
              <span className="text-gray-500">Pending</span>
              <p className="font-medium text-blue-600">{balance.pending}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCard;
