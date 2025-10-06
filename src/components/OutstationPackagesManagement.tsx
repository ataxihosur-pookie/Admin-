import React, { useState, useEffect } from 'react';
import { CreditCard as Edit, Save, X, RefreshCw, MapPin, Clock, Calculator, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import databaseService from '../services/databaseService';

interface OutstationPackage {
  id: string;
  vehicle_type: string;
  slab_20km: number;
  slab_40km: number;
  slab_60km: number;
  slab_80km: number;
  slab_100km: number;
  slab_120km: number;
  slab_140km: number;
  extra_km_rate: number;
  driver_allowance_per_day: number;
  night_charge_percent: number;
  toll_charges_included: boolean;
  cancellation_fee: number;
  advance_booking_discount: number;
  use_slab_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const OutstationPackagesManagement: React.FC = () => {
  const [packages, setPackages] = useState<OutstationPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OutstationPackage | null>(null);
  const [editingSlab, setEditingSlab] = useState<string>('');
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

  const distanceSlabs = [
    { key: 'slab_10km', label: '10km', distance: 10 },
    { key: 'slab_20km', label: '20km', distance: 20 },
    { key: 'slab_30km', label: '30km', distance: 30 },
    { key: 'slab_40km', label: '40km', distance: 40 },
    { key: 'slab_50km', label: '50km', distance: 50 },
    { key: 'slab_60km', label: '60km', distance: 60 },
    { key: 'slab_70km', label: '70km', distance: 70 },
    { key: 'slab_80km', label: '80km', distance: 80 },
    { key: 'slab_90km', label: '90km', distance: 90 },
    { key: 'slab_100km', label: '100km', distance: 100 },
    { key: 'slab_110km', label: '110km', distance: 110 },
    { key: 'slab_120km', label: '120km', distance: 120 },
    { key: 'slab_130km', label: '130km', distance: 130 },
    { key: 'slab_140km', label: '140km', distance: 140 },
    { key: 'slab_150km', label: '150km', distance: 150 }
  ];

  const popularDestinations = [
    { name: 'Bangalore', distance: 40, estimatedTime: '1.5 hours' },
    { name: 'Chennai', distance: 350, estimatedTime: '6 hours' },
    { name: 'Coimbatore', distance: 200, estimatedTime: '4 hours' },
    { name: 'Mysore', distance: 120, estimatedTime: '2.5 hours' },
    { name: 'Salem', distance: 180, estimatedTime: '3.5 hours' }
  ];

  useEffect(() => {
    fetchOutstationPackages();
  }, []);

  const fetchOutstationPackages = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching outstation packages from database...');
      const packagesData = await databaseService.fetchOutstationPackages();
      
      if (packagesData.length === 0) {
        console.log('📝 No outstation packages found, creating default configurations...');
        await createDefaultPackages();
      } else {
        setPackages(packagesData);
        console.log(`✅ Loaded ${packagesData.length} outstation package configurations`);
      }
    } catch (error) {
      console.error('❌ Error fetching outstation packages:', error);
      setError(`Failed to load outstation packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Create default packages as fallback
      await createDefaultPackages();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPackages = async () => {
    try {
      console.log('🔧 Creating default outstation package configurations...');
      
      const defaultPackages = vehicleTypes.map((vehicleType) => {
        const baseRates = getBaseSlabRatesForVehicle(vehicleType.value);
        
        return {
          vehicle_type: vehicleType.value,
          slab_20km: baseRates.slab_20km,
          slab_40km: baseRates.slab_40km,
          slab_60km: baseRates.slab_60km,
          slab_80km: baseRates.slab_80km,
          slab_100km: baseRates.slab_100km,
          slab_120km: baseRates.slab_120km,
          slab_140km: baseRates.slab_140km,
          extra_km_rate: baseRates.extra_km_rate,
          driver_allowance_per_day: baseRates.driver_allowance,
          night_charge_percent: 20.0,
          toll_charges_included: false,
          cancellation_fee: baseRates.cancellation_fee,
          advance_booking_discount: 5.0,
          use_slab_system: true,
          is_active: true
        };
      });
      
      // Create all packages
      const createdPackages = [];
      for (const packageData of defaultPackages) {
        try {
          const createdPackage = await databaseService.createOutstationPackage(packageData);
          createdPackages.push(createdPackage);
          console.log(`✅ Created outstation package for ${packageData.vehicle_type}`);
        } catch (createError) {
          console.error(`❌ Failed to create package for ${packageData.vehicle_type}:`, createError);
        }
      }
      
      if (createdPackages.length > 0) {
        setPackages(createdPackages);
        console.log(`✅ Initialized ${createdPackages.length} outstation package configurations`);
      } else {
        // If creation failed, use mock data
        setPackages(getMockPackages());
      }
    } catch (error) {
      console.error('❌ Error creating default packages:', error);
      setPackages(getMockPackages());
    }
  };

  const getBaseSlabRatesForVehicle = (vehicleType: string) => {
    const baseRates = {
      hatchback: {
        slab_20km: 700, slab_40km: 1200, slab_60km: 1650, slab_80km: 2100,
        slab_100km: 2500, slab_120km: 2900, slab_140km: 3250,
        extra_km_rate: 16, driver_allowance: 350, cancellation_fee: 250
      },
      hatchback_ac: {
        slab_20km: 800, slab_40km: 1350, slab_60km: 1850, slab_80km: 2350,
        slab_100km: 2800, slab_120km: 3250, slab_140km: 3650,
        extra_km_rate: 17, driver_allowance: 375, cancellation_fee: 275
      },
      sedan: {
        slab_20km: 900, slab_40km: 1500, slab_60km: 2050, slab_80km: 2600,
        slab_100km: 3100, slab_120km: 3600, slab_140km: 4050,
        extra_km_rate: 18, driver_allowance: 400, cancellation_fee: 300
      },
      sedan_ac: {
        slab_20km: 1000, slab_40km: 1650, slab_60km: 2250, slab_80km: 2850,
        slab_100km: 3400, slab_120km: 3950, slab_140km: 4450,
        extra_km_rate: 19, driver_allowance: 425, cancellation_fee: 325
      },
      suv: {
        slab_20km: 1100, slab_40km: 1800, slab_60km: 2450, slab_80km: 3100,
        slab_100km: 3700, slab_120km: 4300, slab_140km: 4850,
        extra_km_rate: 20, driver_allowance: 450, cancellation_fee: 350
      },
      suv_ac: {
        slab_20km: 1200, slab_40km: 1950, slab_60km: 2650, slab_80km: 3350,
        slab_100km: 4000, slab_120km: 4650, slab_140km: 5250,
        extra_km_rate: 21, driver_allowance: 500, cancellation_fee: 375
      }
    };
    
    return baseRates[vehicleType as keyof typeof baseRates] || baseRates.sedan;
  };

  const getMockPackages = (): OutstationPackage[] => {
    return vehicleTypes.map((vehicleType) => {
      const rates = getBaseSlabRatesForVehicle(vehicleType.value);
      
      return {
        id: `mock-package-${vehicleType.value}`,
        vehicle_type: vehicleType.value,
        slab_20km: rates.slab_20km,
        slab_40km: rates.slab_40km,
        slab_60km: rates.slab_60km,
        slab_80km: rates.slab_80km,
        slab_100km: rates.slab_100km,
        slab_120km: rates.slab_120km,
        slab_140km: rates.slab_140km,
        extra_km_rate: rates.extra_km_rate,
        driver_allowance_per_day: rates.driver_allowance,
        night_charge_percent: 20.0,
        toll_charges_included: false,
        cancellation_fee: rates.cancellation_fee,
        advance_booking_discount: 5.0,
        use_slab_system: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleUpdatePackage = async (packageId: string, updates: Partial<OutstationPackage>) => {
    setSaving(true);
    setError('');
    
    try {
      console.log('💾 Updating outstation package:', packageId, updates);
      
      if (packageId.startsWith('mock-package-')) {
        console.log('🔧 Mock ID detected, creating new database record...');
        
        const vehicleType = packageId.replace('mock-package-', '');
        const currentPackage = packages.find(p => p.id === packageId);
        if (!currentPackage) {
          throw new Error('Current package not found');
        }
        
        const newPackageData = {
          vehicle_type: vehicleType,
          slab_20km: currentPackage.slab_20km,
          slab_40km: currentPackage.slab_40km,
          slab_60km: currentPackage.slab_60km,
          slab_80km: currentPackage.slab_80km,
          slab_100km: currentPackage.slab_100km,
          slab_120km: currentPackage.slab_120km,
          slab_140km: currentPackage.slab_140km,
          extra_km_rate: currentPackage.extra_km_rate,
          driver_allowance_per_day: currentPackage.driver_allowance_per_day,
          night_charge_percent: currentPackage.night_charge_percent,
          toll_charges_included: currentPackage.toll_charges_included,
          cancellation_fee: currentPackage.cancellation_fee,
          advance_booking_discount: currentPackage.advance_booking_discount,
          use_slab_system: currentPackage.use_slab_system,
          is_active: currentPackage.is_active,
          ...updates
        };
        
        const newPackage = await databaseService.createOutstationPackage(newPackageData);
        
        setPackages(prev => prev.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, id: newPackage.id, ...updates, updated_at: new Date().toISOString() }
            : pkg
        ));
      } else {
        await databaseService.updateOutstationPackage(packageId, updates);
        
        setPackages(prev => prev.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, ...updates, updated_at: new Date().toISOString() }
            : pkg
        ));
      }
      
      console.log('✅ Outstation package updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating outstation package:', error);
      setError(`Failed to update package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editingSlab) return;
    
    const slabValue = editingEntry[editingSlab as keyof OutstationPackage] as number;
    if (slabValue <= 0) {
      setError('Slab fare must be greater than 0');
      return;
    }
    
    try {
      const updates = { [editingSlab]: slabValue };
      await handleUpdatePackage(editingEntry.id, updates);
      setEditingEntry(null);
      setEditingSlab('');
      alert('✅ Slab fare updated successfully!');
    } catch (error) {
      console.error('❌ Error saving slab fare:', error);
    }
  };

  const getVehicleTypeInfo = (vehicleType: string) => {
    return vehicleTypes.find(vt => vt.value === vehicleType) || vehicleTypes[0];
  };

  const calculateSlabFare = (pkg: OutstationPackage, distance: number) => {
    const twoWayDistance = distance * 2; // Round trip
    
    // Find appropriate slab
    let slabFare = 0;
    let slabUsed = '';
    let extraKm = 0;
    
    if (twoWayDistance <= 10) {
      slabFare = pkg.slab_10km;
      slabUsed = '10km';
    } else if (twoWayDistance <= 20) {
      slabFare = pkg.slab_20km;
      slabUsed = '20km';
    } else if (twoWayDistance <= 30) {
      slabFare = pkg.slab_30km;
      slabUsed = '30km';
    } else if (twoWayDistance <= 40) {
      slabFare = pkg.slab_40km;
      slabUsed = '40km';
    } else if (twoWayDistance <= 50) {
      slabFare = pkg.slab_50km;
      slabUsed = '50km';
    } else if (twoWayDistance <= 60) {
      slabFare = pkg.slab_60km;
      slabUsed = '60km';
    } else if (twoWayDistance <= 70) {
      slabFare = pkg.slab_70km;
      slabUsed = '70km';
    } else if (twoWayDistance <= 80) {
      slabFare = pkg.slab_80km;
      slabUsed = '80km';
    } else if (twoWayDistance <= 90) {
      slabFare = pkg.slab_90km;
      slabUsed = '90km';
    } else if (twoWayDistance <= 100) {
      slabFare = pkg.slab_100km;
      slabUsed = '100km';
    } else if (twoWayDistance <= 110) {
      slabFare = pkg.slab_110km;
      slabUsed = '110km';
    } else if (twoWayDistance <= 120) {
      slabFare = pkg.slab_120km;
      slabUsed = '120km';
    } else if (twoWayDistance <= 130) {
      slabFare = pkg.slab_130km;
      slabUsed = '130km';
    } else if (twoWayDistance <= 140) {
      slabFare = pkg.slab_140km;
      slabUsed = '140km';
    } else if (twoWayDistance <= 150) {
      slabFare = pkg.slab_150km;
      slabUsed = '150km';
    } else {
      slabFare = pkg.slab_150km;
      slabUsed = '150km';
      extraKm = twoWayDistance - 150;
    }
    
    const extraKmCharge = extraKm * pkg.extra_km_rate;
    const totalFare = slabFare + extraKmCharge + pkg.driver_allowance_per_day;
    
    return {
      totalFare: Math.round(totalFare),
      slabUsed,
      slabFare,
      extraKmCharge,
      twoWayDistance,
      extraKm
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading outstation packages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Outstation Packages Management</h3>
          <p className="text-gray-600 mt-1">Configure slab-based pricing for outstation rides with fixed distance fares</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchOutstationPackages}
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
            <span className="text-red-700 font-medium">Error</span>
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
              <p className="text-blue-100 text-sm">Active Packages</p>
              <p className="text-3xl font-bold">{packages.filter(p => p.is_active).length}</p>
            </div>
            <span className="text-4xl">📦</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Slab System</p>
              <p className="text-3xl font-bold">{packages.filter(p => p.use_slab_system).length}</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg 80km Fare</p>
              <p className="text-3xl font-bold">
                ₹{packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + p.slab_80km, 0) / packages.length) : 0}
              </p>
            </div>
            <span className="text-4xl">🛣️</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Distance Slabs</p>
              <p className="text-3xl font-bold">7</p>
            </div>
            <span className="text-4xl">📏</span>
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">Saving package changes to database...</span>
          </div>
        </div>
      )}

      {/* Slab Configuration */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">📦</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Outstation Package Slabs</h4>
                <p className="text-gray-600 mt-1">
                  Fixed fare slabs for different distance ranges (calculated as round trip)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {packages.filter(p => p.is_active && p.use_slab_system).length} Using Slabs
            </span>
          </div>
        </div>

        {/* Vehicle Package Configurations */}
        <div className="p-6">
          <div className="space-y-8">
            {packages.map((pkg) => {
              const vehicleInfo = getVehicleTypeInfo(pkg.vehicle_type);
              
              return (
                <div key={pkg.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Vehicle Header */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{vehicleInfo.icon}</span>
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900">{vehicleInfo.label}</h5>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${pkg.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-xs text-gray-600">{pkg.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Pricing:</span>
                              <span className={`text-xs font-medium ${pkg.use_slab_system ? 'text-blue-600' : 'text-orange-600'}`}>
                                {pkg.use_slab_system ? '📊 Slab System' : '📏 Per-KM Legacy'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Slab System Toggle */}
                        <button
                          onClick={() => handleUpdatePackage(pkg.id, { use_slab_system: !pkg.use_slab_system })}
                          disabled={saving}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                            pkg.use_slab_system
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          {pkg.use_slab_system ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{pkg.use_slab_system ? 'Slab System' : 'Legacy Per-KM'}</span>
                        </button>
                        
                        {/* Active Toggle */}
                        <button
                          onClick={() => handleUpdatePackage(pkg.id, { is_active: !pkg.is_active })}
                          disabled={saving}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            pkg.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {pkg.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Slab Configuration Grid */}
                  {pkg.use_slab_system ? (
                    <div className="p-6">
                      <h6 className="text-md font-semibold text-gray-900 mb-4">Distance Slab Fares (Round Trip)</h6>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                        {distanceSlabs.map((slab) => {
                          const isEditing = editingEntry?.id === pkg.id && editingSlab === slab.key;
                          const slabValue = pkg[slab.key as keyof OutstationPackage] as number;
                          
                          return (
                            <div key={slab.key} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                              <div className="text-sm font-medium text-gray-700 mb-2">{slab.label} Slab</div>
                              <div className="text-xs text-gray-500 mb-3">Up to {slab.distance * 2}km round trip</div>
                              
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={editingEntry[slab.key as keyof OutstationPackage] as number}
                                    onChange={(e) => setEditingEntry({
                                      ...editingEntry,
                                      [slab.key]: Math.max(0, parseInt(e.target.value) || 0)
                                    })}
                                    className="w-full px-2 py-1 text-lg border-2 border-blue-500 rounded focus:ring-1 focus:ring-blue-500 text-center font-bold"
                                  />
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={handleSaveEdit}
                                      disabled={saving}
                                      className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                      <Save className="w-3 h-3 mx-auto" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingEntry(null);
                                        setEditingSlab('');
                                      }}
                                      disabled={saving}
                                      className="flex-1 bg-gray-600 text-white py-1 px-2 rounded text-xs hover:bg-gray-700 transition-colors disabled:opacity-50"
                                    >
                                      <X className="w-3 h-3 mx-auto" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-xl font-bold text-blue-600">₹{slabValue}</div>
                                  <button
                                    onClick={() => {
                                      setEditingEntry(pkg);
                                      setEditingSlab(slab.key);
                                    }}
                                    disabled={saving}
                                    className="w-full bg-blue-100 text-blue-700 py-1 px-2 rounded text-xs hover:bg-blue-200 transition-colors disabled:opacity-50"
                                  >
                                    <Edit className="w-3 h-3 mx-auto" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Extra Charges Info */}
                      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                        <h6 className="text-sm font-medium text-yellow-900 mb-2">Additional Charges</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-yellow-700">Extra KM Rate (&gt;140km):</span>
                            <div className="font-medium">₹{pkg.extra_km_rate}/km</div>
                          </div>
                          <div>
                            <span className="text-yellow-700">Driver Allowance:</span>
                            <div className="font-medium">₹{pkg.driver_allowance_per_day}/day</div>
                          </div>
                          <div>
                            <span className="text-yellow-700">Night Charge:</span>
                            <div className="font-medium">{pkg.night_charge_percent}% (10 PM - 6 AM)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-orange-50">
                      <div className="text-center text-orange-800">
                        <span className="text-2xl mb-2 block">📏</span>
                        <div className="font-medium">Legacy Per-KM Pricing Active</div>
                        <div className="text-sm mt-1">This vehicle uses the traditional per-kilometer fare calculation</div>
                        <div className="text-xs mt-2">Toggle to "Slab System" above to use fixed distance fares</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sample Fare Calculations */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Sample Fare Calculations (Slab System)</h4>
          <p className="text-gray-600 mt-1">See how slab-based pricing applies to popular destinations</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  One-Way Distance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Round Trip
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
                    <span className="text-sm font-bold text-purple-600">{destination.distance * 2} km</span>
                  </td>
                  {vehicleTypes.slice(0, 3).map((vehicleType) => {
                    const pkg = packages.find(p => p.vehicle_type === vehicleType.value && p.use_slab_system);
                    
                    if (!pkg) {
                      return (
                        <td key={vehicleType.value} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-gray-400 text-sm">Legacy pricing</div>
                        </td>
                      );
                    }
                    
                    const fareCalc = calculateSlabFare(pkg, destination.distance);
                    
                    return (
                      <td key={vehicleType.value} className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-gray-900">₹{fareCalc.totalFare}</div>
                          <div className="text-xs text-blue-600">{fareCalc.slabUsed} slab</div>
                          {fareCalc.extraKm > 0 && (
                            <div className="text-xs text-orange-600">+{fareCalc.extraKm}km extra</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slab System Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">📊</span>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Slab-Based Pricing System</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">How Slabs Work</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Round Trip Calculation:</strong> Distance × 2 for return journey</li>
                  <li>• <strong>Fixed Slab Fares:</strong> Predetermined rates for distance ranges</li>
                  <li>• <strong>7 Distance Slabs:</strong> 20km, 40km, 60km, 80km, 100km, 120km, 140km</li>
                  <li>• <strong>Extra KM Charges:</strong> Per-km rate for distances beyond 140km</li>
                  <li>• <strong>Driver Allowance:</strong> Daily allowance included in total</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Slab Selection Logic</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>≤40km round trip:</strong> Uses 20km slab fare</li>
                  <li>• <strong>41-80km round trip:</strong> Uses 40km slab fare</li>
                  <li>• <strong>81-120km round trip:</strong> Uses 60km slab fare</li>
                  <li>• <strong>121-160km round trip:</strong> Uses 80km slab fare</li>
                  <li>• <strong>&gt;280km round trip:</strong> Uses 140km slab + extra charges</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Slab Updates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Slab Updates</h4>
        <p className="text-gray-600 mb-4">Apply changes to all slab fares across all vehicles</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              packages.forEach(pkg => {
                if (pkg.is_active && pkg.use_slab_system) {
                  const updates = {
                    slab_20km: Math.round(pkg.slab_20km * 1.1),
                    slab_40km: Math.round(pkg.slab_40km * 1.1),
                    slab_60km: Math.round(pkg.slab_60km * 1.1),
                    slab_80km: Math.round(pkg.slab_80km * 1.1),
                    slab_100km: Math.round(pkg.slab_100km * 1.1),
                    slab_120km: Math.round(pkg.slab_120km * 1.1),
                    slab_140km: Math.round(pkg.slab_140km * 1.1)
                  };
                  handleUpdatePackage(pkg.id, updates);
                }
              });
              alert('Increased all slab fares by 10%!');
            }}
            disabled={saving}
            className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+10%</div>
            <div className="text-sm">Increase All Slabs</div>
          </button>
          
          <button
            onClick={() => {
              packages.forEach(pkg => {
                if (pkg.is_active && pkg.use_slab_system) {
                  const updates = {
                    slab_10km: Math.round(pkg.slab_10km * 0.9),
                    slab_20km: Math.round(pkg.slab_20km * 0.9),
                    slab_30km: Math.round(pkg.slab_30km * 0.9),
                    slab_40km: Math.round(pkg.slab_40km * 0.9),
                    slab_50km: Math.round(pkg.slab_50km * 0.9),
                    slab_60km: Math.round(pkg.slab_60km * 0.9),
                    slab_70km: Math.round(pkg.slab_70km * 0.9),
                    slab_80km: Math.round(pkg.slab_80km * 0.9),
                    slab_90km: Math.round(pkg.slab_90km * 0.9),
                    slab_100km: Math.round(pkg.slab_100km * 0.9),
                    slab_110km: Math.round(pkg.slab_110km * 0.9),
                    slab_120km: Math.round(pkg.slab_120km * 0.9),
                    slab_130km: Math.round(pkg.slab_130km * 0.9),
                    slab_140km: Math.round(pkg.slab_140km * 0.9),
                    slab_150km: Math.round(pkg.slab_150km * 0.9)
                  };
                  handleUpdatePackage(pkg.id, updates);
                }
              });
              alert('Applied 10% discount to all slab fares!');
            }}
            disabled={saving}
            className="bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">-10%</div>
            <div className="text-sm">Discount All Slabs</div>
          </button>
          
          <button
            onClick={() => {
              packages.forEach(pkg => {
                if (pkg.is_active && pkg.use_slab_system) {
                  const updates = {
                    slab_10km: pkg.slab_10km + 50,
                    slab_20km: pkg.slab_20km + 100,
                    slab_30km: pkg.slab_30km + 100,
                    slab_40km: pkg.slab_40km + 150,
                    slab_50km: pkg.slab_50km + 150,
                    slab_60km: pkg.slab_60km + 200,
                    slab_70km: pkg.slab_70km + 200,
                    slab_80km: pkg.slab_80km + 250,
                    slab_90km: pkg.slab_90km + 250,
                    slab_100km: pkg.slab_100km + 300,
                    slab_110km: pkg.slab_110km + 300,
                    slab_120km: pkg.slab_120km + 350,
                    slab_130km: pkg.slab_130km + 350,
                    slab_140km: pkg.slab_140km + 400,
                    slab_150km: pkg.slab_150km + 450
                  };
                  handleUpdatePackage(pkg.id, updates);
                }
              });
              alert('Added progressive amounts to all slabs!');
            }}
            disabled={saving}
            className="bg-purple-100 text-purple-700 p-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+₹100-400</div>
            <div className="text-sm">Progressive Increase</div>
          </button>
          
          <button
            onClick={() => {
              packages.forEach(pkg => {
                if (pkg.is_active && pkg.use_slab_system) {
                  const updates = {
                    driver_allowance_per_day: pkg.driver_allowance_per_day + 100
                  };
                  handleUpdatePackage(pkg.id, updates);
                }
              });
              alert('Increased driver allowance by ₹100 for all packages!');
            }}
            disabled={saving}
            className="bg-orange-100 text-orange-700 p-4 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            <div className="text-lg font-bold">+₹100</div>
            <div className="text-sm">Driver Allowance</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutstationPackagesManagement;