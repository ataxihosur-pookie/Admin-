import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Star, Clock, RefreshCw, Users, Car, AlertCircle } from 'lucide-react';
import databaseService from '../services/databaseService';

// Module-scoped flag to prevent multiple Google Maps script loads
let googleMapsScriptLoaded = false;

interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  license_number: string;
  license_expiry: string;
  status: 'online' | 'offline' | 'busy' | 'suspended';
  rating: number;
  total_rides: number;
  is_verified: boolean;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  vehicle_year?: number;
  latitude?: number;
  longitude?: number;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
}

const LiveMap: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const statusColors = {
    online: { bg: 'bg-green-100', text: 'text-green-800', marker: '#10b981' },
    busy: { bg: 'bg-yellow-100', text: 'text-yellow-800', marker: '#f59e0b' },
    offline: { bg: 'bg-gray-100', text: 'text-gray-800', marker: '#6b7280' },
    suspended: { bg: 'bg-red-100', text: 'text-red-800', marker: '#ef4444' }
  };

  const statusIcons = {
    online: '🟢',
    busy: '🟡',
    offline: '⚫',
    suspended: '🔴'
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (typeof google !== 'undefined') {
        const mapElement = document.getElementById('live-map');
        if (mapElement) {
          const mapInstance = new google.maps.Map(mapElement, {
            center: { lat: 12.1266, lng: 77.8308 }, // Hosur center
            zoom: 12,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });
          setMap(mapInstance);
          setMapLoaded(true);
          console.log('✅ Google Maps initialized successfully');
        }
      }
    };

    // Load Google Maps script
    if (!window.google && !googleMapsScriptLoaded) {
      googleMapsScriptLoaded = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBIt8z_VD5s9lo8RpDKdJVhqgtwn0zVBBo&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps');
        setMapLoaded(false);
        googleMapsScriptLoaded = false; // Reset flag on error
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initMap();
    }
  }, []);

  // Fetch drivers with locations
  const fetchDriversWithLocations = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching REAL drivers with live locations from database...');
      
      // Add retry logic for failed requests
      let driversData = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          driversData = await databaseService.fetchDriversWithLiveLocations();
          break; // Success, exit retry loop
        } catch (fetchError) {
          retryCount++;
          console.warn(`⚠️ Attempt ${retryCount} failed:`, fetchError);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying in ${retryCount} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          } else {
            console.error('❌ All retry attempts failed, using fallback');
            throw fetchError;
          }
        }
      }

      setDrivers(driversData);
      setLastRefresh(new Date());
      console.log(`✅ Fetched ${driversData.length} drivers with live locations from database`);
      
      // Log location data for debugging
      const driversWithLocations = driversData.filter(d => d.latitude !== null && d.longitude !== null);
      const driversWithoutLocations = driversData.filter(d => d.latitude === null || d.longitude === null);
      
      console.log(`📍 SUMMARY: ${driversWithLocations.length} drivers WITH locations, ${driversWithoutLocations.length} drivers WITHOUT locations`);
      
      driversWithLocations.forEach(driver => {
        console.log(`📍 WITH LOCATION: ${driver.full_name} at ${driver.latitude?.toFixed(6)}, ${driver.longitude?.toFixed(6)} (Updated: ${driver.last_location_update ? new Date(driver.last_location_update).toLocaleTimeString() : 'Unknown'})`);
      });
      
      driversWithoutLocations.forEach(driver => {
        console.log(`📍 NO LOCATION: ${driver.full_name} (User ID: ${driver.user_id?.slice(-6)})`);
      });
      
    } catch (error) {
      console.error('❌ Error fetching drivers with live locations:', error);
      
      // Show user-friendly error message
      if (error.message.includes('timeout')) {
        console.log('⏰ Request timed out - this might be a temporary network issue');
      } else if (error.message.includes('HTTP 400')) {
        console.log('🔧 HTTP 400 error - there might be a configuration issue with the Edge Function');
      } else if (error.message.includes('Failed to fetch')) {
        console.log('🌐 Network error - check your internet connection and Supabase status');
      }
      
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // Update map markers when drivers data changes
  useEffect(() => {
    if (map && mapLoaded && drivers.length > 0) {
      updateMapMarkers();
    }
  }, [map, mapLoaded, drivers]);

  // Initial data fetch
  useEffect(() => {
    fetchDriversWithLocations();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDriversWithLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateMapMarkers = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();
    let markerIndex = 0;

    drivers.forEach((driver) => {
      if (driver.latitude !== null && driver.longitude !== null) {
        const position = { lat: driver.latitude, lng: driver.longitude };
        
        // Add small random offset to prevent markers from overlapping exactly
        const offsetLat = (Math.random() - 0.5) * 0.0001; // ~10 meters
        const offsetLng = (Math.random() - 0.5) * 0.0001; // ~10 meters
        const adjustedPosition = { 
          lat: position.lat + offsetLat, 
          lng: position.lng + offsetLng 
        };
        
        // Create custom marker icon based on status
        const markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: statusColors[driver.status].marker,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        };

        const marker = new google.maps.Marker({
          position: adjustedPosition,
          map,
          title: `${driver.full_name} - ${driver.status}`,
          icon: markerIcon,
          zIndex: 1000 + markerIndex // Ensure all markers are visible
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          setSelectedDriver(driver);
          
          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">${driver.full_name}</h3>
                <p style="margin: 0 0 4px 0; color: #666;">📱 ${driver.phone_number}</p>
                <p style="margin: 0 0 4px 0; color: #666;">🚗 ${driver.vehicle_make || 'Unknown'} ${driver.vehicle_model || 'Vehicle'}</p>
                <p style="margin: 0 0 4px 0; color: #666;">📋 ${driver.vehicle_registration || 'No registration'}</p>
                <p style="margin: 0; color: ${statusColors[driver.status].marker};">
                  ${statusIcons[driver.status]} ${driver.status.toUpperCase()}
                </p>
                <p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">
                  Lat: ${driver.latitude?.toFixed(6)}, Lng: ${driver.longitude?.toFixed(6)}
                </p>
                <p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">
                  Updated: ${driver.last_location_update ? new Date(driver.last_location_update).toLocaleTimeString() : 'Unknown'}
                </p>
              </div>
            `
          });
          
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        bounds.extend(position);
        markerIndex++;
      }
    });

    setMarkers(newMarkers);
    
    console.log(`📍 Created ${newMarkers.length} markers on map for ${drivers.length} drivers`);
    
    // Log drivers at the same location
    const locationGroups = drivers.reduce((groups: any, driver) => {
      if (driver.latitude && driver.longitude) {
        const key = `${driver.latitude.toFixed(6)},${driver.longitude.toFixed(6)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(driver.full_name);
      }
      return groups;
    }, {});
    
    Object.entries(locationGroups).forEach(([location, names]) => {
      if ((names as string[]).length > 1) {
        console.log(`📍 OVERLAPPING LOCATION ${location}: ${(names as string[]).join(', ')}`);
      }
    });

    // Fit map to show all drivers
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };

  const getDriverStats = () => {
    const stats = {
      total: drivers.length,
      online: drivers.filter(d => d.status === 'online').length,
      busy: drivers.filter(d => d.status === 'busy').length,
      offline: drivers.filter(d => d.status === 'offline').length,
      suspended: drivers.filter(d => d.status === 'suspended').length
    };
    return stats;
  };

  const stats = getDriverStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Live Driver Map - Hosur, Tamil Nadu</h3>
          <p className="text-gray-600 mt-1">Real-time tracking of all drivers with interactive map</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchDriversWithLocations}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={async () => {
              try {
                console.log('🧪 Creating test driver locations for ALL drivers...');
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                const response = await fetch(`${supabaseUrl}/functions/v1/create-test-driver-locations`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                  }
                });
                
                const result = await response.json();
                if (result.success) {
                  alert(`✅ Test Locations Created Successfully!\n\nCreated: ${result.locations_created} locations\nFor: ${result.drivers_updated} drivers\nArea: Hosur (${result.radius_km.toFixed(1)}km radius)\n\nThe map should now show all drivers with live locations!`);
                  
                  // Wait a moment then refresh
                  setTimeout(async () => {
                    await fetchDriversWithLocations();
                  }, 1000);
                } else {
                  throw new Error(result.error);
                }
              } catch (error) {
                console.error('❌ Error creating test locations:', error);
                alert('Failed to create test locations. Check console for details.');
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>🧪</span>
            <span>Create Test Locations</span>
          </button>
          <button 
            onClick={async () => {
              try {
                console.log('🔍 Checking live_locations table directly...');
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
                
                if (!supabaseServiceKey) {
                  alert('❌ SERVICE ROLE KEY not configured. Cannot check live_locations table.');
                  return;
                }
                
                const response = await fetch(`${supabaseUrl}/rest/v1/live_locations?select=*&order=updated_at.desc&limit=10`, {
                  headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                  }
                });
                
                const locations = await response.json();
                console.log('📍 Live locations in database:', locations);
                
                if (locations.length === 0) {
                  alert('❌ No live locations found in database.\n\nThis means:\n• No drivers are currently sending location updates\n• Driver apps may not be running\n• Location tracking may not be working\n\nTry the "Create Test Locations" button to add sample data.');
                } else {
                  const locationInfo = locations.slice(0, 5).map((loc: any, index: number) => 
                    `${index + 1}. User: ${loc.user_id.slice(-6)} - ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} (${new Date(loc.updated_at).toLocaleTimeString()})`
                  ).join('\n');
                  
                  alert(`✅ Found ${locations.length} live locations in database:\n\n${locationInfo}${locations.length > 5 ? '\n\n...and ' + (locations.length - 5) + ' more' : ''}\n\nNow click "Refresh" to load drivers with these locations on the map!`);
                }
              } catch (error) {
                console.error('❌ Error checking live locations:', error);
                alert('Failed to check live locations. Check console for details.');
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>🔍</span>
            <span>Check DB Locations</span>
          </button>
          <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
            Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Drivers</p>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-blue-200 mt-1">
                {drivers.filter(d => d.latitude && d.longitude).length} with locations
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
          {drivers.filter(d => d.latitude && d.longitude).length === 0 && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Online</p>
              <p className="text-2xl font-bold">{stats.online}</p>
              <p className="text-xs text-green-200 mt-1">
                {drivers.filter(d => d.status === 'online' && d.latitude && d.longitude).length} with locations
              </p>
            </div>
            <span className="text-2xl">🟢</span>
          </div>
          {drivers.filter(d => d.status === 'online' && d.latitude && d.longitude).length === 0 && stats.online > 0 && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          )}
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Busy</p>
              <p className="text-2xl font-bold">{stats.busy}</p>
            </div>
            <span className="text-2xl">🟡</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm">Offline</p>
              <p className="text-2xl font-bold">{stats.offline}</p>
            </div>
            <span className="text-2xl">⚫</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Suspended</p>
              <p className="text-2xl font-bold">{stats.suspended}</p>
            </div>
            <span className="text-2xl">🔴</span>
          </div>
        </div>
      </div>

      {/* Map and Driver Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900">Interactive Driver Map</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Online</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span>Busy</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                    <span>Offline</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map */}
            <div className="relative">
              <div 
                id="live-map" 
                className="w-full h-96"
                style={{ minHeight: '400px' }}
              ></div>
              
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Google Maps...</p>
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Updating locations...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Driver Details Panel */}
        <div className="space-y-6">
          {/* Selected Driver Details */}
          {selectedDriver ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">{selectedDriver.full_name}</h4>
                    <p className="text-blue-100 text-sm">Driver Details</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[selectedDriver.status].bg
                  } ${statusColors[selectedDriver.status].text}`}>
                    {statusIcons[selectedDriver.status]} {selectedDriver.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Contact Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedDriver.phone_number}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 text-gray-400">📧</span>
                      <span className="text-sm text-gray-900">{selectedDriver.email}</span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Performance</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{selectedDriver.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <Car className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{selectedDriver.total_rides}</span>
                      </div>
                      <div className="text-xs text-gray-500">Total Rides</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Vehicle Information</h5>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">{selectedDriver.vehicle_make} {selectedDriver.vehicle_model}</span>
                      <span className="text-gray-500 ml-2">({selectedDriver.vehicle_year})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      📋 {selectedDriver.vehicle_registration}
                    </div>
                    <div className="text-sm text-gray-600">
                      🎨 {selectedDriver.vehicle_color} • {selectedDriver.vehicle_type?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* License Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">License Information</h5>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">{selectedDriver.license_number}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Expires: {new Date(selectedDriver.license_expiry).toLocaleDateString('en-IN')}
                    </div>
                    {selectedDriver.is_verified && (
                      <div className="text-sm text-green-600 font-medium">
                        ✅ Verified Driver
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Location Information</h5>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">📍 Current Location</span>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                      {selectedDriver.latitude?.toFixed(6)}, {selectedDriver.longitude?.toFixed(6)}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        Last update: {selectedDriver.last_location_update 
                          ? new Date(selectedDriver.last_location_update).toLocaleString('en-IN')
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4 border-t">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>Call Driver</span>
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Select a Driver</h4>
              <p className="text-gray-600 text-sm">Click on any driver marker on the map to view their details</p>
            </div>
          )}

          {/* Drivers List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">All Drivers</h4>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {drivers.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No drivers found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {drivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedDriver?.id === driver.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedDriver(driver);
                        if (map && driver.latitude && driver.longitude) {
                          map.panTo({ lat: driver.latitude, lng: driver.longitude });
                          map.setZoom(16);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                              {driver.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {driver.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {driver.vehicle_make} {driver.vehicle_model} • {driver.vehicle_registration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            statusColors[driver.status].bg
                          } ${statusColors[driver.status].text}`}>
                            {statusIcons[driver.status]} {driver.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            ⭐ {driver.rating} • {driver.total_rides} rides
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Loading Error */}
      {!mapLoaded && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Map Loading Issue</p>
              <p className="text-xs text-yellow-600 mt-1">
                Google Maps is taking longer than expected to load. Please check your internet connection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;