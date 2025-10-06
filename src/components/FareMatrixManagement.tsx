import React, { useState, useEffect } from 'react';
import { CreditCard as Edit, Save, X, RefreshCw, Plus, Calculator } from 'lucide-react';
import databaseService from '../services/databaseService';

interface FareEntry {
  id: string;
  booking_type: 'regular' | 'rental' | 'outstation' | 'airport';
  vehicle_type: 'hatchback' | 'hatchback_ac' | 'sedan' | 'sedan_ac' | 'suv' | 'suv_ac';
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  minimum_fare: number;
  surge_multiplier: number;
  platform_fee_percent: number;
  cancellation_fee: number;
  hourly_rate: number; // For rental bookings
  platform_fee: number; // Platform fee in rupees
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FareMatrixManagement: React.FC = () => {
  const [fareMatrix, setFareMatrix] = useState<FareEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FareEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const bookingTypes = [
    { value: 'regular', label: 'Regular Rides', icon: '🚗', color: 'bg-blue-100 text-blue-800', description: 'Standard point-to-point rides within the city' },
    { value: 'rental', label: 'Rental (Hourly)', icon: '⏰', color: 'bg-green-100 text-green-800', description: 'Hourly rental rides for multiple stops or waiting time' },
    { value: 'outstation', label: 'Outstation', icon: '🛣️', color: 'bg-purple-100 text-purple-800', description: 'Long-distance rides to other cities' },
    { value: 'airport', label: 'Airport Transfer', icon: '✈️', color: 'bg-orange-100 text-orange-800', description: 'Dedicated airport pickup and drop services' }
  ];

  const vehicleTypes = [
    { value: 'hatchback', label: 'Hatchback', icon: '🚗' },
    { value: 'hatchback_ac', label: 'Hatchback AC', icon: '🚗' },
    { value: 'sedan', label: 'Sedan', icon: '🚕' },
    { value: 'sedan_ac', label: 'Sedan AC', icon: '🚕' },
    { value: 'suv', label: 'SUV', icon: '🚙' },
    { value: 'suv_ac', label: 'SUV AC', icon: '🚙' }
  ];

  useEffect(() => {
    fetchFareMatrix();
  }, []);

  const fetchFareMatrix = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching fare matrix from database...');
      const fares = await databaseService.fetchFareMatrix();
      
      if (fares.length === 0) {
        console.log('📝 No fares found, creating default configurations...');
        await createDefaultFareMatrix();
      } else {
        setFareMatrix(fares);
        console.log(`✅ Loaded ${fares.length} fare configurations from database`);
      }
    } catch (error) {
      console.error('❌ Error fetching fare matrix:', error);
      // Fallback to creating default configurations
      await createDefaultFareMatrix();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultFareMatrix = async () => {
    try {
      console.log('🔧 Creating default fare matrix configurations...');
      
      // First check if entries already exist to avoid duplicates
      const existingEntries = await databaseService.fetchFareMatrix();
      if (existingEntries.length > 0) {
        console.log('✅ Fare matrix entries already exist, skipping creation');
        return existingEntries;
      }
      
      const createdFares: FareEntry[] = [];
      
      // Generate fare entries for all combinations
      for (const bookingType of bookingTypes) {
        for (const vehicleType of vehicleTypes) {
          const baseRates = getDefaultRates(vehicleType.value, bookingType.value);
          
          const entryData = {
            booking_type: bookingType.value as any,
            vehicle_type: vehicleType.value as any,
            base_fare: baseRates.base_fare,
            per_km_rate: baseRates.per_km_rate,
            per_minute_rate: baseRates.per_minute_rate,
            minimum_fare: baseRates.minimum_fare,
            surge_multiplier: 1.0,
            platform_fee_percent: 8.0,
            cancellation_fee: baseRates.cancellation_fee,
            hourly_rate: baseRates.hourly_rate,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Create entry in database and get the generated ID
          await databaseService.createFareMatrixEntry(entryData);
        }
      }
      
      // Fetch the created entries from database to get proper IDs
      const fetchedFares = await databaseService.fetchFareMatrix();
      setFareMatrix(fetchedFares);
      console.log(`✅ Initialized ${fetchedFares.length} fare configurations`);
    } catch (error) {
      console.error('❌ Error creating default fare matrix:', error);
      // Fallback to mock data if database operations fail
      const mockFares = await databaseService.fetchFareMatrix(); // This will return mock data
      setFareMatrix(mockFares);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRates = (vehicleType: string, bookingType: string) => {
    const baseRates = {
      hatchback: { base: 50, perKm: 12, perMin: 2, hourly: 150, cancellation: 25 },
      hatchback_ac: { base: 60, perKm: 14, perMin: 2.5, hourly: 200, cancellation: 30 },
      sedan: { base: 70, perKm: 16, perMin: 3, hourly: 250, cancellation: 35 },
      sedan_ac: { base: 80, perKm: 18, perMin: 3.5, hourly: 300, cancellation: 40 },
      suv: { base: 90, perKm: 20, perMin: 4, hourly: 350, cancellation: 45 },
      suv_ac: { base: 100, perKm: 22, perMin: 4.5, hourly: 400, cancellation: 50 }
    };
    
    const rates = baseRates[vehicleType as keyof typeof baseRates];
    
    // Apply multipliers based on booking type
    const multipliers = {
      regular: 1.0,
      rental: 1.0, // Rental uses hourly rate
      outstation: 1.4,
      airport: 1.6
    };
    
    const multiplier = multipliers[bookingType as keyof typeof multipliers];
    
    return {
      base_fare: Math.round(rates.base * multiplier),
      per_km_rate: Math.round(rates.perKm * multiplier),
      per_minute_rate: rates.perMin * multiplier,
      minimum_fare: Math.round(rates.base * multiplier),
      hourly_rate: rates.hourly,
      cancellation_fee: rates.cancellation,
      platform_fee: bookingType === 'regular' ? 25 : bookingType === 'rental' ? 50 : bookingType === 'outstation' ? 100 : 75
    };
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<FareEntry>) => {
    setSaving(true);
    try {
      console.log('💾 Updating fare matrix entry in database:', entryId, updates);
      console.log('🔍 Platform fee in updates:', updates.platform_fee);
      
      // Update database first
      await databaseService.updateFareMatrix(entryId, updates);
      
      // Update local state only after successful database update
      setFareMatrix(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, ...updates, updated_at: new Date().toISOString() }
          : entry
      ));
      
      console.log('✅ Fare matrix entry updated successfully in database');
      
    } catch (error) {
      console.error('❌ Error updating fare matrix entry:', error);
      alert(`Failed to update fare entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    try {
      const updates: Partial<FareEntry> = {
        base_fare: editingEntry.base_fare,
        per_km_rate: editingEntry.per_km_rate,
        per_minute_rate: editingEntry.per_minute_rate,
        minimum_fare: editingEntry.minimum_fare,
        surge_multiplier: editingEntry.surge_multiplier,
        platform_fee_percent: editingEntry.platform_fee_percent,
        cancellation_fee: editingEntry.cancellation_fee,
        hourly_rate: editingEntry.hourly_rate,
        platform_fee: editingEntry.platform_fee
      };

      console.log('💾 Saving fare entry with platform_fee:', updates);
      await handleUpdateEntry(editingEntry.id, updates);
      setEditingEntry(null);
      alert('Fare configuration updated successfully!');
    } catch (error) {
      console.error('Error saving fare entry:', error);
      alert('Failed to save fare configuration');
    }
  };

  const getBookingTypeInfo = (bookingType: string) => {
    return bookingTypes.find(bt => bt.value === bookingType) || bookingTypes[0];
  };

  const getVehicleTypeInfo = (vehicleType: string) => {
    return vehicleTypes.find(vt => vt.value === vehicleType) || vehicleTypes[0];
  };

  const calculateSampleFare = (entry: FareEntry, distance: number = 5, duration: number = 15) => {
    if (entry.booking_type === 'rental') {
      // For rental, calculate based on hours
      const hours = 4; // Sample 4-hour rental
      return Math.round(entry.hourly_rate * hours * entry.surge_multiplier);
    } else {
      // For other types, calculate based on distance and time
      const baseFare = entry.base_fare;
      const distanceFare = distance * entry.per_km_rate;
      const timeFare = duration * entry.per_minute_rate;
      const subtotal = baseFare + distanceFare + timeFare;
      const total = Math.max(subtotal * entry.surge_multiplier, entry.minimum_fare);
      return Math.round(total);
    }
  };

  const groupedMatrix = bookingTypes.reduce((acc, bookingType) => {
    acc[bookingType.value] = fareMatrix.filter(entry => entry.booking_type === bookingType.value);
    return acc;
  }, {} as Record<string, FareEntry[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Initializing fare matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Fare Matrix Management</h3>
          <p className="text-gray-600 mt-1">Configure pricing for all ride types and vehicle combinations</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchFareMatrix}
            disabled={loading || saving}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => {
              if (confirm('Reset all fares to default values? This will overwrite all current configurations in the database.')) {
                createDefaultFareMatrix();
              }
            }}
            disabled={loading || saving}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {bookingTypes.map((bookingType) => {
          const entries = groupedMatrix[bookingType.value] || [];
          const activeEntries = entries.filter(e => e.is_active);
          
          return (
            <div key={bookingType.value} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{bookingType.icon}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{bookingType.label}</h4>
                    <p className="text-sm text-gray-600">{entries.length} configurations</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium text-green-600">{activeEntries.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Inactive:</span>
                  <span className="font-medium text-red-600">{entries.length - activeEntries.length}</span>
                </div>
                {activeEntries.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Base Fare:</span>
                    <span className="font-medium">
                      {bookingType.value === 'rental' 
                        ? `₹${Math.round(activeEntries.reduce((sum, e) => sum + e.hourly_rate, 0) / activeEntries.length)}/hr`
                        : `₹${Math.round(activeEntries.reduce((sum, e) => sum + e.base_fare, 0) / activeEntries.length)}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">Saving fare changes...</span>
          </div>
        </div>
      )}

      {/* Fare Matrix by Booking Type */}
      <div className="space-y-8">
        {bookingTypes.map((bookingType) => {
          const entries = groupedMatrix[bookingType.value] || [];
          
          return (
            <div key={bookingType.value} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Booking Type Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{bookingType.icon}</span>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{bookingType.label}</h4>
                      <p className="text-gray-600 mt-1">{bookingType.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${bookingType.color}`}>
                    {entries.filter(e => e.is_active).length} Active
                  </span>
                </div>
              </div>

              {/* Vehicle Type Configurations */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {entries.map((entry) => {
                    const vehicleInfo = getVehicleTypeInfo(entry.vehicle_type);
                    const isEditing = editingEntry?.id === entry.id;
                    
                    return (
                      <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Vehicle Header */}
                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{vehicleInfo.icon}</span>
                              <div>
                                <h5 className="font-semibold text-gray-900">{vehicleInfo.label}</h5>
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2 h-2 rounded-full ${entry.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  <span className="text-xs text-gray-600">{entry.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              {!isEditing ? (
                                <button
                                  onClick={() => setEditingEntry(entry)}
                                  disabled={saving}
                                  className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingEntry(null)}
                                    disabled={saving}
                                    className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Fare Configuration */}
                        <div className="p-4 space-y-4">
                          {entry.booking_type === 'rental' ? (
                            /* Rental: Hourly Rate Configuration */
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Hourly Rate (₹/hour)</label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingEntry.hourly_rate}
                                  onChange={(e) => setEditingEntry({
                                    ...editingEntry,
                                    hourly_rate: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <div className="text-2xl font-bold text-green-600">₹{entry.hourly_rate}/hr</div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Minimum booking: 4 hours
                              </div>
                            </div>
                          ) : (
                            /* Regular, Outstation, Airport: Standard Fare Structure */
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Base Fare (₹)</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingEntry.base_fare}
                                      onChange={(e) => setEditingEntry({
                                        ...editingEntry,
                                        base_fare: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  ) : (
                                    <div className="text-lg font-bold text-gray-900">₹{entry.base_fare}</div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Per KM (₹)</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingEntry.per_km_rate}
                                      onChange={(e) => setEditingEntry({
                                        ...editingEntry,
                                        per_km_rate: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  ) : (
                                    <div className="text-lg font-bold text-gray-900">₹{entry.per_km_rate}</div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Per Min (₹)</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingEntry.per_minute_rate}
                                      onChange={(e) => setEditingEntry({
                                        ...editingEntry,
                                        per_minute_rate: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  ) : (
                                    <div className="text-sm font-medium text-gray-900">₹{entry.per_minute_rate}</div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Minimum (₹)</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingEntry.minimum_fare}
                                      onChange={(e) => setEditingEntry({
                                        ...editingEntry,
                                        minimum_fare: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  ) : (
                                    <div className="text-sm font-medium text-gray-900">₹{entry.minimum_fare}</div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Surge and Platform Fee */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Surge Multiplier</label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  value={editingEntry.surge_multiplier}
                                  onChange={(e) => setEditingEntry({
                                    ...editingEntry,
                                    surge_multiplier: parseFloat(e.target.value) || 1.0
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className={`text-sm font-bold ${
                                  entry.surge_multiplier > 1 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {entry.surge_multiplier}x
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Platform Fee (₹)</label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={editingEntry.platform_fee}
                                  onChange={(e) => setEditingEntry({
                                    ...editingEntry,
                                    platform_fee: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">₹{entry.platform_fee}</div>
                              )}
                            </div>
                          </div>

                          {/* Cancellation Fee */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Cancellation Fee (₹)</label>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editingEntry.cancellation_fee}
                                onChange={(e) => setEditingEntry({
                                  ...editingEntry,
                                  cancellation_fee: parseFloat(e.target.value) || 0
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="text-sm font-medium text-red-600">₹{entry.cancellation_fee}</div>
                            )}
                          </div>

                          {/* Sample Calculation */}
                          <div className="bg-blue-50 p-3 rounded-lg mt-4">
                            <h6 className="text-xs font-medium text-blue-900 mb-2 flex items-center space-x-1">
                              <Calculator className="w-3 h-3" />
                              <span>Sample Fare</span>
                            </h6>
                            <div className="space-y-1 text-xs">
                              {entry.booking_type === 'rental' ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">4 hours rental:</span>
                                    <span className="font-medium">₹{calculateSampleFare(entry)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">8 hours rental:</span>
                                    <span className="font-medium">₹{entry.hourly_rate * 8}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">Base fare:</span>
                                    <span className="font-medium">₹{entry.base_fare}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">5km + 15min:</span>
                                    <span className="font-medium">₹{calculateSampleFare(entry, 5, 15)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">10km + 30min:</span>
                                    <span className="font-medium">₹{calculateSampleFare(entry, 10, 30)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Toggle Active Status */}
                          <div className="flex justify-between items-center pt-3 border-t">
                            <button
                              onClick={() => handleUpdateEntry(entry.id, { is_active: !entry.is_active })}
                              disabled={saving}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                entry.is_active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {entry.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <span className="text-xs text-gray-500">
                              Updated: {new Date(entry.updated_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Surge Control */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Global Surge Control</h4>
        <p className="text-gray-600 mb-4">Apply surge multiplier to all active fare configurations</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  handleUpdateEntry(entry.id, { surge_multiplier: 1.0 });
                }
              });
              alert('Applied normal pricing (1.0x) to all active fares!');
            }}
            disabled={saving}
            className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">1.0x</div>
            <div className="text-sm">Normal Pricing</div>
          </button>
          
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  handleUpdateEntry(entry.id, { surge_multiplier: 1.5 });
                }
              });
              alert('Applied 1.5x surge to all active fares!');
            }}
            disabled={saving}
            className="bg-yellow-100 text-yellow-700 p-4 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">1.5x</div>
            <div className="text-sm">High Demand</div>
          </button>
          
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  handleUpdateEntry(entry.id, { surge_multiplier: 2.0 });
                }
              });
              alert('Applied 2.0x surge to all active fares!');
            }}
            disabled={saving}
            className="bg-orange-100 text-orange-700 p-4 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">2.0x</div>
            <div className="text-sm">Peak Hours</div>
          </button>
          
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  handleUpdateEntry(entry.id, { surge_multiplier: 3.0 });
                }
              });
              alert('Applied 3.0x emergency surge to all active fares!');
            }}
            disabled={saving}
            className="bg-red-100 text-red-700 p-4 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">3.0x</div>
            <div className="text-sm">Emergency Surge</div>
          </button>
        </div>
      </div>

      {/* Fare Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Fare Comparison Matrix</h4>
          <p className="text-gray-600 mt-1">Compare fares across all ride types and vehicle types</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Type
                </th>
                {bookingTypes.map((bookingType) => (
                  <th key={bookingType.value} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {bookingType.icon} {bookingType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleTypes.map((vehicleType) => (
                <tr key={vehicleType.value} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{vehicleType.icon}</span>
                      <span className="font-medium text-gray-900">{vehicleType.label}</span>
                    </div>
                  </td>
                  {bookingTypes.map((bookingType) => {
                    const entry = fareMatrix.find(
                      e => e.booking_type === bookingType.value && e.vehicle_type === vehicleType.value
                    );
                    
                    return (
                      <td key={bookingType.value} className="px-6 py-4 whitespace-nowrap text-center">
                        {entry ? (
                          <div className="space-y-1">
                            {entry.booking_type === 'rental' ? (
                              <>
                                <div className="text-lg font-bold text-green-600">₹{entry.hourly_rate}/hr</div>
                                <div className="text-xs text-gray-500">Hourly rental</div>
                              </>
                            ) : (
                              <>
                                <div className="text-lg font-bold text-gray-900">₹{entry.base_fare}</div>
                                <div className="text-xs text-gray-500">₹{entry.per_km_rate}/km</div>
                                <div className="text-xs text-gray-500">₹{entry.per_minute_rate}/min</div>
                              </>
                            )}
                            {entry.surge_multiplier > 1 && (
                              <div className="text-xs text-red-600 font-medium">{entry.surge_multiplier}x surge</div>
                            )}
                            {!entry.is_active && (
                              <div className="text-xs text-red-500">Inactive</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">Not configured</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Fare Updates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Fare Updates</h4>
        <p className="text-gray-600 mb-4">Apply percentage changes to all active fares</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  const updates = entry.booking_type === 'rental' 
                    ? { hourly_rate: Math.round(entry.hourly_rate * 1.1) }
                    : { 
                        base_fare: Math.round(entry.base_fare * 1.1),
                        per_km_rate: Math.round(entry.per_km_rate * 1.1 * 100) / 100
                      };
                  handleUpdateEntry(entry.id, updates);
                }
              });
              alert('Applied 10% increase to all active fares!');
            }}
            disabled={saving}
            className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+10%</div>
            <div className="text-sm">Increase All Fares</div>
          </button>
          
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  const updates = entry.booking_type === 'rental' 
                    ? { hourly_rate: Math.round(entry.hourly_rate * 0.9) }
                    : { 
                        base_fare: Math.round(entry.base_fare * 0.9),
                        per_km_rate: Math.round(entry.per_km_rate * 0.9 * 100) / 100
                      };
                  handleUpdateEntry(entry.id, updates);
                }
              });
              alert('Applied 10% discount to all active fares!');
            }}
            disabled={saving}
            className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-10%</div>
            <div className="text-sm">Discount All Fares</div>
          </button>
          
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active && entry.booking_type !== 'rental') {
                  const updates = { 
                    per_km_rate: Math.round(entry.per_km_rate * 1.2 * 100) / 100
                  };
                  handleUpdateEntry(entry.id, updates);
                }
              });
              alert('Applied 20% increase to per-km rates!');
            }}
            disabled={saving}
            className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+20%</div>
            <div className="text-sm">Per-KM Rates</div>
          </button>
          
          <button
            onClick={() => {
              fareMatrix.forEach(entry => {
                if (entry.is_active) {
                  const updates = { platform_fee: 25.0 };
                  handleUpdateEntry(entry.id, updates);
                }
              });
              alert('Set platform fee to ₹25 for all active fares!');
            }}
            disabled={saving}
            className="bg-indigo-100 text-indigo-700 p-4 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">₹25</div>
            <div className="text-sm">Platform Fee</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FareMatrixManagement;