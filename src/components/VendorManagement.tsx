import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Building, Phone, Mail, MapPin } from 'lucide-react';
import databaseService from '../services/databaseService';
import VendorCreationForm from './VendorCreationForm';

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  address: string;
  total_vehicles: number;
  total_drivers: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
}

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching vendors from database...');
      const vendorsData = await databaseService.fetchVendors();
      setVendors(vendorsData);
      console.log(`✅ Fetched ${vendorsData.length} vendors from database:`, vendorsData);
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVendor = async (vendorId: string) => {
    try {
      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, is_verified: true, updated_at: new Date().toISOString() }
          : vendor
      ));
      alert('Vendor verified successfully!');
    } catch (error) {
      console.error('❌ Error verifying vendor:', error);
      alert('Failed to verify vendor');
    }
  };

  const handleSuspendVendor = async (vendorId: string, isVerified: boolean) => {
    const action = isVerified ? 'suspend' : 'activate';
    if (confirm(`Are you sure you want to ${action} this vendor?`)) {
      try {
        setVendors(prev => prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, is_verified: !isVerified, updated_at: new Date().toISOString() }
            : vendor
        ));
        alert(`Vendor ${action}ed successfully!`);
      } catch (error) {
        console.error(`❌ Error ${action}ing vendor:`, error);
        alert(`Failed to ${action} vendor`);
      }
    }
  };

  const handleVendorCreationSuccess = async () => {
    try {
      // Refresh vendors list after successful creation
      console.log('🔄 Refreshing vendors list after successful creation...');
      setLoading(true);
      
      // Add a longer delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchVendors();
      console.log('✅ Vendors list refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing vendors list:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading vendors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Vendor Management</h3>
          <p className="text-gray-600 mt-1">Manage fleet partners and vendor accounts</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchVendors}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <button 
            onClick={async () => {
              console.log('🔧 Force refresh with detailed logging...');
              setLoading(true);
              try {
                await fetchVendors();
              } finally {
                setLoading(false);
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>🔧</span>
            <span>Debug Fetch</span>
          </button>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            onClick={() => setShowVendorForm(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Vendors</p>
              <p className="text-3xl font-bold">{vendors.length}</p>
            </div>
            <Building className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Verified</p>
              <p className="text-3xl font-bold">{vendors.filter(v => v.is_verified).length}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Vehicles</p>
              <p className="text-3xl font-bold">{vendors.reduce((sum, v) => sum + v.total_vehicles, 0)}</p>
            </div>
            <span className="text-4xl">🚗</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Drivers</p>
              <p className="text-3xl font-bold">{vendors.reduce((sum, v) => sum + v.total_drivers, 0)}</p>
            </div>
            <span className="text-4xl">👥</span>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      {vendors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vendors Found</h3>
          <p className="text-gray-600 mb-4">No vendor partners have been registered yet.</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Add First Vendor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">
              Registered Vendors ({vendors.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fleet Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.company_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <Mail className="w-3 h-3" />
                        <span>{vendor.email || 'No email'}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <Phone className="w-3 h-3" />
                        <span>{vendor.phone_number || 'No phone'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.license_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">🚗</span>
                          <span className="font-medium">{vendor.total_vehicles} vehicles</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">👥</span>
                          <span className="font-medium">{vendor.total_drivers} drivers</span>
                        </div>
                      </div>
                      {vendor.total_vehicles > 0 && vendor.total_drivers > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Ratio: {(vendor.total_vehicles / vendor.total_drivers).toFixed(1)} vehicles/driver
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vendor.is_verified 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.is_verified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Created: {new Date(vendor.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vendor.is_verified 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.is_verified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {!vendor.is_verified && (
                          <button 
                            onClick={() => handleVerifyVendor(vendor.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        <button 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleSuspendVendor(vendor.id, vendor.is_verified)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          {vendor.is_verified ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor Creation Form Modal */}
      {showVendorForm && (
        <VendorCreationForm
          onClose={() => setShowVendorForm(false)}
          onSuccess={handleVendorCreationSuccess}
        />
      )}

      {/* Vendor Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Fleet Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {vendors.filter(v => v.is_verified).length}
            </div>
            <div className="text-sm text-gray-600">Active Vendors</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {vendors.reduce((sum, v) => sum + v.total_vehicles, 0)}
            </div>
            <div className="text-sm text-gray-600">Fleet Vehicles</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {vendors.reduce((sum, v) => sum + v.total_drivers, 0)}
            </div>
            <div className="text-sm text-gray-600">Fleet Drivers</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {vendors.length > 0 
                ? Math.round((vendors.reduce((sum, v) => sum + v.total_vehicles, 0) / vendors.reduce((sum, v) => sum + v.total_drivers, 0)) * 10) / 10 || 0
                : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Vehicle/Driver</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {vendors.filter(v => v.total_vehicles > 0 && v.total_drivers > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Fleets</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorManagement;