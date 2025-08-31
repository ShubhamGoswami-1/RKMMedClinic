import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { Permission, hasPermission } from '../utils/rbac';
import { RootState } from '../store/store';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import PermissionGuard from '../components/PermissionGuard';
import { Search } from 'lucide-react';
import { patientService } from '../services/api';

// Patient data structure
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  lastVisit?: string;
  identifiers?: {
    aadhar?: string;
    pan?: string;
    other?: string;
  };
}

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();  const { user } = useAppSelector((state: RootState) => state.auth);
  // Check permissions
  const canViewPatients = hasPermission(user, Permission.VIEW_PATIENTS);
  
  // State for patient data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [isSearching, setIsSearching] = useState(false);
  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      // Check permission first
      if (!canViewPatients) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch patients data from API - using getAllPatients instead of empty search
        const response = await patientService.getAllPatients();
        if (response && response.data && response.data.patients) {
          setPatients(response.data.patients);
        } else {
          setPatients([]);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        showAlert('error', 'Failed to load patients data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  }, [canViewPatients, showAlert]);
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // If search is empty, reset to original list
      const fetchPatients = async () => {
        try {
          setIsSearching(true);
          // Use getAllPatients instead of empty search request
          const response = await patientService.getAllPatients();
          if (response && response.data && response.data.patients) {
            setPatients(response.data.patients);
          } else {
            setPatients([]);
          }
          setIsSearching(false);
        } catch (error) {
          console.error('Error fetching patients:', error);
          showAlert('error', 'Failed to load patients data');
          setIsSearching(false);
        }
      };
      
      fetchPatients();
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Prepare search parameters based on search type
      const searchParams: any = {};
      
      switch (searchType) {
        case 'name':
          searchParams.name = searchTerm;
          break;
        case 'phone':
          searchParams.phone = searchTerm;
          break;
        case 'aadhar':
          searchParams.aadhar = searchTerm;
          break;
        case 'pan':
          searchParams.pan = searchTerm;
          break;
        default:
          searchParams.name = searchTerm;
      }
      
      // Call the API with search parameters
      const response = await patientService.searchPatients(searchParams);
      
      if (response && response.data && response.data.patients) {
        setPatients(response.data.patients);
      } else {
        setPatients([]);
      }
      
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching patients:', error);
      showAlert('error', 'Failed to search patients');
      setIsSearching(false);
    }
  };
  
  // If user doesn't have permission to view patients
  if (!canViewPatients) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
        <p className="text-gray-700">
          You don't have permission to view patients. Please contact an administrator
          if you believe this is an error.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              <Search size={20} />
            </button>
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="aadhar">Aadhar</option>
            <option value="pan">PAN</option>
          </select>
        </div>
      </div>
      
      {isLoading || isSearching ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {patients.length === 0 ? (            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-700 mb-4">No patients found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of Birth
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr 
                        key={patient.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.dateOfBirth}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.phone}</div>
                          <div className="text-sm text-gray-500">{patient.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.lastVisit || 'N/A'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Patients;
