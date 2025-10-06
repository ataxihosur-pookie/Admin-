import React, { useState, useEffect } from 'react';
import { Edit, Save, X, RefreshCw, Plane, MapPin } from 'lucide-react';
import databaseService from '../services/databaseService';
import { airportFareService } from '../services/airportFareService';

interface AirportFare {
  id: string;
  vehicle_type: string;
  hosur_to_airport_fare: number;
  airport_to_hosur_fare: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AirportFareManagement: React.FC = () => {
  const [airportFares, setAirportFares] = useState<AirportFare[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AirportFare | null>(null);
  const [editingDirection, setEditingDirection] = useState<'to_airport' | 'from_airport' | null>(null);
  const [saving, setSaving] = useState(false);

  const vehicleTypes = [
    { value: 'hatchback', label: 'Hatchback', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'hatchback_ac', label: 'Hatchback AC', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'sedan', label: 'Sedan', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'hatchback_ac', label: 'Hatchback AC', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'sedan', label: 'Sedan', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'sedan_ac', label: 'Sedan AC', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'suv', label: 'SUV', icon: '🚙', color: 'bg-purple-100 text-purple-800' },
    { value: 'suv_ac', label: 'SUV AC', icon: '🚙', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    fetchAirportFares();
  }, []);

  const fetchAirportFares = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching airport fares using dedicated service...');
      const fares = await airportFareService.fetchAirportFares();
      
      if (fares.length === 0) {
        console.log('📝 No airport fares found, creating default configurations...');
        await createDefaultAirportFares();
      } else {
        setAirportFares(fares);
        console.log(`✅ Loaded ${fares.length} airport fare configurations from database`);
      }
    } catch (error) {
      console.error('❌ Error fetching airport fares:', error);
      // Fallback to creating default configurations
      await createDefaultAirportFares();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAirportFares = async () => {
    try {
      console.log('🔧 Creating default airport fare configurations...');
      
      // Use the dedicated service to create all 6 vehicle types
      const createdFares = await airportFareService.createAllVehicleTypes();
      setAirportFares(createdFares);
      console.log(`✅ Created airport fares for all ${createdFares.length} vehicle types`);
    } catch (error) {
      console.error('❌ Error creating default airport fares:', error);
      // Fallback to mock data if database operations fail
      const mockFares = airportFareService.getMockAirportFares();
      setAirportFares(mockFares);
      console.log('⚠️ Using mock data for all 6 vehicle types');
    }
  };

  const getDefaultRatesForVehicle = (vehicleType: string) => {
    const baseRates = {
      hatchback: { toAirport: 1200, fromAirport: 1200 },
      hatchback_ac: { toAirport: 1400, fromAirport: 1400 },
      sedan: { toAirport: 1600, fromAirport: 1600 },
      hatchback_ac: { toAirport: 1400, fromAirport: 1400 },
      sedan: { toAirport: 1600, fromAirport: 1600 },
      sedan_ac: { toAirport: 1800, fromAirport: 1800 },
      suv: { toAirport: 2200, fromAirport: 2200 },
      suv_ac: { toAirport: 2500, fromAirport: 2500 }
    };
    
    return baseRates[vehicleType as keyof typeof baseRates] || baseRates.sedan;
  };

  const getMockAirportFares = (): AirportFare[] => {
    return vehicleTypes.map((vehicleType) => {
      const rates = getDefaultRatesForVehicle(vehicleType.value);
      
      return {
        id: `mock-airport-${vehicleType.value}`,
        vehicle_type: vehicleType.value,
        hosur_to_airport_fare: rates.toAirport,
        airport_to_hosur_fare: rates.fromAirport,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<AirportFare>) => {
    setSaving(true);
    try {
      console.log('💾 Updating airport fare entry:', entryId, updates);
      
      if (entryId.startsWith('mock-airport-')) {
        console.log('🔧 Mock ID detected, creating new database record...');
        
        const vehicleType = entryId.replace('mock-airport-', '');
        const currentEntry = airportFares.find(f => f.id === entryId);
        if (!currentEntry) {
          throw new Error('Current entry not found');
        }
        
        const newFareData = {
          vehicle_type: vehicleType,
          hosur_to_airport_fare: currentEntry.hosur_to_airport_fare,
          airport_to_hosur_fare: currentEntry.airport_to_hosur_fare,
          is_active: currentEntry.is_active,
          ...updates
        };
        
        const newFare = await airportFareService.createAirportFare(newFareData);
        
        setAirportFares(prev => prev.map(fare => 
          fare.id === entryId 
            ? { ...fare, id: newFare.id, ...updates, updated_at: new Date().toISOString() }
            : fare
        ));
      } else {
        await airportFareService.updateAirportFare(entryId, updates);
        
        setAirportFares(prev => prev.map(fare => 
          fare.id === entryId 
            ? { ...fare, ...updates, updated_at: new Date().toISOString() }
            : fare
        ));
      }
      
      console.log('✅ Airport fare entry updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating airport fare entry:', error);
      alert(`Failed to update airport fare: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    if (editingDirection === 'to_airport' && editingEntry.hosur_to_airport_fare <= 0) {
      alert('Hosur to Airport fare must be greater than 0');
      return;
    }
    
    if (editingDirection === 'from_airport' && editingEntry.airport_to_hosur_fare <= 0) {
      alert('Airport to Hosur fare must be greater than 0');
      return;
    }
    
    try {
      const updates: Partial<AirportFare> = {};
      
      if (editingDirection === 'to_airport') {
        updates.hosur_to_airport_fare = editingEntry.hosur_to_airport_fare;
      } else if (editingDirection === 'from_airport') {
        updates.airport_to_hosur_fare = editingEntry.airport_to_hosur_fare;
      }

      await handleUpdateEntry(editingEntry.id, updates);
      setEditingEntry(null);
      setEditingDirection(null);
      alert('✅ Airport fare configuration updated successfully!');
    } catch (error) {
      console.error('❌ Error saving airport fare entry:', error);
    }
  };

  const getVehicleTypeInfo = (vehicleType: string) => {
    return vehicleTypes.find(vt => vt.value === vehicleType) || vehicleTypes[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading airport fares...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Airport Fares Management</h3>
          <p className="text-gray-600 mt-1">Fixed rates for Hosur ↔ Kempegowda International Airport transfers</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchAirportFares}
            disabled={loading || saving}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={async () => {
              if (confirm('Force recreate all 6 vehicle type entries? This will reset all airport fares to default values.')) {
                setLoading(true);
                try {
                  // Use the service to recreate all entries
                  const recreatedFares = await airportFareService.recreateAllVehicleTypes();
                  setAirportFares(recreatedFares);
                  alert(`✅ Successfully recreated airport fares for all ${recreatedFares.length} vehicle types!`);
                } catch (error) {
                  console.error('❌ Error recreating airport fares:', error);
                  alert('Failed to recreate airport fares. Check console for details.');
                } finally {
                  setLoading(false);
                }
              }
            }}
            disabled={loading || saving}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>Recreate All 6</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Vehicles</p>
              <p className="text-3xl font-bold">{airportFares.filter(f => f.is_active).length}</p>
            </div>
            <span className="text-4xl">🚗</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Avg To Airport</p>
              <p className="text-3xl font-bold">
                ₹{airportFares.length > 0 ? Math.round(airportFares.reduce((sum, f) => sum + f.hosur_to_airport_fare, 0) / airportFares.length) : 0}
              </p>
            </div>
            <span className="text-4xl">✈️</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg From Airport</p>
              <p className="text-3xl font-bold">
                ₹{airportFares.length > 0 ? Math.round(airportFares.reduce((sum, f) => sum + f.airport_to_hosur_fare, 0) / airportFares.length) : 0}
              </p>
            </div>
            <span className="text-4xl">🏠</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Route Distance</p>
              <p className="text-3xl font-bold">65 km</p>
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
            <span className="text-blue-800 font-medium">Saving airport fare changes...</span>
          </div>
        </div>
      )}

      {/* Airport Fare Configuration */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Hosur to Airport Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">Hosur → Kempegowda International Airport</h4>
              <p className="text-gray-600 mt-1">Fixed rates for airport drop service (65 km via NH44)</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {airportFares.map((fare) => {
              const vehicleInfo = getVehicleTypeInfo(fare.vehicle_type);
              const isEditingToAirport = editingEntry?.id === fare.id && editingDirection === 'to_airport';
              
              return (
                <div key={`${fare.id}-to-airport`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">{vehicleInfo.icon}</span>
                    </div>
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">{vehicleInfo.label}</h5>
                    
                    {isEditingToAirport ? (
                      <div className="space-y-3">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editingEntry.hosur_to_airport_fare}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            hosur_to_airport_fare: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-full px-4 py-3 text-2xl border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-bold"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingEntry(null)}
                            disabled={saving}
                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-4xl font-bold text-blue-600">₹{fare.hosur_to_airport_fare}</div>
                        <button
                          onClick={() => {
                            setEditingEntry(fare);
                            setEditingDirection('to_airport');
                          }}
                          disabled={saving}
                          className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Rate</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${fare.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs text-gray-600">{fare.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Airport to Hosur Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">Kempegowda International Airport → Hosur</h4>
              <p className="text-gray-600 mt-1">Fixed rates for airport pickup service (65 km via NH44)</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {airportFares.map((fare) => {
              const vehicleInfo = getVehicleTypeInfo(fare.vehicle_type);
              const isEditingFromAirport = editingEntry?.id === fare.id && editingDirection === 'from_airport';
              
              return (
                <div key={`${fare.id}-from-airport`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">{vehicleInfo.icon}</span>
                    </div>
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">{vehicleInfo.label}</h5>
                    
                    {isEditingFromAirport ? (
                      <div className="space-y-3">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editingEntry.airport_to_hosur_fare}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            airport_to_hosur_fare: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-full px-4 py-3 text-2xl border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center font-bold"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingEntry(null)}
                            disabled={saving}
                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-4xl font-bold text-green-600">₹{fare.airport_to_hosur_fare}</div>
                        <button
                          onClick={() => {
                            setEditingEntry(fare);
                            setEditingDirection('from_airport');
                          }}
                          disabled={saving}
                          className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Rate</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${fare.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs text-gray-600">{fare.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Route Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Airport Transfer Rates Comparison</h4>
          <p className="text-gray-600 mt-1">Compare fixed rates for both directions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>Hosur → Airport</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <Plane className="w-3 h-3" />
                    <span>Airport → Hosur</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {airportFares.map((fare) => {
                const vehicleInfo = getVehicleTypeInfo(fare.vehicle_type);
                
                return (
                  <tr key={fare.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{vehicleInfo.icon}</span>
                        <span className="font-medium text-gray-900">{vehicleInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold text-blue-600">₹{fare.hosur_to_airport_fare}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold text-green-600">₹{fare.airport_to_hosur_fare}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        fare.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fare.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Fare Updates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Fare Updates</h4>
        <p className="text-gray-600 mb-4">Apply changes to all airport transfer fares</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              airportFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    hosur_to_airport_fare: Math.round(fare.hosur_to_airport_fare * 1.1),
                    airport_to_hosur_fare: Math.round(fare.airport_to_hosur_fare * 1.1)
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Increased all airport fares by 10%!');
            }}
            disabled={saving}
            className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+10%</div>
            <div className="text-sm">Increase All</div>
          </button>
          
          <button
            onClick={() => {
              airportFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    hosur_to_airport_fare: Math.round(fare.hosur_to_airport_fare * 0.9),
                    airport_to_hosur_fare: Math.round(fare.airport_to_hosur_fare * 0.9)
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Applied 10% discount to all airport fares!');
            }}
            disabled={saving}
            className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-10%</div>
            <div className="text-sm">Discount All</div>
          </button>
          
          <button
            onClick={() => {
              airportFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    hosur_to_airport_fare: fare.hosur_to_airport_fare + 100,
                    airport_to_hosur_fare: fare.airport_to_hosur_fare + 100
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Added ₹100 to all airport fares!');
            }}
            disabled={saving}
            className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+₹100</div>
            <div className="text-sm">Add to All</div>
          </button>
          
          <button
            onClick={() => {
              airportFares.forEach(fare => {
                if (fare.is_active) {
                  const updates = {
                    hosur_to_airport_fare: Math.max(500, fare.hosur_to_airport_fare - 100),
                    airport_to_hosur_fare: Math.max(500, fare.airport_to_hosur_fare - 100)
                  };
                  handleUpdateEntry(fare.id, updates);
                }
              });
              alert('Reduced all airport fares by ₹100 (minimum ₹500)!');
            }}
            disabled={saving}
            className="bg-orange-100 text-orange-700 p-4 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-₹100</div>
            <div className="text-sm">Reduce All</div>
          </button>
        </div>
      </div>

      {/* Airport Transfer Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">✈️</span>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Airport Transfer Service</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Route Details</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Distance:</strong> 65 kilometers via NH44 Highway</li>
                  <li>• <strong>Duration:</strong> Approximately 1.5 hours</li>
                  <li>• <strong>Route:</strong> Hosur → Electronic City → Airport</li>
                  <li>• <strong>Service:</strong> 24/7 availability</li>
                  <li>• <strong>Booking:</strong> Advance booking recommended</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Fixed Rate Benefits</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>No Surge Pricing:</strong> Same rate regardless of time</li>
                  <li>• <strong>No Traffic Charges:</strong> Fixed rate includes traffic delays</li>
                  <li>• <strong>Transparent:</strong> Customer knows exact fare upfront</li>
                  <li>• <strong>Reliable:</strong> No meter running or distance calculations</li>
                  <li>• <strong>Premium Service:</strong> Dedicated airport transfer experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirportFareManagement;
