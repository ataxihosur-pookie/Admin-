import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import databaseService from './services/databaseService';
import { AdminService } from '../shared/services/adminService';
import DriverCreationForm from './components/DriverCreationForm';
import ZonesManagement from './components/ZonesManagement';
import FareConfigManagement from './components/FareConfigManagement';
import PromoCodesManagement from './components/PromoCodesManagement';
import AdvertisementsManagement from './components/AdvertisementsManagement';
import VendorManagement from './components/VendorManagement';
import LiveMap from './components/LiveMap';
import OngoingRides from './components/OngoingRides';
import FareMatrixManagement from './components/FareMatrixManagement';
import TestCustomerCreation from './components/TestCustomerCreation';
import OutstationFareManagement from './components/OutstationFareManagement';
import OutstationPackagesManagement from './components/OutstationPackagesManagement';
import AirportFareManagement from './components/AirportFareManagement';
import RentalFareManagement from './components/RentalFareManagement';
import DriverCredentialsModal from './components/DriverCredentialsModal';

interface DriverWithDetails {
  driver_id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  status: string;
  rating: number;
  total_rides: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    full_name: string;
    email: string;
    phone_number: string;
  };
  vehicles?: {
    registration_number: string;
    make: string;
    model: string;
  };
  username?: string;
  password?: string;
}

interface DashboardProps {
  user: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
  onSignOut: () => Promise<void>;
  supabase: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut, supabase }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [rides, setRides] = useState<any[]>([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [customerSubscription, setCustomerSubscription] = useState<any>(null);
  const [driverSubscription, setDriverSubscription] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    totalDrivers: 0,
    totalRides: 0,
    todayRides: 0,
    activeDrivers: 0,
    totalRevenue: 0
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedDriverForCredentials, setSelectedDriverForCredentials] = useState<any>(null);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'rides', label: 'Rides', icon: '🚗' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'vendors', label: 'Vendors', icon: '🏢' },
    { id: 'ongoing', label: 'Bookings', icon: '⏰' },
    { id: 'history', label: 'History', icon: '✅' },
    { id: 'zones', label: 'Zones', icon: '🌍' },
    { id: 'fare-matrix', label: 'Fare Matrix', icon: '📊' },
    { id: 'outstation-fare', label: 'Outstation Fare', icon: '🛣️' },
    { id: 'outstation-packages', label: 'Outstation Packages', icon: '📦' },
    { id: 'rental-fare', label: 'Rental Fare', icon: '⏰' },
    { id: 'airport-fare', label: 'Airport Fare', icon: '✈️' },
    { id: 'live-map', label: 'Live Map', icon: '🗺️' },
    { id: 'promo-codes', label: 'Promo Codes', icon: '🏷️' },
    { id: 'advertisements', label: 'Advertisements', icon: '📢' },
  ];

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const customersData = await databaseService.fetchCustomers();
      setCustomers(customersData);
      console.log('✅ Fetched customers:', customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const driversData = await databaseService.fetchDrivers();
      setDrivers(driversData);
      console.log('✅ Fetched drivers:', driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchRides = async () => {
    setRidesLoading(true);
    try {
      const ridesData = await databaseService.fetchRides();
      setRides(ridesData);
      console.log('✅ Fetched rides:', ridesData);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setRides([]);
    } finally {
      setRidesLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const stats = await AdminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    // Subscribe to customer updates when on customers tab
    if (activeTab === 'customers') {
      console.log('🔔 Setting up customer subscription for role=customer only');
      const subscription = databaseService.subscribeToCustomerUpdates((payload) => {
        console.log('🔔 New customer signup:', payload);
        // Only add if it's a customer role
        if (payload.eventType === 'INSERT' && payload.new?.role === 'customer') {
          setCustomers(prev => [payload.new, ...prev]);
          fetchDashboardStats(); // Update stats
        }
      });
      setCustomerSubscription(subscription);
    } else if (customerSubscription) {
      customerSubscription.unsubscribe();
      setCustomerSubscription(null);
    }

    // Subscribe to driver updates when on drivers tab
    if (activeTab === 'drivers') {
      const driverUpdatesSubscription = databaseService.subscribeToDriverLocations((payload) => {
        console.log('🔔 Driver update:', payload);
        fetchDrivers(); // Refresh drivers list
        fetchDashboardStats(); // Update stats
      });
      setDriverSubscription(driverUpdatesSubscription);
    } else if (driverSubscription) {
      driverSubscription.unsubscribe();
      setDriverSubscription(null);
    }

    return () => {
      if (customerSubscription) customerSubscription.unsubscribe();
      if (driverSubscription) driverSubscription.unsubscribe();
    };
  }, [activeTab]);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleDriverCreationSuccess = async () => {
    try {
      // Refresh drivers list and stats after successful creation
      console.log('🔄 Refreshing drivers list after successful creation...');
      setDriversLoading(true);
      await fetchDrivers();
      await fetchDashboardStats();
      console.log('✅ Drivers list refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing drivers list:', error);
      // Don't throw error - just log it so the modal still closes
    } finally {
      setDriversLoading(false);
    }
  };

  const handleVerifyDriver = async (driverId: string) => {
    try {
      console.log('🔍 Verifying driver:', driverId);
      await databaseService.verifyDriver(driverId);
      console.log('✅ Driver verified successfully');
      alert('Driver verified successfully! They can now accept rides.');
      await fetchDrivers(); // Refresh the drivers list
      await fetchDashboardStats(); // Update stats
    } catch (error) {
      console.error('❌ Error verifying driver:', error);
      alert('Failed to verify driver. Please try again.');
    }
  };

  const handleEditDriver = async (driverId: string) => {
    // TODO: Implement edit driver functionality
    alert(`Edit driver functionality will be implemented soon.\nDriver ID: ${driverId}`);
  };

  const handleSuspendDriver = async (driverId: string, currentStatus: string) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    const newStatus = currentStatus === 'suspended' ? 'offline' : 'suspended';
    
    if (confirm(`Are you sure you want to ${action} this driver?`)) {
      try {
        console.log(`${action === 'activate' ? '✅' : '🚫'} ${action === 'activate' ? 'Activating' : 'Suspending'} driver:`, driverId);
        await databaseService.updateDriverStatus(driverId, newStatus);
        console.log(`✅ Driver ${action}d successfully`);
        alert(`Driver ${action}d successfully!`);
        await fetchDrivers(); // Refresh the drivers list
        await fetchDashboardStats(); // Update stats
      } catch (error) {
        console.error(`❌ Error ${action}ing driver:`, error);
        alert(`Failed to ${action} driver. Please try again.`);
      }
    }
  };

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (confirm(`Are you sure you want to permanently delete driver "${driverName}"?\n\nThis action cannot be undone and will remove:\n• Driver profile\n• Vehicle records\n• Login credentials\n• All associated data`)) {
      try {
        console.log('🗑️ Deleting driver:', driverId);
        await databaseService.deleteDriver(driverId);
        console.log('✅ Driver deleted successfully');
        alert(`Driver "${driverName}" has been permanently deleted.`);
        await fetchDrivers(); // Refresh the drivers list
        await fetchDashboardStats(); // Update stats
      } catch (error) {
        console.error('❌ Error deleting driver:', error);
        alert(`Failed to delete driver "${driverName}". Please try again.`);
      }
    }
  };

  // Auto-fetch data when tabs change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'customers') {
      fetchCustomers();
    } else if (tabId === 'drivers') {
      fetchDrivers();
    } else if (tabId === 'rides') {
      fetchRides();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-red-400">A1 Call Taxi</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === item.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700">
          <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-yellow-700 transition-colors">
            🚫 Clear Stuck Rides
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                🔔
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                ⚙️
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Customers</p>
                      <p className="text-3xl font-bold">{dashboardStats.totalCustomers}</p>
                    </div>
                    <span className="text-4xl">👥</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-100 text-sm">Total Drivers</p>
                      <p className="text-3xl font-bold">{dashboardStats.totalDrivers}</p>
                    </div>
                    <span className="text-4xl">👤</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Rides</p>
                      <p className="text-3xl font-bold">{dashboardStats.totalRides}</p>
                    </div>
                    <span className="text-4xl">🚗</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Active Drivers</p>
                      <p className="text-3xl font-bold">{dashboardStats.activeDrivers}</p>
                    </div>
                    <span className="text-4xl">🚗</span>
                  </div>
                </div>
              </div>

              {/* Ride Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-yellow-600 text-lg font-semibold">Pending</h3>
                  <p className="text-4xl font-bold text-yellow-600">2</p>
                </div>
                <div className="text-center">
                  <h3 className="text-blue-600 text-lg font-semibold">Active</h3>
                  <p className="text-4xl font-bold text-blue-600">2</p>
                </div>
                <div className="text-center">
                  <h3 className="text-green-600 text-lg font-semibold">Completed</h3>
                  <p className="text-4xl font-bold text-green-600">1</p>
                </div>
              </div>

              {/* Recent Rides Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Rides</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#69</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          Test User Chennai<br />
                          <span className="text-gray-500">9994926574</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">Not assigned</td>
                        <td className="px-6 py-4 text-sm text-gray-900">T. Nagar, Chennai...</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹90.74</td>
                        <td className="px-6 py-4 text-sm text-gray-500">2024-01-15</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#68</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          Test User Chennai<br />
                          <span className="text-gray-500">9994926574</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          Test Driver SUV<br />
                          <span className="text-gray-500">9876543210</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">T. Nagar, Chennai...</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Accepted</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹103.89</td>
                        <td className="px-6 py-4 text-sm text-gray-500">2024-01-15</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#67</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          Nithya<br />
                          <span className="text-gray-500">8608374935</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          akkif<br />
                          <span className="text-gray-500">7010213984</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">House # 2/801, 1st floor, NGG...</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹76.97</td>
                        <td className="px-6 py-4 text-sm text-gray-500">2024-01-14</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Customer Signups</h3>
                <div className="flex space-x-3">
                  <button 
                    onClick={fetchCustomers}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {customersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Loading customers...</span>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
                    <p className="text-gray-600 mb-4">No customer signups available yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Recent Customer Signups ({customers.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Activity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                      {customer.full_name?.charAt(0) || 'C'}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {customer.full_name || 'Unknown Customer'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {customer.email || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {customer.phone_number || 'Not provided'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(customer.updated_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(customer.updated_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  customer.is_active 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {customer.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Drivers Tab */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Driver Management</h3>
                <div className="flex space-x-3">
                  <button 
                    onClick={fetchDrivers}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Refresh</span>
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        console.log('🔧 Fixing missing driver records...');
                        const result = await databaseService.fixMissingDriverRecords();
                        alert(`✅ Driver Records Fixed!\n\nFixed: ${result.fixed} drivers\nMessage: ${result.message}\n\nRefreshing drivers list...`);
                        await fetchDrivers();
                        await fetchDashboardStats();
                      } catch (error) {
                        console.error('❌ Failed to fix driver records:', error);
                        alert(`❌ Failed to fix driver records: ${error.message}`);
                      }
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🔧</span>
                    <span>Fix Missing Drivers</span>
                  </button>
                  <button 
                    onClick={() => setShowDriverForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add New Driver
                  </button>
                  <button 
                    onClick={async () => {
                      console.log('🔄 Manual refresh triggered...');
                      await fetchDrivers();
                      await fetchDashboardStats();
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Force Refresh
                  </button>
                </div>
              </div>
              
              {/* Existing Drivers List */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {driversLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Loading drivers...</span>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👤</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Drivers Found</h3>
                    <p className="text-gray-600">No drivers have been registered yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Registered Drivers ({drivers.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {drivers.map((driver) => (
                            <tr key={driver.driver_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-semibold">
                                      {driver.full_name?.charAt(0) || 'D'}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {driver.full_name || 'Unknown Driver'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Driver ID: #{driver.driver_id.toString().slice(-6)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {driver.users?.phone_number || 'Not provided'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {driver.users?.email || 'No email'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {driver.username ? (
                                    <button
                                      onClick={() => {
                                        setSelectedDriverForCredentials(driver);
                                        setShowCredentialsModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      View Full Credentials
                                    </button>
                                  ) : (
                                    <span className="text-gray-500 text-sm">No credentials</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{driver.license_number}</div>
                                <div className="text-sm text-gray-500">
                                  Expires: {new Date(driver.license_expiry).toLocaleDateString('en-IN')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {driver.vehicles?.registration_number || 'Not assigned'}
                                </div>
                                {driver.vehicles?.make && (
                                  <div className="text-sm text-gray-500">
                                    {driver.vehicles.make} {driver.vehicles.model}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  driver.status === 'online' 
                                    ? 'bg-green-100 text-green-800'
                                    : driver.status === 'busy'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                                </span>
                                {driver.is_verified && (
                                  <div className="text-xs text-green-600 mt-1">✓ Verified</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="ml-1 text-sm text-gray-900">
                                    {driver.rating || '5.0'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {driver.total_rides || 0} rides
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  {!driver.is_verified && (
                                    <button 
                                      onClick={() => handleVerifyDriver(driver.driver_id)}
                                      className="text-green-600 hover:text-green-800 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                    >
                                      Verify
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleEditDriver(driver.driver_id)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleSuspendDriver(driver.driver_id, driver.status)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                  >
                                    {driver.status === 'suspended' ? 'Activate' : 'Suspend'}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteDriver(driver.driver_id, driver.full_name)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Zones Tab */}
          {activeTab === 'zones' && <ZonesManagement />}

          {/* Fare Matrix Tab */}
          {activeTab === 'fare-matrix' && <FareMatrixManagement />}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && <OngoingRides />}

          {/* Ongoing Tab */}
          {activeTab === 'ongoing' && <OngoingRides />}

          {/* Other tabs */}
          {activeTab === 'promo-codes' && <PromoCodesManagement user={user} />}

          {/* Advertisements Tab */}
          {activeTab === 'advertisements' && <AdvertisementsManagement />}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && <VendorManagement />}

          {/* Live Map Tab */}
          {activeTab === 'live-map' && <LiveMap />}

          {/* Rides Tab */}
          {activeTab === 'rides' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">All Rides Management</h3>
                <div className="flex space-x-3">
                  <button 
                    onClick={fetchRides}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {ridesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Loading rides...</span>
                  </div>
                ) : rides.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚗</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rides Found</h3>
                    <p className="text-gray-600 mb-4">No rides have been booked yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">
                        All Rides ({rides.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ride Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Driver Assigned
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Route
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fare
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rides.map((ride) => (
                            <tr key={ride.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                      {ride.booking_type === 'rental' ? '⏰' : 
                                       ride.booking_type === 'outstation' ? '🛣️' : 
                                       ride.booking_type === 'airport' ? '✈️' : '🚗'}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      #{ride.ride_code}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {ride.booking_type?.charAt(0).toUpperCase() + ride.booking_type?.slice(1) || 'Regular'}
                                    </div>
                                    {ride.vehicle_type && (
                                      <div className="text-xs text-blue-600 capitalize">
                                        {ride.vehicle_type.replace('_', ' ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-semibold text-sm">
                                      {ride.customer_name?.charAt(0) || 'C'}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {ride.customer_name || 'Unknown Customer'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {ride.customer_phone || 'No phone'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {ride.driver_name ? (
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                      <span className="text-purple-600 font-semibold text-sm">
                                        {ride.driver_name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {ride.driver_name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {ride.driver_phone || 'No phone'}
                                      </div>
                                      {ride.vehicle_registration && (
                                        <div className="text-xs text-gray-500 font-mono">
                                          {ride.vehicle_registration}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                                      <span className="text-gray-400 text-sm">?</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Not assigned</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-900 truncate max-w-xs">
                                      {ride.pickup_address}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-gray-900 truncate max-w-xs">
                                      {ride.destination_address}
                                    </span>
                                  </div>
                                  {ride.distance_km && (
                                    <div className="text-xs text-gray-500">
                                      📏 {ride.distance_km} km
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  ride.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  ride.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                                  ride.status === 'requested' ? 'bg-orange-100 text-orange-800' :
                                  ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ride.status === 'in_progress' ? 'In Progress' :
                                   ride.status === 'driver_arrived' ? 'Driver Arrived' :
                                   ride.status?.charAt(0).toUpperCase() + ride.status?.slice(1) || 'Unknown'}
                                </span>
                                {ride.payment_status && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Payment: {ride.payment_status}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {ride.fare_amount ? `₹${ride.fare_amount}` : 'Not calculated'}
                                </div>
                                {ride.payment_method && (
                                  <div className="text-xs text-gray-500 capitalize">
                                    {ride.payment_method}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(ride.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(ride.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Outstation Fare Tab */}
          {activeTab === 'outstation-fare' && (
            <OutstationFareManagement />
          )}

          {/* Outstation Packages Tab */}
          {activeTab === 'outstation-packages' && (
            <OutstationPackagesManagement />
          )}

          {/* Rental Fare Tab */}
          {activeTab === 'rental-fare' && (
            <RentalFareManagement />
          )}

          {/* Airport Fare Tab */}
          {activeTab === 'airport-fare' && (
            <AirportFareManagement />
          )}

          {/* Other tabs */}
          {activeTab !== 'dashboard' && activeTab !== 'customers' && activeTab !== 'drivers' && activeTab !== 'zones' && activeTab !== 'fare-matrix' && activeTab !== 'ongoing' && activeTab !== 'promo-codes' && activeTab !== 'advertisements' && activeTab !== 'live-map' && activeTab !== 'vendors' && activeTab !== 'outstation-fare' && activeTab !== 'outstation-packages' && activeTab !== 'rental-fare' && activeTab !== 'airport-fare' && activeTab !== 'rides' && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">
                    {sidebarItems.find(item => item.id === activeTab)?.icon}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {sidebarItems.find(item => item.id === activeTab)?.label}
                </h3>
                <p className="text-gray-600">This section is under development</p>
                <p className="text-sm text-gray-500 mt-2">
                  Click on "Dashboard" to return to the main view
                </p>
              </div>
            </div>
          )}
        </main>
        
        {/* Driver Creation Form Modal */}
        {showDriverForm && (
          <DriverCreationForm
            onClose={() => setShowDriverForm(false)}
            onSuccess={handleDriverCreationSuccess}
          />
        )}
        
        {/* Driver Credentials Modal */}
        {showCredentialsModal && selectedDriverForCredentials && (
          <DriverCredentialsModal
            driver={selectedDriverForCredentials}
            onClose={() => {
              setShowCredentialsModal(false);
              setSelectedDriverForCredentials(null);
            }}
            onRefresh={async () => {
              await fetchDrivers();
              await fetchDashboardStats();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;