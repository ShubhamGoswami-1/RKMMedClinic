import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useGlobalAlert } from '../../hooks/useGlobalAlert';
import { patientService } from '../../services/api';
import { Patient } from '../../types/models';

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
  onRegisterNew: () => void;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onPatientSelect, onRegisterNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { showAlert } = useGlobalAlert();
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Create search params object based on search type
      const searchParams: Record<string, string> = {};
      searchParams[searchType] = searchTerm;
      
      // Call API to search patients
      const response = await patientService.searchPatients(searchParams);
      setSearchResults(response.data.patients || []);
      
      if (response.data.patients.length === 0) {
        showAlert('info', 'No patients found matching your search criteria.');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      showAlert('error', 'Failed to search patients. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Find Patient</h2>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/4">
          <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-1">Search By</label>
          <select 
            id="searchType" 
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="aadhar">Aadhar Number</option>
            <option value="pan">PAN Number</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div className="md:w-2/4">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Search Term</label>
          <input
            type="text"
            id="searchTerm"
            placeholder={`Enter ${searchType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="md:w-1/4 flex items-end">
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="mr-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center justify-center"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Search className="h-5 w-5 mr-2" />
            )}
            Search
          </button>
          <button
            onClick={onRegisterNew}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            New Patient
          </button>
        </div>
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DOB
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResults.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.dateOfBirth}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.phone}</div>
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onPatientSelect(patient)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
