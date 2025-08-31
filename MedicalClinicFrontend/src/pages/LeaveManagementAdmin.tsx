import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { 
  fetchAllUserLeaveBalances, 
  fetchUserLeaveBalances, 
  updateLeaveAllocation
} from '../store/slices/leaveBalancesSlice';
import { 
  fetchAllLeaveRequests, 
  fetchUserLeaveRequests, 
  clearLeaveRequestsSuccess, 
  LeaveRequest 
} from '../store/slices/leaveRequestsSlice';
import { fetchLeaveTypes } from '../store/slices/leaveTypesSlice';
import LeaveRequestCard from '../components/leave/LeaveRequestCard';
import LeaveRequestDetail from '../components/leave/LeaveRequestDetail';
import LeaveBalanceCard from '../components/leave/LeaveBalanceCard';
import { useDebounce } from '../hooks/useDebounce';

// Define interface for user balance summary in admin view
interface UserBalanceSummary {
  userId: string;
  userName: string;
  role?: string;
  department?: string;
  totalBalance: number;
  balances: {
    leaveTypeId: string;
    leaveTypeName: string;
    available: number;
  }[];
}

const LeaveManagementAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { leaveTypes } = useAppSelector((state) => state.leaveTypes);
  const { userBalances, loading: balancesLoading } = useAppSelector((state) => state.leaveBalances);
  const { allRequests, userRequests, loading: requestsLoading, success } = useAppSelector((state) => state.leaveRequests);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'balances'>('pending');  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserLeaves, setShowUserLeaves] = useState(false);
  const [showLeaveAllocationModal, setShowLeaveAllocationModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [allocationDays, setAllocationDays] = useState(0);
  const [allBalances, setAllBalances] = useState<UserBalanceSummary[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
    // Get the current year
  const currentYear = new Date().getFullYear();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Access the leave balances from the Redux store
  const { allBalances: fetchedBalances } = useAppSelector((state) => state.leaveBalances);
  
  // Process all leave balances into UserBalanceSummary format
  useEffect(() => {
    if (fetchedBalances && fetchedBalances.length > 0) {
      const processedBalances: UserBalanceSummary[] = fetchedBalances.map(balance => {
        // Calculate total available days across all leave types
        const totalBalance = balance.balances.reduce(
          (sum, leaveType) => sum + leaveType.available, 
          0
        );
        
        // In a real application, these properties would likely come from the backend
        // Here we're using simple defaults since our API might not provide these details
        const userName = `User ${balance.userId.toString().slice(-4)}`; // Simulate a user name
        const role = 'Staff'; // Default role
        const department = 'General'; // Default department
        
        return {
          userId: balance.userId,
          userName,
          role,
          department,
          totalBalance,
          balances: balance.balances.map(leaveType => ({
            leaveTypeId: leaveType.leaveTypeId,
            leaveTypeName: leaveType.leaveTypeName,
            available: leaveType.available
          }))
        };
      });
        setAllBalances(processedBalances);
    }
  }, [fetchedBalances]);
  
  useEffect(() => {
    // Fetch leave types - pass true for activeOnly parameter
    dispatch(fetchLeaveTypes(true));
    
    // Fetch all leave requests with pending status by default
    dispatch(fetchAllLeaveRequests({ status: 'pending' }));
    
    // Fetch all leave balances for current year
    dispatch(fetchAllUserLeaveBalances(currentYear));
  }, [dispatch, currentYear]);
  
  useEffect(() => {
    // Apply filters when they change
    const filters: any = {};
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    if (dateFilter) {
      // For simplicity, this is just a month filter
      // In a real app, you might want to use a date range picker
      filters.month = dateFilter;
    }
    
    if (activeTab === 'pending') {
      filters.status = 'pending';
    }
    
    if (showUserLeaves && selectedUser) {
      dispatch(fetchUserLeaveRequests({ userId: selectedUser, filters }));
      dispatch(fetchUserLeaveBalances({ userId: selectedUser, year: currentYear }));
    } else {
      dispatch(fetchAllLeaveRequests(filters));
    }
  }, [
    dispatch, 
    activeTab, 
    statusFilter, 
    dateFilter, 
    showUserLeaves, 
    selectedUser, 
    currentYear
  ]);
  
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
    // Refresh leave requests based on current filters
    if (showUserLeaves && selectedUser) {
      dispatch(fetchUserLeaveRequests({ 
        userId: selectedUser, 
        filters: statusFilter !== 'all' ? { status: statusFilter } : {} 
      }));
      dispatch(fetchUserLeaveBalances({ userId: selectedUser, year: currentYear }));
    } else {
      dispatch(fetchAllLeaveRequests(
        statusFilter !== 'all' ? { status: statusFilter } : {}
      ));
    }
  };
  
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setShowUserLeaves(true);
    // Fetch user leave requests and balances
    dispatch(fetchUserLeaveRequests({ userId }));
    dispatch(fetchUserLeaveBalances({ userId, year: currentYear }));
  };
  
  const handleBackToAllUsers = () => {
    setShowUserLeaves(false);
    setSelectedUser(null);
  };
  
  const handleUpdateAllocation = () => {
    if (!selectedUser || !selectedLeaveType || allocationDays < 0) return;
    
    dispatch(updateLeaveAllocation({
      userId: selectedUser,
      leaveTypeId: selectedLeaveType,
      days: allocationDays
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setShowLeaveAllocationModal(false);
        setSelectedLeaveType('');
        setAllocationDays(0);
      }
    });
  };
  
  // Filter the leave requests based on search term
  const getFilteredRequests = () => {
    const requests = showUserLeaves && selectedUser && userRequests[selectedUser] 
      ? userRequests[selectedUser] 
      : allRequests;
      
    if (!debouncedSearchTerm) return requests;
    
    return requests.filter(request => 
      request.userName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      request.leaveTypeName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leave Management Dashboard</h1>
        
        {showUserLeaves && selectedUser ? (
          <button
            onClick={handleBackToAllUsers}
            className="flex items-center text-orange-600 hover:text-orange-800"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all users
          </button>
        ) : null}
      </div>
      
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
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approvals
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Leave Requests
          </button>
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
        </nav>
      </div>
      
      {/* Search and Filters */}
      {(activeTab === 'pending' || activeTab === 'all') && !showRequestDetail && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Search by employee name or leave type"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="sr-only">
              Status
            </label>
            <select
              id="statusFilter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={activeTab === 'pending'}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="sr-only">
              Month
            </label>
            <input
              type="month"
              id="dateFilter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {/* Tab Content */}
      <div className="mt-6">
        {/* Leave Requests Tabs (Pending and All) */}
        {(activeTab === 'pending' || activeTab === 'all') && (
          <div>
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
                  isAdmin={true}
                  onUpdateSuccess={handleLeaveRequestSuccess}
                />
              </div>
            ) : requestsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Loading leave requests...</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {activeTab === 'pending' ? 'Pending Leave Approvals' : 'All Leave Requests'}
                  {showUserLeaves && selectedUser ? ' - Selected Employee' : ''}
                </h2>
                
                {getFilteredRequests().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredRequests().map((request) => (
                      <LeaveRequestCard
                        key={request._id}
                        leaveRequest={request}
                        onClick={() => handleRequestClick(request)}
                        showEmployeeName={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">
                      {activeTab === 'pending' 
                        ? 'No pending leave requests found.' 
                        : 'No leave requests match your filters.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Leave Balances Tab */}
        {activeTab === 'balances' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {showUserLeaves && selectedUser 
                  ? 'Employee Leave Balances' 
                  : 'All Employees Leave Balances'}
              </h2>
              
              {showUserLeaves && selectedUser && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowLeaveAllocationModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Update Allocation
                  </button>
                </div>
              )}
            </div>
            
            {balancesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Loading leave balances...</p>
              </div>
            ) : showUserLeaves && selectedUser ? (
              <div>
                {userBalances[selectedUser] ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userBalances[selectedUser].balances.map((balance) => (
                      <LeaveBalanceCard key={balance.leaveTypeId} balance={balance} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No leave balances found for this employee.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search employee..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">                    {allBalances
                      .filter(balance => 
                        !debouncedSearchTerm || 
                        balance.userName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                      )
                      .map((balance) => (
                        <li key={balance.userId}>
                          <button
                            onClick={() => handleUserSelect(balance.userId)}
                            className="block hover:bg-gray-50 w-full text-left"
                          >
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">                                <p className="text-sm font-medium text-orange-600 truncate">
                                  {balance.userName}
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {balance.totalBalance} days available
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    {balance.role}
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <p>
                                    {balance.department || 'No department'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
                  {allBalances.filter(balance => 
                  !debouncedSearchTerm || 
                  balance.userName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
                    <p className="text-gray-600">No employees found matching your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Leave Allocation Modal */}
      {showLeaveAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Leave Allocation</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type
                </label>
                <select
                  id="leaveType"
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
                  Days to Allocate
                </label>
                <input
                  type="number"
                  id="days"
                  value={allocationDays}
                  onChange={(e) => setAllocationDays(parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLeaveAllocationModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateAllocation}
                disabled={!selectedLeaveType || allocationDays < 0 || balancesLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {balancesLoading ? 'Processing...' : 'Update Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementAdmin;
