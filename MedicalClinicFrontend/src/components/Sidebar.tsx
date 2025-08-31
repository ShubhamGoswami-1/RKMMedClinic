// filepath: c:\Users\shubham.goswami1\OneDrive - Incedo Technology Solutions Ltd\Documents\Dev\Mediclinic\RKMMedClinicCombined\MedicalClinicFrontend\src\components\Sidebar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  Settings, 
  LogOut,
  Stethoscope,
  Briefcase,
  Building,
  Clock,
  UserPlus
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import { hasPageAccess, hasPermission, Permission } from '../utils/rbac';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  path: string;
  permission?: Permission;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveTab }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Get the current path from location to highlight active menu item
  const currentPath = location.pathname;

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'patients', label: 'Patients', icon: Users, path: '/patients' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/appointments' },
    { id: 'service-requests', label: 'Service Requests', icon: FileText, path: '/service-requests' },
    { id: 'medical-services', label: 'Medical Services', icon: Briefcase, path: '/medical-services' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, path: '/doctors' },
    { id: 'departments', label: 'Departments', icon: Building, path: '/departments' },
    { id: 'staff-add', label: 'Add Staff', icon: UserPlus, path: '/staff/add', permission: Permission.MANAGE_STAFF },
    { id: 'billing', label: 'Billing', icon: DollarSign, path: '/billing' },
    { 
      id: 'leave-management', 
      label: 'Leave Management', 
      icon: Clock, 
      path: hasPermission(user, Permission.VIEW_ALL_LEAVE_REQUESTS) ? '/leave-management-admin' : '/leave-management' 
    },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Filter menu items based on user's role and page access
  const filteredMenuItems = menuItems.filter(item => {
    // First check if the user has access to this page
    const hasAccess = hasPageAccess(user, item.path);
    
    // Then check if a specific permission is required
    if (item.permission && !hasPermission(user, item.permission)) {
      return false;
    }
    
    return hasAccess;
  });

  return (
    <div className="bg-white h-screen w-64 shadow-lg border-r border-orange-100 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-orange-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">RKM Medical Centre</h1>
            <p className="text-xs text-gray-500">Healthcare Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    // If the Dashboard component is using activeTab, also update it
                    if (setActiveTab) {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
