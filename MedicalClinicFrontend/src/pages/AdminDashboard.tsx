import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  Calendar, 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clipboard,
  Stethoscope,
  HeartPulse,
  Clock,
  Building2,
  UserRound,
  Settings,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Permission } from '../utils/rbac';
import PermissionGuard from '../components/PermissionGuard';

// Mock data for charts
const mockRevenueData = [
  { month: 'Jan', amount: 28000 },
  { month: 'Feb', amount: 32000 },
  { month: 'Mar', amount: 35000 },
  { month: 'Apr', amount: 30000 },
  { month: 'May', amount: 40000 },
  { month: 'Jun', amount: 42000 },
  { month: 'Jul', amount: 45000 },
  { month: 'Aug', amount: 48000 }
];

const mockPatientData = [
  { month: 'Jan', count: 120 },
  { month: 'Feb', count: 150 },
  { month: 'Mar', count: 180 },
  { month: 'Apr', count: 190 },
  { month: 'May', count: 210 },
  { month: 'Jun', count: 230 },
  { month: 'Jul', count: 250 },
  { month: 'Aug', count: 280 }
];

const mockDepartmentRevenue = [
  { department: 'Cardiology', revenue: 120000 },
  { department: 'Radiology', revenue: 95000 },
  { department: 'Neurology', revenue: 85000 },
  { department: 'Pathology', revenue: 65000 },
  { department: 'General Medicine', revenue: 110000 }
];

const mockAppointmentsByStatus = [
  { status: 'Completed', count: 320 },
  { status: 'Scheduled', count: 150 },
  { status: 'Cancelled', count: 45 },
  { status: 'No-Show', count: 30 }
];

const AdminDashboard: React.FC = () => {
  // State for date range filter
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // State for report type
  const [reportType, setReportType] = useState<'financial' | 'operational'>('financial');
  
  // Calculate total revenue
  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate total patients
  const totalPatients = mockPatientData[mockPatientData.length - 1].count;
  
  // Calculate month-over-month growth
  const revenueGrowth = ((mockRevenueData[mockRevenueData.length - 1].amount - mockRevenueData[mockRevenueData.length - 2].amount) / mockRevenueData[mockRevenueData.length - 2].amount) * 100;
  
  // Calculate patient growth
  const patientGrowth = ((mockPatientData[mockPatientData.length - 1].count - mockPatientData[mockPatientData.length - 2].count) / mockPatientData[mockPatientData.length - 2].count) * 100;
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Comprehensive view of clinic performance and key metrics</p>
      </div>
      
      {/* Filter Controls */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex space-x-2 mb-4 md:mb-0">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              reportType === 'financial' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                : 'bg-white border border-orange-200 text-gray-700 hover:bg-orange-50'
            }`}
            onClick={() => setReportType('financial')}
          >
            Financial Reports
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              reportType === 'operational' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                : 'bg-white border border-orange-200 text-gray-700 hover:bg-orange-50'
            }`}
            onClick={() => setReportType('operational')}
          >
            Operational Reports
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'week' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                : 'bg-white border border-orange-200 text-gray-700 hover:bg-orange-50'
            }`}
            onClick={() => setDateRange('week')}
          >
            Week
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'month' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                : 'bg-white border border-orange-200 text-gray-700 hover:bg-orange-50'
            }`}
            onClick={() => setDateRange('month')}
          >
            Month
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'quarter' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                : 'bg-white border border-orange-200 text-gray-700 hover:bg-orange-50'
            }`}
            onClick={() => setDateRange('quarter')}
          >
            Quarter
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'year' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                : 'bg-white border border-orange-200 text-gray-700 hover:bg-orange-50'
            }`}
            onClick={() => setDateRange('year')}
          >
            Year
          </button>
        </div>
      </div>
      
      {/* Financial Dashboard */}
      {reportType === 'financial' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue (YTD)</p>
                  <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
                  <div className={`flex items-center mt-2 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="text-sm">{Math.abs(revenueGrowth).toFixed(1)}% MoM</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-800">{totalPatients}</p>
                  <div className={`flex items-center mt-2 ${patientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {patientGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="text-sm">{Math.abs(patientGrowth).toFixed(1)}% MoM</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg. Revenue Per Visit</p>
                  <p className="text-2xl font-bold text-gray-800">₹1,250</p>
                  <div className="flex items-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">4.2% MoM</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Outstanding Payments</p>
                  <p className="text-2xl font-bold text-gray-800">₹32,450</p>
                  <div className="flex items-center mt-2 text-amber-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="text-sm">2.1% MoM</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clipboard className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h2>
              <div className="h-80 flex items-end space-x-2">
                {mockRevenueData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t-md" 
                      style={{ 
                        height: `${(item.amount / Math.max(...mockRevenueData.map(d => d.amount)) * 100) * 0.7}%`,
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{item.month}</div>
                    <div className="text-xs font-medium text-gray-800">₹{(item.amount / 1000).toFixed(0)}K</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Department Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Department</h2>
              <div className="flex">
                <div className="w-1/2">
                  {/* Simplified pie chart representation */}
                  <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 rounded-full border-8 border-orange-500"></div>
                    <div className="absolute inset-0 rounded-full border-t-8 border-r-8 border-blue-500" style={{ transform: 'rotate(45deg)' }}></div>
                    <div className="absolute inset-0 rounded-full border-t-8 border-green-500" style={{ transform: 'rotate(135deg)' }}></div>
                    <div className="absolute inset-0 rounded-full border-t-8 border-l-8 border-purple-500" style={{ transform: 'rotate(225deg)' }}></div>
                    <div className="absolute inset-0 rounded-full border-b-8 border-l-8 border-amber-500" style={{ transform: 'rotate(315deg)' }}></div>
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="space-y-3">
                    {mockDepartmentRevenue.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-orange-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-green-500' : 
                          index === 3 ? 'bg-purple-500' : 
                          'bg-amber-500'
                        } mr-2`}></div>
                        <div className="text-xs text-gray-800 flex-1">{item.department}</div>
                        <div className="text-xs font-medium text-gray-800">₹{(item.revenue / 1000).toFixed(0)}K</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Financial Tables */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800">Top Revenue Generating Services</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-orange-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Service Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      # of Services
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Avg. Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-orange-100">
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">MRI Scan</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Radiology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹42,500</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">85</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹500</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Cardiac Stress Test</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Cardiology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹36,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">90</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹400</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Complete Blood Count</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Pathology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹32,400</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">270</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹120</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">ECG</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Cardiology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹28,800</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">240</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹120</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">X-Ray</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Radiology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹25,200</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">210</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹120</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Operational Dashboard */}
      {reportType === 'operational' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-800">545</p>
                  <div className="flex items-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">8.2% MoM</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Doctors Available</p>
                  <p className="text-2xl font-bold text-gray-800">18</p>
                  <div className="flex items-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">2 new this month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg. Wait Time</p>
                  <p className="text-2xl font-bold text-gray-800">12 min</p>
                  <div className="flex items-center mt-2 text-green-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="text-sm">3.5% better</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bed Occupancy</p>
                  <p className="text-2xl font-bold text-gray-800">78%</p>
                  <div className="flex items-center mt-2 text-amber-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">5.2% higher</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Patient Growth Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Growth</h2>
              <div className="h-80 flex items-end space-x-2">
                {mockPatientData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md" 
                      style={{ 
                        height: `${(item.count / Math.max(...mockPatientData.map(d => d.count)) * 100) * 0.7}%`,
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{item.month}</div>
                    <div className="text-xs font-medium text-gray-800">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Appointment Status Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointments by Status</h2>
              <div className="flex">
                <div className="w-1/2">
                  {/* Simplified pie chart representation */}
                  <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 rounded-full border-8 border-green-500"></div>
                    <div className="absolute inset-0 rounded-full border-t-8 border-r-8 border-blue-500" style={{ transform: 'rotate(115deg)' }}></div>
                    <div className="absolute inset-0 rounded-full border-t-8 border-r-8 border-red-500" style={{ transform: 'rotate(175deg)' }}></div>
                    <div className="absolute inset-0 rounded-full border-t-8 border-gray-500" style={{ transform: 'rotate(205deg)' }}></div>
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="space-y-3">
                    {mockAppointmentsByStatus.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-red-500' : 
                          'bg-gray-500'
                        } mr-2`}></div>
                        <div className="text-xs text-gray-800 flex-1">{item.status}</div>
                        <div className="text-xs font-medium text-gray-800">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Department Efficiency Table */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-orange-100">
              <h2 className="text-lg font-semibold text-gray-800">Department Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-orange-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Avg. Wait Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Patient Satisfaction
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Staff Utilization
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Monthly Patients
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-orange-100">
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Cardiology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">10 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">92%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">85%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">180</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Radiology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">15 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">88%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">90%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">210</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Neurology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">18 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">90%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">78%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">150</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Pathology</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">8 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">94%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">82%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">190</td>
                  </tr>
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">General Medicine</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">12 min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">89%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                      <span className="text-xs text-gray-800">95%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">280</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Export Options */}
      <div className="flex justify-end space-x-3 mb-8">
        <button className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span>Export as PDF</span>
        </button>
        <button className="px-4 py-2 bg-white border border-orange-200 text-gray-700 rounded-lg shadow-sm hover:bg-orange-50 transition-all flex items-center gap-2">
          <LineChart className="w-4 h-4" />
          <span>Export as Excel</span>
        </button>
      </div>
      
      {/* Management Links Section */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-orange-100">
          <h2 className="text-lg font-semibold text-gray-800">Management</h2>
          <p className="text-sm text-gray-600 mt-1">Quick access to clinic management modules</p>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          <PermissionGuard permission={Permission.VIEW_DEPARTMENTS}>
            <Link 
              to="/departments" 
              className="flex items-center justify-between p-6 border-b md:border-r border-orange-100 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Department Management</h3>
                  <p className="text-sm text-gray-600">Manage departments and assign heads</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </PermissionGuard>
          
          <PermissionGuard permission={Permission.VIEW_DOCTORS}>
            <Link 
              to="/doctors" 
              className="flex items-center justify-between p-6 border-b md:border-r lg:border-r-0 border-orange-100 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <UserRound className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Doctor Management</h3>
                  <p className="text-sm text-gray-600">Manage doctors and assignments</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </PermissionGuard>
          
          <PermissionGuard permission={Permission.VIEW_MEDICAL_SERVICES}>
            <Link 
              to="/services" 
              className="flex items-center justify-between p-6 border-b lg:border-r border-orange-100 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Service Management</h3>
                  <p className="text-sm text-gray-600">Manage medical services</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </PermissionGuard>
          
          <PermissionGuard permission={Permission.VIEW_APPOINTMENTS}>
            <Link 
              to="/appointments" 
              className="flex items-center justify-between p-6 border-b md:border-r border-orange-100 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Appointment Management</h3>
                  <p className="text-sm text-gray-600">Manage patient appointments</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </PermissionGuard>
          
          <PermissionGuard permission={Permission.VIEW_PATIENTS}>
            <Link 
              to="/patients" 
              className="flex items-center justify-between p-6 border-b md:border-r lg:border-r-0 border-orange-100 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Patient Management</h3>
                  <p className="text-sm text-gray-600">Manage patient records</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </PermissionGuard>
          
          <PermissionGuard permission={Permission.VIEW_USERS}>
            <Link 
              to="/users" 
              className="flex items-center justify-between p-6 border-orange-100 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">User Management</h3>
                  <p className="text-sm text-gray-600">Manage system users</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
