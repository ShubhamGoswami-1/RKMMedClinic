import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome to RKM Medical Centre - Your healthcare management hub</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-800">1,234</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">👥</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-800">28</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">📅</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Revenue (Month)</p>
                    <p className="text-2xl font-bold text-gray-800">$45,678</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-xl">💰</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Active Staff</p>
                    <p className="text-2xl font-bold text-gray-800">12</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">👨‍⚕️</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
                  onClick={() => navigate('/appointments/create')}
                >
                  <h3 className="font-medium text-gray-800 mb-2">Schedule Appointment</h3>
                  <p className="text-sm text-gray-600">Book a new appointment slot</p>
                </button>
                <button 
                  className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
                  onClick={() => navigate('/service-requests')}
                >
                  <h3 className="font-medium text-gray-800 mb-2">Service Requests</h3>
                  <p className="text-sm text-gray-600">Manage medical service requests</p>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-8">
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 capitalize">
                {activeTab.replace('-', ' ')} Section
              </h2>
              <p className="text-gray-600 mb-6">
                This section is under development. Content will be added soon.
              </p>
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-orange-600 text-3xl">🚧</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;