import React, { useState, useEffect } from 'react';
import { User, Phone, Star, Car, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { driverAssignmentService } from '../services/driverAssignmentService';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  rating: number;
  total_rides: number;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  distance?: number;
}

interface OngoingRide {
  id: string;
  ride_code: string;
  booking_type: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  customer_name: string;
  customer_phone: string;
  source_table?: string;
  created_at?: string;
}

interface DriverAssignmentModalProps {
  ride: OngoingRide;
  onClose: () => void;
  onSuccess: () => void;
}

const DriverAssignmentModal: React.FC<DriverAssignmentModalProps> = ({
  ride,
  onClose,
  onSuccess
}) => {
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string>('');

  const bookingTypeLabels = {
    rental: 'Rental',
    outstation: 'Outstation',
    airport: 'Airport Transfer',
    regular: 'Regular'
  };

  const bookingTypeIcons = {
    rental: '⏰',
    outstation: '🛣️',
    airport: '✈️',
    regular: '🚗'
  };

  useEffect(() => {
    fetchAvailableDrivers();
  }, []);

  const fetchAvailableDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 DriverAssignmentModal: Fetching REAL available drivers from database...');
      
      // Get all drivers first to see what's in the database
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Call edge function to get all drivers with real data
      console.log('📡 Calling get-drivers edge function...');
      const response = await fetch(`${supabaseUrl}/functions/v1/get-drivers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch drivers');
      }

      console.log(`📊 Total drivers in database: ${result.count}`);
      console.log('🔍 Debug info:', result.debug_info);
      
      const allDrivers = result.drivers || [];
      
      // Log all drivers found
      console.log('👥 All drivers found:');
      allDrivers.forEach((driver: any, index: number) => {
        console.log(`  ${index + 1}. ${driver.users?.full_name || 'NO NAME'} (${driver.driver_id}) - Status: ${driver.status} - Verified: ${driver.is_verified} - Phone: ${driver.users?.phone_number || 'NO PHONE'}`);
      });
      
      // Filter for available drivers (online, verified, not on active rides)
      const onlineVerifiedDrivers = allDrivers.filter((driver: any) => 
        driver.status === 'online' && driver.is_verified === true
      );
      
      console.log(`📊 Online & verified drivers: ${onlineVerifiedDrivers.length}`);
      onlineVerifiedDrivers.forEach((driver: any) => {
        console.log(`  ✅ Available: ${driver.users?.full_name} (${driver.driver_id})`);
      });
      
      // Check for drivers on active rides
      const busyResponse = await fetch(`${supabaseUrl}/rest/v1/rides?select=driver_id&status=in.(accepted,driver_arrived,in_progress)&driver_id=not.is.null`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });
      
      const busyRides = busyResponse.ok ? await busyResponse.json() : [];
      const busyDriverIds = new Set(busyRides.map((ride: any) => ride.driver_id));
      
      console.log(`📊 Drivers on active rides: ${busyDriverIds.size}`);
      console.log('🚫 Busy driver IDs:', Array.from(busyDriverIds));
      
      // Filter out busy drivers
      const availableDrivers = onlineVerifiedDrivers.filter((driver: any) => 
        !busyDriverIds.has(driver.driver_id)
      );
      
      console.log(`📊 Final available drivers: ${availableDrivers.length}`);
      availableDrivers.forEach((driver: any) => {
        console.log(`  🟢 Ready for assignment: ${driver.users?.full_name} (${driver.driver_id}) - ${driver.users?.phone_number}`);
      });
      
      // Transform to match expected interface
      const transformedDrivers: Driver[] = availableDrivers.map((driver: any) => ({
        id: driver.driver_id,
        full_name: driver.users?.full_name || 'Unknown Driver',
        phone_number: driver.users?.phone_number || 'No phone',
        rating: driver.rating || 5.0,
        total_rides: driver.total_rides || 0,
        vehicle_registration: driver.vehicles?.registration_number,
        vehicle_make: driver.vehicles?.make,
        vehicle_model: driver.vehicles?.model,
        vehicle_type: driver.vehicles?.vehicle_type
      }));
      
      setAvailableDrivers(transformedDrivers);
      
      console.log(`✅ DriverAssignmentModal: Set ${transformedDrivers.length} available drivers`);
      transformedDrivers.forEach(driver => {
        console.log(`👤 Final: ${driver.full_name} (${driver.id}) - ${driver.phone_number} - Vehicle: ${driver.vehicle_registration || 'None'}`);
      });
      
      if (transformedDrivers.length === 0) {
        setError('No drivers are currently available. Please ensure drivers are online and verified, or check if all drivers are busy with other rides.');
      }
    } catch (error) {
      console.error('❌ DriverAssignmentModal: Error fetching available drivers:', error);
      setError(`Failed to load available drivers: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your database connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      setError('Please select a driver');
      return;
    }

    setAssigning(true);
    setError('');

    try {
      console.log('🚗 Assigning driver to ride:', {
        rideId: ride.id,
        driverId: selectedDriverId,
        adminNotes
      });

      const result = await driverAssignmentService.assignDriverToRide({
        rideId: ride.id,
        driverId: selectedDriverId,
        adminNotes: adminNotes.trim(),
        sourceTable: ride.source_table || 'scheduled_bookings' // Use actual source table or default to scheduled_bookings
      });

      if (result.success) {
        console.log('✅ Driver assigned successfully:', result);
        
        // Show success message
        const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);
        alert(`✅ Driver Assigned Successfully!\n\nDriver: ${selectedDriver?.full_name}\nPhone: ${selectedDriver?.phone_number}\nRide: ${ride.ride_code}\n\nThe driver has been notified and will contact the customer shortly.`);
        
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to assign driver');
      }
    } catch (error) {
      console.error('❌ Error assigning driver:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign driver. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{bookingTypeIcons[ride.booking_type as keyof typeof bookingTypeIcons]}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Assign Driver</h3>
              <p className="text-gray-600 mt-1">
                Ride #{ride.ride_code} - {bookingTypeLabels[ride.booking_type as keyof typeof bookingTypeLabels]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={assigning}
          >
            ×
          </button>
        </div>

        {/* Ride Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <span>📋</span>
            <span>Ride Details</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Customer:</span>
                  <div className="font-medium text-gray-900">{ride.customer_name}</div>
                  <div className="text-sm text-gray-500 flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{ride.customer_phone}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="font-medium capitalize text-yellow-600">{ride.status.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Booking Type:</span>
                  <div className="font-medium text-gray-900 flex items-center space-x-2">
                    <span>{bookingTypeIcons[ride.booking_type as keyof typeof bookingTypeIcons]}</span>
                    <span>{bookingTypeLabels[ride.booking_type as keyof typeof bookingTypeLabels]}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created:</span>
                  <div className="font-medium text-gray-900">
                    {new Date(ride.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Route Information */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Route:</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">{ride.pickup_address}</span>
              </div>
              <div className="ml-1.5 w-0.5 h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-900">{ride.destination_address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm font-medium">Assignment Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Driver Selection */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-lg font-medium text-gray-900">
              Select Available Driver *
            </label>
            <button
              onClick={fetchAvailableDrivers}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading available drivers...</span>
            </div>
          ) : availableDrivers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚫</div>
              <div className="text-gray-600 font-medium">No drivers available</div>
              <div className="text-sm text-gray-500 mt-2">
                All drivers are currently busy or offline
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All drivers are currently on active rides</li>
                    <li>No drivers are online at the moment</li>
                    <li>All drivers are suspended or unverified</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={fetchAvailableDrivers}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Driver List
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Found {availableDrivers.length} available driver{availableDrivers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  These drivers are online, verified, and not currently on any ride
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDriverId === driver.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedDriverId === driver.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedDriverId === driver.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{driver.full_name}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{driver.phone_number}</span>
                          </div>
                          {driver.vehicle_make && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                              <Car className="w-3 h-3" />
                              <span>{driver.vehicle_make} {driver.vehicle_model}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{driver.rating}</span>
                        </div>
                        <div className="text-xs text-gray-500">{driver.total_rides} rides</div>
                        {driver.vehicle_registration && (
                          <div className="text-xs text-blue-600 font-mono mt-1">
                            {driver.vehicle_registration}
                          </div>
                        )}
                        {driver.vehicle_type && (
                          <div className="text-xs text-gray-500 capitalize">
                            {driver.vehicle_type.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Selected Driver Details */}
        {selectedDriver && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg mt-6">
            <h5 className="font-medium text-green-900 mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Selected Driver Details</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-green-700">Name:</span>
                  <div className="font-medium text-green-900">{selectedDriver.full_name}</div>
                </div>
                <div>
                  <span className="text-sm text-green-700">Phone:</span>
                  <div className="font-medium text-green-900">{selectedDriver.phone_number}</div>
                </div>
                <div>
                  <span className="text-sm text-green-700">Rating:</span>
                  <div className="font-medium text-green-900 flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{selectedDriver.rating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-green-700">Experience:</span>
                  <div className="font-medium text-green-900">{selectedDriver.total_rides} completed rides</div>
                </div>
                {selectedDriver.vehicle_make && (
                  <div>
                    <span className="text-sm text-green-700">Vehicle:</span>
                    <div className="font-medium text-green-900">
                      {selectedDriver.vehicle_make} {selectedDriver.vehicle_model}
                    </div>
                    {selectedDriver.vehicle_registration && (
                      <div className="text-sm text-green-600 font-mono">
                        {selectedDriver.vehicle_registration}
                      </div>
                    )}
                  </div>
                )}
                {selectedDriver.vehicle_type && (
                  <div>
                    <span className="text-sm text-green-700">Vehicle Type:</span>
                    <div className="font-medium text-green-900 capitalize">
                      {selectedDriver.vehicle_type.replace('_', ' ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes (Optional)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any special instructions for the driver (e.g., customer preferences, route notes, special requirements)..."
          />
          <p className="text-xs text-gray-500 mt-1">
            These notes will be visible to the assigned driver
          </p>
        </div>

        {/* Assignment Progress */}
        {assigning && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="font-medium text-blue-900">Assigning Driver...</div>
                <div className="text-sm text-blue-700">
                  Updating ride status and notifying the driver
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            onClick={handleAssignDriver}
            disabled={!selectedDriverId || assigning || availableDrivers.length === 0}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <span>🚗</span>
                <span>Assign Driver</span>
              </>
            )}
          </button>
        </div>

        {/* Driver Availability Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-yellow-900 mb-2">Driver Availability Criteria</h5>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• Driver must be <strong>online</strong> and available</p>
                <p>• Driver must be <strong>verified</strong> by admin</p>
                <p>• Driver must <strong>not be on any active ride</strong></p>
                <p>• Driver must have a registered vehicle</p>
              </div>
              <div className="mt-3 text-xs text-yellow-700">
                💡 If no drivers are available, ask drivers to go online or verify pending drivers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverAssignmentModal;