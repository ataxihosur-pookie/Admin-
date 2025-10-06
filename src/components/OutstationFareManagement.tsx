import React, { useState, useEffect } from 'react';
import { Edit, Save, X, RefreshCw, MapPin, Clock, Calculator, AlertCircle } from 'lucide-react';
import databaseService from '../services/databaseService';

interface OutstationFare {
  id: string;
  vehicle_type: string;
  base_fare: number;
  per_km_rate: number;
  driver_allowance_per_day: number;
  night_charge_percent: number;
  toll_charges_included: boolean;
  minimum_distance_km: number;
  cancellation_fee: number;
  daily_km_limit: number;
  advance_booking_discount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const OutstationFareManagement: React.FC = () => {
  const [outstationFares, setOutstationFares] = useState<OutstationFare[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OutstationFare | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const vehicleTypes = [
    { value: 'hatchback', label: 'Hatchback', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'hatchback_ac', label: 'Hatchback AC', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'sedan', label: 'Sedan', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'sedan_ac', label: 'Sedan AC', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'suv', label: 'SUV', icon: '🚙', color: 'bg-purple-100 text-purple-800' },
    { value: 'suv_ac', label: 'SUV AC', icon: '🚙', color: 'bg-purple-100 text-purple-800' }
  ];

  const popularDestinations = [
    { name: 'Bangalore', distance: 40, estimatedTime: '1.5 hours' },
    { name: 'Chennai', distance: 350, estimatedTime: '6 hours' },
    { name: 'Coimbatore', distance: 200, estimatedTime: '4 hours' },
    { name: 'Mysore', distance: 120, estimatedTime: '2.5 hours' },
    { name: 'Salem', distance: 180, estimatedTime: '3.5 hours' }
  ];

  useEffect(() => {
    fetchOutstationFares();
  }, []);

  const fetchOutstationFares = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching outstation fares from database...');
      const fares = await databaseService.fetchOutstationFares();
      
      if (fares.length === 0) {
        console.log('📝 No outstation fares found, creating default configurations...');
        await createDefaultOutstationFares();
      } else {
        setOutstationFares(fares);
        console.log(`✅ Loaded ${fares.length} outstation fare configurations from database`);
      }
    } catch (error) {
      console.error('❌ Error fetching outstation fares:', error);
      setError(`Failed to load outstation fares: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Fallback to creating default configurations
      await createDefaultOutstationFares();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultOutstationFares = async () => {
    try {
      console.log('🔧 Creating default outstation fare configurations...');
      
      // Generate fare entries for all vehicle types using ONLY database schema fields
      const defaultFares = vehicleTypes.map((vehicleType) => {
        const baseRates = getBaseRatesForVehicle(vehicleType.value);
        
        return {
          vehicle_type: vehicleType.value,
          base_fare: baseRates.base,
          per_km_rate: baseRates.perKm,
          driver_allowance_per_day: baseRates.allowance,
          daily_km_limit: rates.dailyKm,
          night_charge_percent: 20.0,
          toll_charges_included: false,
          minimum_distance_km: 50,
          cancellation_fee: 200,
          advance_booking_discount: 5.0,
          is_active: true
        };
      });
      
      // Create all entries
      const createdFares = [];
      for (const fareData of defaultFares) {
        try {
          const createdFare = await databaseService.createOutstationFare(fareData);
          createdFares.push(createdFare);
          console.log(`✅ Created outstation fare for ${fareData.vehicle_type}`);
        } catch (createError) {
          console.error(`❌ Failed to create outstation fare for ${fareData.vehicle_type}:`, createError);
        }
      }
      
      if (createdFares.length > 0) {
        setOutstationFares(createdFares);
        console.log(`✅ Initialized ${createdFares.length} outstation fare configurations`);
      } else {
        // If creation failed, use mock data
        setOutstationFares(getMockOutstationFares());
      }
    } catch (error) {
      console.error('❌ Error creating default outstation fares:', error);
      setOutstationFares(getMockOutstationFares());
    }
  };

  const getBaseRatesForVehicle = (vehicleType: string) => {
    const baseRates = {
      hatchback: { base: 500, perKm: 14, allowance: 300 },
      hatchback_ac: { base: 600, perKm: 16, allowance: 350 },
      sedan: { base: 700, perKm: 18, allowance: 400 },
      sedan_ac: { base: 800, perKm: 20, allowance: 450 },
      suv: { base: 900, perKm: 22, allowance: 500 },
      suv_ac: { base: 1000, perKm: 24, allowance: 550 }
    };
    
    return baseRates[vehicleType as keyof typeof baseRates] || baseRates.sedan;
  };

  const getMockOutstationFares = (): OutstationFare[] => {
    return vehicleTypes.map((vehicleType) => {
      const rates = getBaseRatesForVehicle(vehicleType.value);
      
      return {
        id: `mock-outstation-${vehicleType.value}`,
        vehicle_type: vehicleType.value,
        base_fare: rates.base,
        per_km_rate: rates.perKm,
        driver_allowance_per_day: rates.allowance,
        daily_km_limit: rates.dailyKm,
        night_charge_percent: 20.0,
        toll_charges_included: false,
        minimum_distance_km: 50,
        cancellation_fee: 200,
        advance_booking_discount: 5.0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<OutstationFare>) => {
    setSaving(true);
    setError('');
    
    try {
      console.log('💾 Updating outstation fare entry:', entryId, updates);
      
      // Validate that we only update fields that exist in the database
      const validFields = [
        'base_fare', 'per_km_rate', 'driver_allowance_per_day', 'night_charge_percent',
        'toll_charges_included', 'minimum_distance_km', 'cancellation_fee', 
        'advance_booking_discount', 'is_active'
      ];
      
      const filteredUpdates = Object.keys(updates)
        .filter(key => validFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key as keyof OutstationFare];
          return obj;
        }, {} as any);
      
      console.log('🔍 Filtered updates (only valid database fields):', filteredUpdates);
      
      if (entryId.startsWith('mock-outstation-')) {
        console.log('🔧 Mock ID detected, creating new database record...');
        
        // Extract vehicle type from mock ID
        const vehicleType = entryId.replace('mock-outstation-', '');
        
        // Get current entry data
        const currentEntry = outstationFares.find(f => f.id === entryId);
        if (!currentEntry) {
          throw new Error('Current entry not found');
        }
        
        // Create new record with all current data plus updates
        const newFareData = {
          vehicle_type: vehicleType,
          base_fare: currentEntry.base_fare,
          per_km_rate: currentEntry.per_km_rate,
          driver_allowance_per_day: currentEntry.driver_allowance_per_day,
          night_charge_percent: currentEntry.night_charge_percent,
          toll_charges_included: currentEntry.toll_charges_included,
          minimum_distance_km: currentEntry.minimum_distance_km,
          cancellation_fee: currentEntry.cancellation_fee,
          advance_booking_discount: currentEntry.advance_booking_discount,
          is_active: currentEntry.is_active,
          ...filteredUpdates
        };
        
        console.log('📝 Creating new outstation fare with data:', newFareData);
        const newFare = await databaseService.createOutstationFare(newFareData);
        console.log('✅ Created new outstation fare record:', newFare);
        
        // Update local state with new ID and data
        setOutstationFares(prev => prev.map(fare => 
          fare.id === entryId 
            ? { ...fare, id: newFare.id, ...filteredUpdates, updated_at: new Date().toISOString() }
            : fare
        ));
      } else {
        // Update existing record
        console.log('🔍 Updating existing database record:', entryId);
        const result = await databaseService.updateOutstationFare(entryId, filteredUpdates);
        console.log('✅ Database update successful:', result);
        
        // Update local state
        setOutstationFares(prev => prev.map(fare => 
          fare.id === entryId 
            ? { ...fare, ...filteredUpdates, updated_at: new Date().toISOString() }
            : fare
        ));
      }
      
      console.log('✅ Outstation fare entry updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating outstation fare entry:', error);
      setError(`Failed to update outstation fare: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    // Validate required fields before saving
    if (editingEntry.base_fare <= 0) {
      setError('Base fare must be greater than 0');
      return;
    }
    
    if (editingEntry.per_km_rate <= 0) {
      setError('Per KM rate must be greater than 0');
      return;
    }
    
    try {
      // Only include fields that exist in the database schema
      const updates: Partial<OutstationFare> = {
        base_fare: editingEntry.base_fare,
        per_km_rate: editingEntry.per_km_rate,
        driver_allowance_per_day: editingEntry.driver_allowance_per_day,
        night_charge_percent: editingEntry.night_charge_percent,
        toll_charges_included: editingEntry.toll_charges_included,
        minimum_distance_km: editingEntry.minimum_distance_km,
        cancellation_fee: editingEntry.cancellation_fee,
        advance_booking_discount: editingEntry.advance_booking_discount
      };

      await handleUpdateEntry(editingEntry.id, updates);
      setEditingEntry(null);
      
      // Show success message
      alert('✅ Outstation fare configuration updated successfully!');
    } catch (error) {
      console.error('❌ Error saving outstation fare entry:', error);
      setError(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getVehicleTypeInfo = (vehicleType: string) => {
    return vehicleTypes.find(vt => vt.value === vehicleType) || vehicleTypes[0];
  };

  const calculateSampleFare = (fare: OutstationFare, distance: number) => {
    const baseFare = fare.base_fare;
    const distanceFare = distance * fare.per_km_rate;
    const driverAllowance = fare.driver_allowance_per_day;
    
    return Math.round(baseFare + distanceFare + driverAllowance);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading outstation fares...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Outstation Fare Management</h3>
          <p className="text-gray-600 mt-1">Configure pricing for long-distance outstation rides</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchOutstationFares}
            disabled={loading || saving}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Database Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Vehicles</p>
              <p className="text-3xl font-bold">{outstationFares.filter(f => f.is_active).length}</p>
            </div>
            <span className="text-4xl">🚗</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Avg Base Fare</p>
              <p className="text-3xl font-bold">
                ₹{outstationFares.length > 0 ? Math.round(outstationFares.reduce((sum, f) => sum + f.base_fare, 0) / outstationFares.length) : 0}
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Per KM</p>
              <p className="text-3xl font-bold">
                ₹{outstationFares.length > 0 ? Math.round(outstationFares.reduce((sum, f) => sum + f.per_km_rate, 0) / outstationFares.length) : 0}
              </p>
            </div>
            <span className="text-4xl">📏</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Min Distance</p>
              <p className="text-3xl font-bold">
                {outstationFares[0]?.minimum_distance_km || 50} km
              </p>
            </div>
            <span className="text-4xl">📍</span>
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">Saving outstation fare changes to database...</span>
          </div>
        </div>
      )}

      {/* Outstation Fare Configuration */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">🛣️</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Outstation Trip Pricing</h4>
                <p className="text-gray-600 mt-1">
                  Configure pricing for long-distance rides to other cities (minimum 50km)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {outstationFares.filter(f => f.is_active).length} Active
            </span>
          </div>
        </div>

        {/* Vehicle Type Configurations */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outstationFares.map((fare) => {
              const vehicleInfo = getVehicleTypeInfo(fare.vehicle_type);
              const isEditing = editingEntry?.id === fare.id;
              
              return (
                <div key={fare.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Vehicle Header */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{vehicleInfo.icon}</span>
                        <div>
                          <h5 className="font-semibold text-gray-900">{vehicleInfo.label}</h5>
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${fare.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-xs text-gray-600">{fare.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {!isEditing ? (
                          <button
                            onClick={() => setEditingEntry(fare)}
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
                    {/* Base Fare and Per KM Rate */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Base Fare (₹)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingEntry.base_fare}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              base_fare: Math.max(0, parseFloat(e.target.value) || 0)
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-lg font-bold text-gray-900">₹{fare.base_fare}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Per KM (₹)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingEntry.per_km_rate}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              per_km_rate: Math.max(0, parseFloat(e.target.value) || 0)
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-lg font-bold text-gray-900">₹{fare.per_km_rate}</div>
                        )}
                      </div>
                    </div>

                    {/* Driver Allowance */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Driver Allowance Per Day (₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingEntry.driver_allowance_per_day}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            driver_allowance_per_day: Math.max(0, parseFloat(e.target.value) || 0)
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">₹{fare.driver_allowance_per_day}</div>
                      )}
                    </div>

                    {/* Daily KM Limit */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Daily KM Limit</label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editingEntry.daily_km_limit}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            daily_km_limit: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{fare.daily_km_limit} km</div>
                      )}
                    </div>

                    {/* Minimum Distance and Cancellation Fee */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Min Distance (km)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editingEntry.minimum_distance_km}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              minimum_distance_km: Math.max(0, parseInt(e.target.value) || 0)
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{fare.minimum_distance_km} km</div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Cancellation Fee (₹)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingEntry.cancellation_fee}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              cancellation_fee: Math.max(0, parseFloat(e.target.value) || 0)
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm font-medium text-red-600">₹{fare.cancellation_fee}</div>
                        )}
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-500">Toll Charges Included</label>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editingEntry.toll_charges_included}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              toll_charges_included: e.target.checked
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        ) : (
                          <span className={`text-sm font-medium ${
                            fare.toll_charges_included ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {fare.toll_charges_included ? '✅ Yes' : '❌ No'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sample Calculations */}
                    <div className="bg-blue-50 p-3 rounded-lg mt-4">
                      <h6 className="text-xs font-medium text-blue-900 mb-2 flex items-center space-x-1">
                        <Calculator className="w-3 h-3" />
                        <span>Sample Fares</span>
                      </h6>
                      <div className="space-y-2 text-xs">
                        {popularDestinations.slice(0, 2).map((destination) => {
                          const fareAmount = calculateSampleFare(fare, destination.distance);
                          
                          return (
                            <div key={destination.name} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium">{destination.name} ({destination.distance}km)</span>
                                <span className="text-blue-600 text-xs">{destination.estimatedTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Base + Distance:</span>
                                <span className="font-medium">₹{fare.base_fare + (destination.distance * fare.per_km_rate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Driver Allowance:</span>
                                <span className="font-medium">₹{fare.driver_allowance_per_day}</span>
                              </div>
                              <div className="flex justify-between border-t border-blue-200 pt-1">
                                <span className="text-blue-900 font-medium">Total:</span>
                                <span className="font-bold">₹{fareAmount}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toggle Active Status */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <button
                        onClick={() => handleUpdateEntry(fare.id, { is_active: !fare.is_active })}
                        disabled={saving}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          fare.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {fare.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(fare.updated_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Destinations Fare Calculator */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Popular Destinations Fare Calculator</h4>
          <p className="text-gray-600 mt-1">Calculate fares for common outstation destinations from Hosur</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Time
                </th>
                {vehicleTypes.slice(0, 3).map((vehicleType) => (
                  <th key={vehicleType.value} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {vehicleType.icon} {vehicleType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {popularDestinations.map((destination) => (
                <tr key={destination.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-900">{destination.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900">{destination.distance} km</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{destination.estimatedTime}</span>
                    </div>
                  </td>
                  {vehicleTypes.slice(0, 3).map((vehicleType) => {
                    const fare = outstationFares.find(f => f.vehicle_type === vehicleType.value);
                    const dayFare = fare ? calculateSampleFare(fare, destination.distance) : 0;
                    
                    return (
                      <td key={vehicleType.value} className="px-6 py-4 whitespace-nowrap text-center">
                        {fare ? (
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-gray-900">₹{dayFare}</div>
                            <div className="text-xs text-gray-500">One-way fare</div>
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

      {/* Outstation Pricing Rules */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">🛣️</span>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Outstation Pricing Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Fare Components</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Base Fare:</strong> Fixed charge for outstation booking</li>
                  <li>• <strong>Distance Charge:</strong> Per kilometer rate for the trip</li>
                  <li>• <strong>Driver Allowance:</strong> Daily allowance for driver accommodation</li>
                  <li>• <strong>Minimum Distance:</strong> 50km minimum for outstation trips</li>
                  <li>• <strong>Advance Booking:</strong> Discount for early bookings</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Calculation Formula</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Total Fare =</strong> Base Fare + (Distance × Per KM Rate) + Driver Allowance</li>
                  <li>• <strong>Toll Charges:</strong> Additional if not included in fare</li>
                  <li>• <strong>Cancellation Fee:</strong> Applied if trip is cancelled</li>
                  <li>• <strong>Advance Discount:</strong> Applied for early bookings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Fare Updates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Fare Updates</h4>
        <p className="text-gray-600 mb-4">Apply changes to all outstation fares</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              outstationFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    per_km_rate: Math.round(fare.per_km_rate * 0.9 * 100) / 100
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Applied 10% discount to all per-km rates!');
            }}
            disabled={saving}
            className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-10%</div>
            <div className="text-sm">Discount Rates</div>
          </button>
          
          <button
            onClick={() => {
              outstationFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    per_km_rate: Math.round(fare.per_km_rate * 1.1 * 100) / 100
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Applied 10% increase to all per-km rates!');
            }}
            disabled={saving}
            className="bg-orange-100 text-orange-700 p-4 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+10%</div>
            <div className="text-sm">Increase Rates</div>
          </button>
          
          <button
            onClick={() => {
              outstationFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    driver_allowance_per_day: fare.driver_allowance_per_day + 100
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Increased driver allowance by ₹100 for all vehicles!');
            }}
            disabled={saving}
            className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+₹100</div>
            <div className="text-sm">Driver Allowance</div>
          </button>
          
          <button
            onClick={() => {
              outstationFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    driver_allowance_per_day: fare.driver_allowance_per_day + 50
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Increased driver allowance by ₹50 for all vehicles!');
            }}
            disabled={saving}
            className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+₹50</div>
            <div className="text-sm">Driver Allowance</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutstationFareManagement;