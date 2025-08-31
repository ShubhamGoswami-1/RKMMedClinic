import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchMyLeaveBalances } from '../store/slices/leaveBalancesSlice';
import { fetchMyLeaveRequests, clearLeaveRequestsSuccess, LeaveRequest } from '../store/slices/leaveRequestsSlice';
import LeaveBalanceCard from '../components/leave/LeaveBalanceCard';
import LeaveRequestCard from '../components/leave/LeaveRequestCard';
import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import LeaveRequestDetail from '../components/leave/LeaveRequestDetail';

const LeaveManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myBalances, loading: balancesLoading } = useAppSelector((state) => state.leaveBalances);
  const { myRequests, loading: requestsLoading, success } = useAppSelector((state) => state.leaveRequests);
  
  const [activeTab, setActiveTab] = useState<'balances' | 'requests' | 'apply'>('balances');
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // Get the current year
  const currentYear = new Date().getFullYear();
    useEffect(() => {
    // Fetch leave balances for current year
    dispatch(fetchMyLeaveBalances(currentYear));
    
    // Fetch leave requests
    dispatch(fetchMyLeaveRequests({}));
  }, [dispatch, currentYear]);
  
  useEffect(() => {
    // Clear success message after 3 seconds
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearLeaveRequestsSuccess());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);
  
  const handleRequestClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowRequestDetail(true);
  };
  
  const handleBackToRequests = () => {
    setShowRequestDetail(false);
    setSelectedRequest(null);
  };
    const handleLeaveRequestSuccess = () => {
    // Refresh leave requests
    dispatch(fetchMyLeaveRequests({}));
    // Refresh leave balances
    dispatch(fetchMyLeaveBalances(currentYear));
    // Switch to requests tab
    setActiveTab('requests');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Leave Management</h1>
      
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'balances'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leave Balances
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apply'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Apply for Leave
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {/* Leave Balances Tab */}
        {activeTab === 'balances' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              My Leave Balances for {currentYear}
            </h2>
            
            {balancesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Loading leave balances...</p>
              </div>
            ) : myBalances && myBalances.balances && myBalances.balances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBalances.balances.map((balance) => (
                  <LeaveBalanceCard key={balance.leaveTypeId} balance={balance} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No leave balances found for the current year.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Please contact HR if you believe this is an error.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* My Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Leave Requests</h2>
            
            {showRequestDetail && selectedRequest ? (
              <div>
                <button
                  onClick={handleBackToRequests}
                  className="mb-4 flex items-center text-orange-600 hover:text-orange-800"
                >
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to requests
                </button>
                
                <LeaveRequestDetail 
                  leaveRequest={selectedRequest} 
                  onUpdateSuccess={handleLeaveRequestSuccess}
                />
              </div>
            ) : requestsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Loading leave requests...</p>
              </div>
            ) : myRequests && myRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRequests.map((request) => (
                  <LeaveRequestCard
                    key={request._id}
                    leaveRequest={request}
                    onClick={() => handleRequestClick(request)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">You haven't submitted any leave requests yet.</p>
                <button
                  onClick={() => setActiveTab('apply')}
                  className="mt-2 text-orange-600 hover:text-orange-800"
                >
                  Apply for leave now
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Apply for Leave Tab */}
        {activeTab === 'apply' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply for Leave</h2>
            <LeaveRequestForm onSuccess={handleLeaveRequestSuccess} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;
