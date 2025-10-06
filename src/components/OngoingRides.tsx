import React, { useState, useEffect } from 'react';
import databaseService from '../services/databaseService';
import DriverAssignmentModal from './DriverAssignmentModal';

interface OngoingRide {
  id: string;
  ride_code: string;
  booking_type: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  driver_id?: string;
  rental_hours?: number;
  fare_amount?: number;
  vehicle_type?: string;
  pickup_landmark?: string;
  destination_landmark?: string;
}

const OngoingRides: React.FC = () => {
  const [ongoingRides, setOngoingRides] = useState<OngoingRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState<OngoingRide | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const bookingTypeLabels = {
    rental: 'Rental',
    outstation: 'Outstation',
    airport: 'Airport Transfer',
    regular: 'Regular'
  };

  const bookingTypeColors = {
    rental: 'bg-blue-100 text-blue-800',
    outstation: 'bg-purple-100 text-purple-800',
    airport: 'bg-green-100 text-green-800',
    regular: 'bg-gray-100 text-gray-800'
  };

  const statusColors = {
    requested: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    driver_arrived: 'bg-orange-100 text-orange-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    requested: 'Requested',
    accepted: 'Driver Assigned',
    driver_arrived: 'Driver Arrived',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  useEffect(() => {
    fetchOngoingRides();
    
    // Set up real-time subscription for ride updates
    const subscription = databaseService.subscribeToRideUpdates((payload) => {
      console.log('🔔 Ride update:', payload);
      fetchOngoingRides();
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchOngoingRides = async () => {
    setLoading(true);
    try {
      const ridesData = await databaseService.getOngoingSpecialRides();
      setOngoingRides(ridesData);
    } catch (error) {
      console.error('Error fetching ongoing rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = (ride: OngoingRide) => {
    setSelectedRide(ride);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSuccess = () => {
    setShowAssignmentModal(false);
    setSelectedRide(null);
    fetchOngoingRides(); // Refresh the rides list
  };

  const getBookingTypeIcon = (bookingType: string) => {
    const icons = {
      rental: '⏰',
      outstation: '🛣️',
      airport: '✈️',
      regular: '🚗'
    };
    return icons[bookingType as keyof typeof icons] || '🚗';
  };

  const formatRentalInfo = (ride: OngoingRide) => {
    if (ride.booking_type === 'rental' && ride.rental_hours) {
      return `${ride.rental_hours} hours rental`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading ongoing rides...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Ongoing Special Rides</h3>
          <p className="text-gray-600 mt-1">Monitor active rental, outstation, and airport rides</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchOngoingRides}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <button 
            onClick={async () => {
              try {
                console.log('🔧 Creating test scheduled bookings...');
                await databaseService.createTestScheduledBookings();
                await fetchOngoingRides();
                alert('✅ Test scheduled bookings created! Check the Bookings tab.');
              } catch (error) {
                console.error('❌ Error creating test bookings:', error);
                alert('Failed to create test bookings. Check console for details.');
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>📝</span>
            <span>Create Test Bookings</span>
          </button>
          <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
            {ongoingRides.length} Active
          </div>
        </div>
      </div>

      {/* Ongoing Rides List */}
      {ongoingRides.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ongoing Rides</h3>
          <p className="text-gray-600">All special bookings have been completed or are pending assignment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {ongoingRides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Ride Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getBookingTypeIcon(ride.booking_type)}</span>
                      <div>
                        <h4 className="text-lg font-semibold">#{ride.ride_code}</h4>
                        <p className="text-blue-100 text-sm">
                          {new Date(ride.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    {formatRentalInfo(ride) && (
                      <p className="text-blue-100 text-sm mt-1">
                        {formatRentalInfo(ride)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bookingTypeColors[ride.booking_type as keyof typeof bookingTypeColors]
                    }`}>
                      {bookingTypeLabels[ride.booking_type as keyof typeof bookingTypeLabels]}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[ride.status as keyof typeof statusColors]
                    }`}>
                      {statusLabels[ride.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ride Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {ride.customer_name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{ride.customer_name}</div>
                          <div className="text-sm text-gray-600">{ride.customer_phone}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Driver Information</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {ride.driver_name ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-lg">
                              {ride.driver_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{ride.driver_name}</div>
                            <div className="text-sm text-gray-600">{ride.driver_phone}</div>
                            {ride.vehicle_registration && (
                              <div className="text-xs text-gray-500 mt-1">
                                {ride.vehicle_registration} • {ride.vehicle_make} {ride.vehicle_model}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-gray-400">?</span>
                          </div>
                          <div className="text-sm">No driver assigned</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trip Route */}
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Trip Route</h5>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Pickup Location</div>
                        <div className="text-sm text-gray-600">{ride.pickup_address}</div>
                        {ride.pickup_landmark && (
                          <div className="text-xs text-gray-500">Near: {ride.pickup_landmark}</div>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 w-0.5 h-6 bg-gray-300"></div>
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full mt-1"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Drop Location</div>
                        <div className="text-sm text-gray-600">{ride.destination_address}</div>
                        {ride.destination_landmark && (
                          <div className="text-xs text-gray-500">Near: {ride.destination_landmark}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Booking Details</h5>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Booking Type:</span>
                        <div className="font-medium">{bookingTypeLabels[ride.booking_type as keyof typeof bookingTypeLabels]}</div>
                      </div>
                      <div>
                        <span className="text-blue-700">Vehicle Type:</span>
                        <div className="font-medium capitalize">{ride.vehicle_type?.replace('_', ' ') || 'Not specified'}</div>
                      </div>
                      {ride.rental_hours && (
                        <div>
                          <span className="text-blue-700">Duration:</span>
                          <div className="font-medium">{ride.rental_hours} hours</div>
                        </div>
                      )}
                      {ride.fare_amount && (
                        <div>
                          <span className="text-blue-700">Estimated Fare:</span>
                          <div className="font-medium">₹{ride.fare_amount}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    View Details
                  </button>
                  <button className="px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                    Contact Customer
                  </button>
                  {ride.driver_phone && (
                    <button className="px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                      Contact Driver
                    </button>
                  )}
                  {!ride.driver_id && (
                    <button 
                      onClick={() => handleAssignDriver(ride)}
                      className="px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                    >
                      Assign Driver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Driver Assignment Modal */}
      {showAssignmentModal && selectedRide && (
        <DriverAssignmentModal
          ride={selectedRide}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      {/* Summary Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Ongoing Rides Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {ongoingRides.filter(r => r.booking_type === 'rental').length}
            </div>
            <div className="text-sm text-gray-600">Rental Rides</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {ongoingRides.filter(r => r.booking_type === 'outstation').length}
            </div>
            <div className="text-sm text-gray-600">Outstation Rides</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {ongoingRides.filter(r => r.booking_type === 'airport').length}
            </div>
            <div className="text-sm text-gray-600">Airport Transfers</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {ongoingRides.filter(r => r.status === 'assigned').length}
            </div>
            <div className="text-sm text-gray-600">Driver Assigned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OngoingRides;