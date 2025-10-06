import React, { useState, useEffect } from 'react';
import { Edit, Save, X, RefreshCw, Clock, Calculator, AlertCircle, Plus } from 'lucide-react';
import databaseService from '../services/databaseService';

interface RentalPackage {
  id: string;
  name: string;
  duration_hours: number;
  km_included: number;
  base_fare: number;
  extra_km_rate: number;
  extra_minute_rate: number;
  description?: string;
  is_popular: boolean;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VehicleRentalConfig {
  vehicle_type: string;
  packages: RentalPackage[];
  extra_km_rate: number;
  extra_minute_rate: number;
}

const RentalFareManagement: React.FC = () => {
  const [vehicleConfigs, setVehicleConfigs] = useState<VehicleRentalConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<RentalPackage | null>(null);
  const [editingVehicleType, setEditingVehicleType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const vehicleTypes = [
    { value: 'hatchback', label: 'Hatchback', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'hatchback_ac', label: 'Hatchback AC', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'sedan', label: 'Sedan', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'sedan_ac', label: 'Sedan AC', icon: '🚕', color: 'bg-green-100 text-green-800' },
    { value: 'suv', label: 'SUV', icon: '🚙', color: 'bg-purple-100 text-purple-800' },
    { value: 'suv_ac', label: 'SUV AC', icon: '🚙', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    fetchRentalFaresFromDatabase();
  }, []);

  const fetchRentalFaresFromDatabase = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching rental fares from rental_fares table...');
      
      // Check if table exists first
      const tableExists = await databaseService.checkRentalFaresTableExists();
      
      if (!tableExists) {
        console.log('⚠️ rental_fares table does not exist, using mock data');
        createMockConfigurations();
        return;
      }
      
      // Fetch rental fares from rental_fares table
      const rentalFares = await databaseService.fetchRentalFaresFromTable();
      
      if (rentalFares.length === 0) {
        console.log('📝 No rental fares found in table, using mock data');
        createMockConfigurations();
      } else {
        groupFaresByVehicleType(rentalFares);
      }
      
      console.log(`✅ Loaded rental fares from rental_fares table`);
    } catch (error) {
      console.error('❌ Error fetching rental fares from table:', error);
      // Fallback to mock data structure
      createMockConfigurations();
    } finally {
      setLoading(false);
    }
  };

  const groupFaresByVehicleType = (rentalFares: any[]) => {
    const configs: VehicleRentalConfig[] = vehicleTypes.map((vehicleType) => {
      // Get packages for this vehicle type from database
      const vehiclePackages = rentalFares.filter(fare => fare.vehicle_type === vehicleType.value);
      
      // Transform database records to package format
      const packages = vehiclePackages.map(fare => ({
        id: fare.id || `${vehicleType.value}-${fare.duration_hours}h-${fare.km_included}km`,
        name: fare.package_name || `${fare.duration_hours} Hour${fare.duration_hours > 1 ? 's' : ''}`,
        duration_hours: fare.duration_hours,
        km_included: fare.km_included,
        base_fare: fare.base_fare,
        extra_km_rate: fare.extra_km_rate,
        extra_minute_rate: fare.extra_minute_rate,
        is_popular: fare.is_popular || false,
        discount_percent: fare.discount_percent || 0,
        is_active: fare.is_active !== false,
        created_at: fare.created_at || new Date().toISOString(),
        updated_at: fare.updated_at || new Date().toISOString()
      }));
      
      // Calculate average extra rates for this vehicle type
      const avgExtraKmRate = packages.length > 0 
        ? packages.reduce((sum, pkg) => sum + pkg.extra_km_rate, 0) / packages.length
        : 17;
      const avgExtraMinuteRate = packages.length > 0 
        ? packages.reduce((sum, pkg) => sum + pkg.extra_minute_rate, 0) / packages.length
        : 2;
      
      return {
        vehicle_type: vehicleType.value,
        extra_km_rate: avgExtraKmRate,
        extra_minute_rate: avgExtraMinuteRate,
        packages: packages
      };
    });
    
    setVehicleConfigs(configs);
  };

  const createMockConfigurations = () => {
    // Fallback to original mock data structure
    const configs: VehicleRentalConfig[] = vehicleTypes.map((vehicleType) => {
      const baseRates = getBaseRatesForVehicle(vehicleType.value);
      
      return {
        vehicle_type: vehicleType.value,
        extra_km_rate: baseRates.extraKmRate,
        extra_minute_rate: baseRates.extraMinuteRate,
        packages: [
          { id: `${vehicleType.value}-1h`, name: '1 Hour', duration_hours: 1, km_included: 10, base_fare: baseRates.packages['1h'], extra_km_rate: baseRates.extraKmRate, extra_minute_rate: baseRates.extraMinuteRate, is_popular: false, discount_percent: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: `${vehicleType.value}-4h`, name: '4 Hours', duration_hours: 4, km_included: 40, base_fare: baseRates.packages['4h'], extra_km_rate: baseRates.extraKmRate, extra_minute_rate: baseRates.extraMinuteRate, is_popular: true, discount_percent: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: `${vehicleType.value}-8h`, name: '8 Hours', duration_hours: 8, km_included: 80, base_fare: baseRates.packages['8h'], extra_km_rate: baseRates.extraKmRate2, extra_minute_rate: baseRates.extraMinuteRate2, is_popular: false, discount_percent: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]
      };
    });
    
    setVehicleConfigs(configs);
  };

  const getBaseRatesForVehicle = (vehicleType: string) => {
    const baseRates = {
      hatchback: {
        packages: {
          '1h': 325, '1h-15km': 375, '2h': 525, '2h-25km': 575, '3h': 725, '4h': 925,
          '5h': 1125, '6h': 1325, '7h': 1525, '8h': 1725, '9h': 1900, '10h': 2075,
          '11h': 2175, '11h-110km': 2275, '12h-100km': 2275, '12h-120km': 2400
        },
        extraKmRate: 17, extraMinuteRate: 2, extraKmRate2: 11, extraMinuteRate2: 1.5, extraKmRate3: 10, extraMinuteRate3: 1.5
      },
      hatchback_ac: {
        packages: {
          '1h': 375, '1h-15km': 425, '2h': 575, '2h-25km': 625, '3h': 775, '4h': 975,
          '5h': 1175, '6h': 1375, '7h': 1575, '8h': 1775, '9h': 1950, '10h': 2125,
          '11h': 2225, '11h-110km': 2325, '12h-100km': 2325, '12h-120km': 2450
        },
        extraKmRate: 18, extraMinuteRate: 2.2, extraKmRate2: 12, extraMinuteRate2: 1.6, extraKmRate3: 11, extraMinuteRate3: 1.6
      },
      sedan: {
        packages: {
          '1h': 425, '1h-15km': 475, '2h': 625, '2h-25km': 675, '3h': 825, '4h': 1025,
          '5h': 1225, '6h': 1425, '7h': 1625, '8h': 1825, '9h': 2000, '10h': 2175,
          '11h': 2275, '11h-110km': 2375, '12h-100km': 2375, '12h-120km': 2500
        },
        extraKmRate: 19, extraMinuteRate: 2.4, extraKmRate2: 13, extraMinuteRate2: 1.7, extraKmRate3: 12, extraMinuteRate3: 1.7
      },
      sedan_ac: {
        packages: {
          '1h': 475, '1h-15km': 525, '2h': 675, '2h-25km': 725, '3h': 875, '4h': 1075,
          '5h': 1275, '6h': 1475, '7h': 1675, '8h': 1875, '9h': 2050, '10h': 2225,
          '11h': 2325, '11h-110km': 2425, '12h-100km': 2425, '12h-120km': 2550
        },
        extraKmRate: 20, extraMinuteRate: 2.6, extraKmRate2: 14, extraMinuteRate2: 1.8, extraKmRate3: 13, extraMinuteRate3: 1.8
      },
      suv: {
        packages: {
          '1h': 525, '1h-15km': 575, '2h': 725, '2h-25km': 775, '3h': 925, '4h': 1125,
          '5h': 1325, '6h': 1525, '7h': 1725, '8h': 1925, '9h': 2100, '10h': 2275,
          '11h': 2375, '11h-110km': 2475, '12h-100km': 2475, '12h-120km': 2600
        },
        extraKmRate: 21, extraMinuteRate: 2.8, extraKmRate2: 15, extraMinuteRate2: 1.9, extraKmRate3: 14, extraMinuteRate3: 1.9
      },
      suv_ac: {
        packages: {
          '1h': 575, '1h-15km': 625, '2h': 775, '2h-25km': 825, '3h': 975, '4h': 1175,
          '5h': 1375, '6h': 1575, '7h': 1775, '8h': 1975, '9h': 2150, '10h': 2325,
          '11h': 2425, '11h-110km': 2525, '12h-100km': 2525, '12h-120km': 2650
        },
        extraKmRate: 22, extraMinuteRate: 3.0, extraKmRate2: 16, extraMinuteRate2: 2.0, extraKmRate3: 15, extraMinuteRate3: 2.0
      }
    };
    
    return baseRates[vehicleType as keyof typeof baseRates];
  };

  const handleUpdatePackage = async (packageId: string, vehicleType: string, updates: Partial<RentalPackage>) => {
    setSaving(true);
    try {
      console.log('💾 Updating rental package:', packageId, updates);
      
      // Update in database first
      if (packageId.startsWith('mock-') || !packageId.includes('-')) {
        // This is a mock ID or invalid ID, create new record
        const newPackage = await databaseService.createRentalFareInTable({
          vehicle_type: vehicleType,
          package_name: updates.name || `${updates.duration_hours || 4} Hours`,
          duration_hours: updates.duration_hours || 4,
          km_included: updates.km_included || 40,
          base_fare: updates.base_fare || 925,
          extra_km_rate: updates.extra_km_rate || 17,
          extra_minute_rate: updates.extra_minute_rate || 2,
          is_popular: updates.is_popular || false,
          discount_percent: updates.discount_percent || 0
        });
        
        // Update the package ID in local state
        setVehicleConfigs(prev => prev.map(config => 
          config.vehicle_type === vehicleType 
            ? {
                ...config,
                packages: config.packages.map(pkg => 
                  pkg.id === packageId 
                    ? { ...pkg, id: newPackage.id, ...updates, updated_at: new Date().toISOString() }
                    : pkg
                )
              }
            : config
        ));
      } else {
        // Update existing record
        await databaseService.updateRentalFareInTable(packageId, updates);
        
        // Update local state
        setVehicleConfigs(prev => prev.map(config => 
          config.vehicle_type === vehicleType 
            ? {
                ...config,
                packages: config.packages.map(pkg => 
                  pkg.id === packageId 
                    ? { ...pkg, ...updates, updated_at: new Date().toISOString() }
                    : pkg
                )
              }
            : config
        ));
      }
      
      console.log('✅ Rental package updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating rental package:', error);
      alert(`Failed to update rental package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePackage = async (vehicleType: string, packageData: Partial<RentalPackage>) => {
    setSaving(true);
    try {
      console.log('💾 Creating new rental package:', vehicleType, packageData);
      
      // Create in database
      const newPackage = await databaseService.createRentalFareInTable({
        vehicle_type: vehicleType,
        package_name: packageData.name || `${packageData.duration_hours} Hours`,
        duration_hours: packageData.duration_hours,
        km_included: packageData.km_included,
        base_fare: packageData.base_fare,
        extra_km_rate: packageData.extra_km_rate,
        extra_minute_rate: packageData.extra_minute_rate,
        is_popular: packageData.is_popular || false,
        discount_percent: packageData.discount_percent || 0,
        is_active: true
      });
      
      // Update local state
      setVehicleConfigs(prev => prev.map(config => 
        config.vehicle_type === vehicleType 
          ? {
              ...config,
              packages: [...config.packages, {
                id: newPackage.id,
                name: newPackage.package_name,
                duration_hours: newPackage.duration_hours,
                km_included: newPackage.km_included,
                base_fare: newPackage.base_fare,
                extra_km_rate: newPackage.extra_km_rate,
                extra_minute_rate: newPackage.extra_minute_rate,
                is_popular: newPackage.is_popular,
                discount_percent: newPackage.discount_percent,
                is_active: newPackage.is_active,
                created_at: newPackage.created_at,
                updated_at: newPackage.updated_at
              }]
            }
          : config
      ));
      
      console.log('✅ Rental package created successfully');
      
    } catch (error) {
      console.error('❌ Error creating rental package:', error);
      alert(`Failed to create rental package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (packageId: string, vehicleType: string) => {
    if (!confirm('Are you sure you want to delete this rental package? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      console.log('🗑️ Deleting rental package:', packageId);
      
      // Delete from database
      if (!packageId.startsWith('mock-') && packageId.includes('-')) {
        await databaseService.deleteRentalFareFromTable(packageId);
      }
      
      // Update local state
      setVehicleConfigs(prev => prev.map(config => 
        config.vehicle_type === vehicleType 
          ? {
              ...config,
              packages: config.packages.filter(pkg => pkg.id !== packageId)
            }
          : config
      ));
      
      console.log('✅ Rental package deleted successfully');
      alert('Rental package deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting rental package:', error);
      alert(`Failed to delete rental package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVehicleRates = async (vehicleType: string, extraKmRate: number, extraMinuteRate: number) => {
    setSaving(true);
    try {
      console.log('💾 Updating vehicle extra rates:', vehicleType, { extraKmRate, extraMinuteRate });
      
      // Update local state
      setVehicleConfigs(prev => prev.map(config => 
        config.vehicle_type === vehicleType 
          ? { ...config, extra_km_rate: extraKmRate, extra_minute_rate: extraMinuteRate }
          : config
      ));
      
      console.log('✅ Vehicle extra rates updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating vehicle rates:', error);
      alert(`Failed to update vehicle rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPackage || !editingVehicleType) return;
    
    try {
      const updates: Partial<RentalPackage> = {
        base_fare: editingPackage.base_fare,
        km_included: editingPackage.km_included,
        extra_km_rate: editingPackage.extra_km_rate,
        extra_minute_rate: editingPackage.extra_minute_rate
      };

      await handleUpdatePackage(editingPackage.id, editingVehicleType, updates);
      setEditingPackage(null);
      setEditingVehicleType('');
      alert('Rental package updated successfully!');
    } catch (error) {
      console.error('Error saving rental package:', error);
    }
  };

  const getVehicleTypeInfo = (vehicleType: string) => {
    return vehicleTypes.find(vt => vt.value === vehicleType) || vehicleTypes[0];
  };

  const getExtraRateDisplay = (duration: number) => {
    if (duration <= 2) return { kmRate: 17, minRate: 2 };
    if (duration <= 5) return { kmRate: 11, minRate: 1.5 };
    return { kmRate: 10, minRate: 1.5 };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading rental configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Rental Packages Management</h3>
          <p className="text-gray-600 mt-1">Configure hourly rental packages with included kilometers and extra charges</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchRentalFaresFromDatabase}
            disabled={loading || saving}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Vehicle Types</p>
              <p className="text-3xl font-bold">{vehicleConfigs.length}</p>
            </div>
            <span className="text-4xl">🚗</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Packages</p>
              <p className="text-3xl font-bold">
                {vehicleConfigs.reduce((sum, config) => sum + config.packages.length, 0)}
              </p>
            </div>
            <span className="text-4xl">📦</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Popular Packages</p>
              <p className="text-3xl font-bold">
                {vehicleConfigs.reduce((sum, config) => sum + config.packages.filter(p => p.is_popular).length, 0)}
              </p>
            </div>
            <span className="text-4xl">⭐</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Base Fare</p>
              <p className="text-3xl font-bold">
                ₹{vehicleConfigs.length > 0 
                  ? Math.round(vehicleConfigs.reduce((sum, config) => 
                      sum + config.packages.reduce((pSum, pkg) => pSum + pkg.base_fare, 0) / config.packages.length, 0
                    ) / vehicleConfigs.length)
                  : 0}
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">Saving changes...</span>
          </div>
        </div>
      )}

      {/* Vehicle Type Configurations */}
      <div className="space-y-8">
        {vehicleConfigs.map((config) => {
          const vehicleInfo = getVehicleTypeInfo(config.vehicle_type);
          
          return (
            <div key={config.vehicle_type} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Vehicle Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{vehicleInfo.icon}</span>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{vehicleInfo.label}</h4>
                      <p className="text-gray-600 mt-1">Mini Rental Packages</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${vehicleInfo.color}`}>
                    {config.packages.filter(p => p.is_active).length} Active Packages
                  </span>
                </div>
              </div>

              {/* Packages Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hour Slot
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Free KMs
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Base Fare
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Extra Per KM & Extra Min
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {config.packages.map((pkg) => {
                      const isEditing = editingPackage?.id === pkg.id;
                      const extraRates = getExtraRateDisplay(pkg.duration_hours);
                      
                      return (
                        <tr key={pkg.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {pkg.duration_hours} Hour{pkg.duration_hours > 1 ? 's' : ''}
                              </span>
                              {pkg.is_popular && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingPackage.km_included}
                                onChange={(e) => setEditingPackage({
                                  ...editingPackage,
                                  km_included: parseInt(e.target.value) || 0
                                })}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{pkg.km_included}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingPackage.base_fare}
                                onChange={(e) => setEditingPackage({
                                  ...editingPackage,
                                  base_fare: parseFloat(e.target.value) || 0
                                })}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                              />
                            ) : (
                              <span className="text-lg font-bold text-green-600">₹{pkg.base_fare}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-xs text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editingPackage.extra_km_rate}
                                    onChange={(e) => setEditingPackage({
                                      ...editingPackage,
                                      extra_km_rate: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                                  />
                                  <span className="text-xs text-gray-500">/km</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-xs text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editingPackage.extra_minute_rate}
                                    onChange={(e) => setEditingPackage({
                                      ...editingPackage,
                                      extra_minute_rate: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                                  />
                                  <span className="text-xs text-gray-500">/min</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm">
                                <div className="text-blue-600 font-medium">₹{pkg.extra_km_rate}/km</div>
                                <div className="text-purple-600 font-medium">₹{pkg.extra_minute_rate}/min</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-1">
                              {!isEditing ? (
                                <button
                                  onClick={() => {
                                    setEditingPackage(pkg);
                                    setEditingVehicleType(config.vehicle_type);
                                  }}
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
                                    onClick={() => {
                                      setEditingPackage(null);
                                      setEditingVehicleType('');
                                    }}
                                    disabled={saving}
                                    className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vehicle Extra Rates Footer */}
              <div className="bg-blue-50 p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Default Extra Charges for {vehicleInfo.label}:</span>
                    <span className="ml-2">₹{config.extra_km_rate}/km & ₹{config.extra_minute_rate}/min</span>
                  </div>
                  <div className="text-xs text-blue-600">
                    Note: Extra charges apply when exceeding included KMs or time
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rental Pricing Rules */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">⏰</span>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Rental Package Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Package Structure</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Base Fare:</strong> Fixed price for the package duration</li>
                  <li>• <strong>Free KMs:</strong> Kilometers included in the base fare</li>
                  <li>• <strong>Extra KM Rate:</strong> Charge for exceeding included kilometers</li>
                  <li>• <strong>Extra Minute Rate:</strong> Charge for exceeding package duration</li>
                  <li>• <strong>Popular Packages:</strong> Highlighted in customer app</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Rate Tiers</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>1-2 Hours:</strong> ₹17/km & ₹2/min extra charges</li>
                  <li>• <strong>3-5 Hours:</strong> ₹11/km & ₹1.5/min extra charges</li>
                  <li>• <strong>6+ Hours:</strong> ₹10/km & ₹1.5/min extra charges</li>
                  <li>• <strong>Minimum Booking:</strong> 1 hour for all vehicle types</li>
                  <li>• <strong>Maximum Booking:</strong> 12 hours per package</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Package Updates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Package Updates</h4>
        <p className="text-gray-600 mb-4">Apply changes to all rental packages</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              vehicleConfigs.forEach(config => {
                config.packages.forEach(pkg => {
                  if (pkg.is_active) {
                    const updates = {
                      base_fare: Math.round(pkg.base_fare * 1.1)
                    };
                    handleUpdatePackage(pkg.id, config.vehicle_type, updates);
                  }
                });
              });
              alert('Increased all package fares by 10%!');
            }}
            disabled={saving}
            className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+10%</div>
            <div className="text-sm">Increase Fares</div>
          </button>
          
          <button
            onClick={() => {
              vehicleConfigs.forEach(config => {
                config.packages.forEach(pkg => {
                  if (pkg.is_active) {
                    const updates = {
                      base_fare: Math.round(pkg.base_fare * 0.9)
                    };
                    handleUpdatePackage(pkg.id, config.vehicle_type, updates);
                  }
                });
              });
              alert('Applied 10% discount to all package fares!');
            }}
            disabled={saving}
            className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-10%</div>
            <div className="text-sm">Discount Fares</div>
          </button>
          
          <button
            onClick={() => {
              vehicleConfigs.forEach(config => {
                config.packages.forEach(pkg => {
                  if (pkg.is_active && pkg.duration_hours >= 4) {
                    const updates = {
                      km_included: pkg.km_included + 10
                    };
                    handleUpdatePackage(pkg.id, config.vehicle_type, updates);
                  }
                });
              });
              alert('Added 10 free KMs to packages 4+ hours!');
            }}
            disabled={saving}
            className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+10 KM</div>
            <div className="text-sm">Long Packages</div>
          </button>
          
          <button
            onClick={() => {
              vehicleConfigs.forEach(config => {
                config.packages.forEach(pkg => {
                  if (pkg.is_active) {
                    const updates = {
                      extra_km_rate: Math.max(pkg.extra_km_rate - 1, 5)
                    };
                    handleUpdatePackage(pkg.id, config.vehicle_type, updates);
                  }
                });
              });
              alert('Reduced extra KM rates by ₹1 for all packages!');
            }}
            disabled={saving}
            className="bg-orange-100 text-orange-700 p-4 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-₹1</div>
            <div className="text-sm">Extra KM Rate</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalFareManagement;