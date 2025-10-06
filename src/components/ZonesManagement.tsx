import React, { useState, useEffect, useRef } from 'react';
import { Plus, CreditCard as Edit, Trash2, Eye, EyeOff, Save, X, MapPin, Circle, Hexagon as PolygonIcon } from 'lucide-react';
import databaseService from '../services/databaseService';

interface Zone {
  id: string;
  name: string;
  city: string;
  state: string;
  coordinates: any; // GeoJSON polygon or circle
  center_latitude: number;
  center_longitude: number;
  radius_km?: number;
  base_fare: number;
  per_km_rate: number;
  surge_multiplier: number;
  is_active: boolean;
  zone_type: 'circle' | 'polygon';
  created_at: string;
  updated_at: string;
}

interface ZoneFormData {
  name: string;
  base_fare: number;
  per_km_rate: number;
  surge_multiplier: number;
  zone_type: 'circle' | 'polygon';
}

const ZonesManagement: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [zoneOverlays, setZoneOverlays] = useState<(google.maps.Circle | google.maps.Polygon)[]>([]);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [selectedZoneType, setSelectedZoneType] = useState<'circle' | 'polygon'>('circle');
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<google.maps.Circle | google.maps.Polygon | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    base_fare: 50,
    per_km_rate: 12,
    surge_multiplier: 1.0,
    zone_type: 'circle'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps with Drawing Library
  useEffect(() => {
    const initMap = () => {
      if (typeof google !== 'undefined' && mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 12.1266, lng: 77.8308 }, // Hosur center
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Initialize Drawing Manager
        const drawingManagerInstance = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          circleOptions: {
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            strokeColor: '#1d4ed8',
            strokeWeight: 2,
            clickable: true,
            editable: true,
            zIndex: 1
          },
          polygonOptions: {
            fillColor: '#10b981',
            fillOpacity: 0.3,
            strokeColor: '#047857',
            strokeWeight: 2,
            clickable: true,
            editable: true,
            zIndex: 1
          }
        });

        drawingManagerInstance.setMap(mapInstance);

        // Add drawing event listeners
        drawingManagerInstance.addListener('circlecomplete', (circle: google.maps.Circle) => {
          console.log('🔵 Circle drawn:', circle.getCenter(), circle.getRadius());
          setCurrentDrawing(circle);
          setSelectedZoneType('circle');
          setFormData(prev => ({ ...prev, zone_type: 'circle' }));
          setShowZoneForm(true);
          drawingManagerInstance.setDrawingMode(null);
        });

        drawingManagerInstance.addListener('polygoncomplete', (polygon: google.maps.Polygon) => {
          console.log('🔺 Polygon drawn:', polygon.getPath().getArray());
          setCurrentDrawing(polygon);
          setSelectedZoneType('polygon');
          setFormData(prev => ({ ...prev, zone_type: 'polygon' }));
          setShowZoneForm(true);
          drawingManagerInstance.setDrawingMode(null);
        });

        setMap(mapInstance);
        setDrawingManager(drawingManagerInstance);
        setMapLoaded(true);
        console.log('✅ Google Maps with Drawing Tools initialized successfully');
      }
    };

    // Load Google Maps script with Drawing Library
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBIt8z_VD5s9lo8RpDKdJVhqgtwn0zVBBo&libraries=drawing,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps');
        setMapLoaded(false);
      };
      document.head.appendChild(script);
    } else if (window.google?.maps?.drawing) {
      initMap();
    }
  }, []);

  // Fetch zones and display on map
  useEffect(() => {
    fetchZones();
  }, []);

  // Update map overlays when zones change
  useEffect(() => {
    if (map && mapLoaded) {
      updateZoneOverlays();
    }
  }, [zones, map, mapLoaded]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching zones from database...');
      const zonesData = await databaseService.fetchZones();
      setZones(zonesData);
      console.log(`✅ Fetched ${zonesData.length} zones from database`);
    } catch (error) {
      console.error('❌ Error fetching zones:', error);
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  const updateZoneOverlays = () => {
    if (!map) return;

    // Clear existing overlays
    zoneOverlays.forEach(overlay => overlay.setMap(null));
    setZoneOverlays([]);

    const newOverlays: (google.maps.Circle | google.maps.Polygon)[] = [];

    zones.forEach((zone) => {
      if (zone.coordinates && typeof zone.coordinates === 'object') {
        let overlay: google.maps.Circle | google.maps.Polygon;

        if (zone.coordinates.type === 'circle') {
          // Create circle overlay
          overlay = new google.maps.Circle({
            center: { 
              lat: zone.coordinates.center?.lat || zone.center_latitude, 
              lng: zone.coordinates.center?.lng || zone.center_longitude 
            },
            radius: zone.coordinates.radius || (zone.radius_km * 1000),
            fillColor: zone.is_active ? '#3b82f6' : '#6b7280',
            fillOpacity: 0.3,
            strokeColor: zone.is_active ? '#1d4ed8' : '#374151',
            strokeWeight: 2,
            clickable: true,
            map: map
          });
        } else if (zone.coordinates.type === 'polygon') {
          // Create polygon overlay
          overlay = new google.maps.Polygon({
            paths: zone.coordinates.paths,
            fillColor: zone.is_active ? '#10b981' : '#6b7280',
            fillOpacity: 0.3,
            strokeColor: zone.is_active ? '#047857' : '#374151',
            strokeWeight: 2,
            clickable: true,
            map: map
          });
        } else {
          console.warn('⚠️ Invalid zone coordinates format:', zone.coordinates);
          return; // Skip invalid zone data
        }

        // Add click listener to show zone info
        overlay.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${zone.name}</h3>
                <div style="margin-bottom: 8px;">
                  <span style="color: #6b7280;">Status:</span>
                  <span style="margin-left: 8px; color: ${zone.is_active ? '#059669' : '#dc2626'};">
                    ${zone.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                <div style="margin-bottom: 4px;">
                  <span style="color: #6b7280;">Base Fare:</span>
                  <span style="margin-left: 8px; font-weight: 600;">₹${zone.base_fare}</span>
                </div>
                <div style="margin-bottom: 4px;">
                  <span style="color: #6b7280;">Per KM:</span>
                  <span style="margin-left: 8px; font-weight: 600;">₹${zone.per_km_rate}</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #6b7280;">Surge:</span>
                  <span style="margin-left: 8px; font-weight: 600; color: ${zone.surge_multiplier > 1 ? '#dc2626' : '#059669'};">
                    ${zone.surge_multiplier}x
                  </span>
                </div>
                <div style="color: #6b7280; font-size: 12px;">
                  Type: ${zone.coordinates.type === 'circle' ? '🔵 Circle' : '🔺 Polygon'}
                </div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
                  <button onclick="editZone('${zone.id}')" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                    Edit Zone
                  </button>
                </div>
              </div>
            `,
            position: zone.coordinates.type === 'circle' 
              ? { lat: zone.coordinates.center?.lat || zone.center_latitude, lng: zone.coordinates.center?.lng || zone.center_longitude }
              : getPolygonCenter(zone.coordinates.paths)
          });
          
          infoWindow.open(map);
        });

        newOverlays.push(overlay);
      }
    });

    setZoneOverlays(newOverlays);
    
    console.log(`✅ Created ${newOverlays.length} zone overlays on map from ${zones.length} zones`);
  };

  const getPolygonCenter = (paths: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    let lat = 0, lng = 0;
    paths.forEach(point => {
      lat += point.lat;
      lng += point.lng;
    });
    return {
      lat: lat / paths.length,
      lng: lng / paths.length
    };
  };

  const startDrawing = (type: 'circle' | 'polygon') => {
    if (!drawingManager) return;
    
    setSelectedZoneType(type);
    setIsCreatingZone(true);
    
    if (type === 'circle') {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
    } else {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const cancelDrawing = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    if (currentDrawing) {
      currentDrawing.setMap(null);
      setCurrentDrawing(null);
    }
    setIsCreatingZone(false);
    setShowZoneForm(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Zone name is required';
    if (formData.base_fare <= 0) newErrors.base_fare = 'Base fare must be greater than 0';
    if (formData.per_km_rate <= 0) newErrors.per_km_rate = 'Per KM rate must be greater than 0';
    if (formData.surge_multiplier < 1) newErrors.surge_multiplier = 'Surge multiplier must be at least 1.0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveZone = async () => {
    if (!validateForm() || !currentDrawing) return;

    try {
      let zoneData: any = {
        name: formData.name,
        city: 'Hosur',
        state: 'Tamil Nadu',
        base_fare: formData.base_fare,
        per_km_rate: formData.per_km_rate,
        surge_multiplier: formData.surge_multiplier,
        is_active: true
      };

      if (formData.zone_type === 'circle' && currentDrawing instanceof google.maps.Circle) {
        const center = currentDrawing.getCenter();
        const radius = currentDrawing.getRadius();
        
        zoneData.center_latitude = center?.lat();
        zoneData.center_longitude = center?.lng();
        zoneData.radius_km = radius / 1000; // Convert to km
        zoneData.coordinates = {
          type: 'circle',
          center: { lat: center?.lat(), lng: center?.lng() },
          radius: radius
        };
      } else if (formData.zone_type === 'polygon' && currentDrawing instanceof google.maps.Polygon) {
        const path = currentDrawing.getPath();
        const paths = path.getArray().map(latLng => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        }));
        
        // Calculate center of polygon
        const center = getPolygonCenter(paths);
        zoneData.center_latitude = center.lat;
        zoneData.center_longitude = center.lng;
        zoneData.coordinates = {
          type: 'polygon',
          paths: paths
        };
      }

      console.log('💾 Saving zone:', zoneData);
      
      // Save to database
      await databaseService.createZone(zoneData);
      
      alert(`✅ Zone "${formData.name}" created successfully!\n\nThis zone is now active and customers within this area can book rides.`);
      
      // Refresh zones list from database
      await fetchZones();
      
      resetForm();
      setCurrentDrawing(null);
      setShowZoneForm(false);
      setIsCreatingZone(false);
      
    } catch (error) {
      console.error('❌ Error saving zone:', error);
      alert(`Failed to save zone: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      base_fare: 50,
      per_km_rate: 12,
      surge_multiplier: 1.0,
      zone_type: 'circle'
    });
    setErrors({});
  };

  const handleToggleZone = async (zoneId: string, isActive: boolean) => {
    try {
      // Update zone status in database
      await databaseService.updateZone(zoneId, { is_active: !isActive });
      
      console.log(`${!isActive ? '✅' : '🚫'} Zone ${!isActive ? 'activated' : 'deactivated'}`);
      alert(`Zone ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      
      // Refresh zones list from database
      await fetchZones();
      
    } catch (error) {
      console.error('❌ Error updating zone status:', error);
      alert(`Failed to update zone status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditZone = async (zoneId: string) => {
    try {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) {
        alert('Zone not found');
        return;
      }

      // Set form data with zone values
      setFormData({
        name: zone.name,
        base_fare: zone.base_fare,
        per_km_rate: zone.per_km_rate,
        surge_multiplier: zone.surge_multiplier,
        zone_type: zone.coordinates?.type || 'circle'
      });

      // Create editable overlay based on zone type
      if (zone.coordinates?.type === 'circle') {
        const circle = new google.maps.Circle({
          center: { 
            lat: zone.coordinates.center?.lat || zone.center_latitude, 
            lng: zone.coordinates.center?.lng || zone.center_longitude 
          },
          radius: zone.coordinates.radius || (zone.radius_km * 1000),
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          strokeColor: '#1d4ed8',
          strokeWeight: 2,
          clickable: true,
          editable: true,
          map: map
        });
        setCurrentDrawing(circle);
      } else if (zone.coordinates?.type === 'polygon') {
        const polygon = new google.maps.Polygon({
          paths: zone.coordinates.paths,
          fillColor: '#10b981',
          fillOpacity: 0.3,
          strokeColor: '#047857',
          strokeWeight: 2,
          clickable: true,
          editable: true,
          map: map
        });
        setCurrentDrawing(polygon);
      }

      setShowZoneForm(true);
      setIsCreatingZone(true);
      
    } catch (error) {
      console.error('❌ Error editing zone:', error);
      alert('Failed to edit zone. Please try again.');
    }
  };

  // Make editZone function available globally for info window buttons
  useEffect(() => {
    (window as any).editZone = handleEditZone;
    return () => {
      delete (window as any).editZone;
    };
  }, [zones]);

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete zone from database
      await databaseService.deleteZone(zoneId);
      
      alert('Zone deleted successfully!');
      
      // Refresh zones list from database
      await fetchZones();
      
    } catch (error) {
      console.error('❌ Error deleting zone:', error);
      alert(`Failed to delete zone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCustomerLocation = async () => {
    if (!map) return;

    // Get a random location in Hosur for testing
    const testLocations = [
      { lat: 12.1266, lng: 77.8308, name: 'Hosur Bus Stand (Inside Zone)' },
      { lat: 12.1500, lng: 77.8500, name: 'Industrial Area (Inside Zone)' },
      { lat: 12.0800, lng: 77.7800, name: 'Outside Service Area' },
      { lat: 12.1800, lng: 77.9000, name: 'Far from Hosur (Outside)' }
    ];

    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
    
    // Check if location is within any active zone
    const isInServiceArea = zones.some(zone => {
      if (!zone.is_active) return false;
      
      if (zone.zone_type === 'circle') {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(randomLocation.lat, randomLocation.lng),
          new google.maps.LatLng(zone.center_latitude, zone.center_longitude)
        );
        return distance <= (zone.radius_km! * 1000);
      } else if (zone.zone_type === 'polygon') {
        const polygon = new google.maps.Polygon({
          paths: zone.coordinates.paths
        });
        return google.maps.geometry.poly.containsLocation(
          new google.maps.LatLng(randomLocation.lat, randomLocation.lng),
          polygon
        );
      }
      return false;
    });

    // Show test marker
    const testMarker = new google.maps.Marker({
      position: randomLocation,
      map: map,
      title: randomLocation.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: isInServiceArea ? '#10b981' : '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    // Show result
    const message = isInServiceArea 
      ? `✅ Service Available!\n\nLocation: ${randomLocation.name}\nCustomers at this location can book rides.`
      : `❌ Sorry! We are not available here at this moment.\n\nLocation: ${randomLocation.name}\nThis location is outside our service zones.`;
    
    alert(message);

    // Remove test marker after 5 seconds
    setTimeout(() => {
      testMarker.setMap(null);
    }, 5000);

    // Pan to test location
    map.panTo(randomLocation);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Service Zone Management - Hosur, Tamil Nadu</h3>
          <p className="text-gray-600 mt-1">Create and manage service zones where customers can book rides</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={testCustomerLocation}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <MapPin className="w-4 h-4" />
            <span>Test Location</span>
          </button>
          <button 
            onClick={fetchZones}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Zone Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Zones</p>
              <p className="text-3xl font-bold">{zones.length}</p>
            </div>
            <span className="text-4xl">🌍</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Zones</p>
              <p className="text-3xl font-bold">{zones.filter(z => z.is_active).length}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Circle Zones</p>
              <p className="text-3xl font-bold">{zones.filter(z => z.zone_type === 'circle').length}</p>
            </div>
            <span className="text-4xl">🔵</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Polygon Zones</p>
              <p className="text-3xl font-bold">{zones.filter(z => z.zone_type === 'polygon').length}</p>
            </div>
            <span className="text-4xl">🔺</span>
          </div>
        </div>
      </div>

      {/* Map and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900">Interactive Zone Map</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startDrawing('circle')}
                    disabled={isCreatingZone || !mapLoaded}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Circle className="w-4 h-4" />
                    <span>Draw Circle</span>
                  </button>
                  <button
                    onClick={() => startDrawing('polygon')}
                    disabled={isCreatingZone || !mapLoaded}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <PolygonIcon className="w-4 h-4" />
                    <span>Draw Polygon</span>
                  </button>
                  {isCreatingZone && (
                    <button
                      onClick={cancelDrawing}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
              
              {isCreatingZone && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    🎯 Drawing Mode Active
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedZoneType === 'circle' 
                      ? 'Click and drag on the map to create a circular service zone'
                      : 'Click multiple points on the map to create a polygon service zone'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* Map */}
            <div className="relative">
              <div 
                ref={mapRef}
                className="w-full h-96"
                style={{ minHeight: '500px' }}
              ></div>
              
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Google Maps...</p>
                    <p className="text-sm text-gray-500 mt-2">Initializing drawing tools...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone Controls */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">How to Create Zones</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <Circle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Circle Zone</p>
                  <p className="text-gray-600">Click "Draw Circle" and drag on the map to create a circular service area</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <PolygonIcon className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Polygon Zone</p>
                  <p className="text-gray-600">Click "Draw Polygon" and click multiple points to create a custom shaped area</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Test Location</p>
                  <p className="text-gray-600">Use "Test Location" to check if a random location is within service zones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Zone List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Existing Zones</h4>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {zones.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="text-4xl mb-2 block">🌍</span>
                  <p className="text-gray-600">No zones created yet</p>
                  <p className="text-sm text-gray-500 mt-1">Draw your first service zone on the map</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {zones.map((zone) => (
                    <div key={zone.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {zone.zone_type === 'circle' ? '🔵' : '🔺'}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{zone.name}</p>
                              <p className="text-sm text-gray-600">
                                ₹{zone.base_fare} base • ₹{zone.per_km_rate}/km
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            zone.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {zone.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleToggleZone(zone.id, zone.is_active)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            {zone.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEditZone(zone.id)}
                            className="text-blue-400 hover:text-blue-600 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Zone Creation Form Modal */}
      {showZoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900">
                Create {selectedZoneType === 'circle' ? 'Circle' : 'Polygon'} Zone
              </h4>
              <button
                onClick={cancelDrawing}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Hosur Bus Stand Area"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Fare (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_fare}
                    onChange={(e) => setFormData({...formData, base_fare: parseFloat(e.target.value)})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.base_fare ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.base_fare && <p className="text-red-500 text-sm mt-1">{errors.base_fare}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per KM Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.per_km_rate}
                    onChange={(e) => setFormData({...formData, per_km_rate: parseFloat(e.target.value)})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.per_km_rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.per_km_rate && <p className="text-red-500 text-sm mt-1">{errors.per_km_rate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surge Multiplier
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={formData.surge_multiplier}
                    onChange={(e) => setFormData({...formData, surge_multiplier: parseFloat(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-center">
                    {formData.surge_multiplier}x
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>2x</span>
                  <span>3x</span>
                </div>
              </div>

              {/* Zone Preview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Zone Preview</h5>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.name || 'Zone Name'}</div>
                  <div><span className="font-medium">Type:</span> {selectedZoneType === 'circle' ? '🔵 Circle' : '🔺 Polygon'}</div>
                  <div><span className="font-medium">Base Fare:</span> ₹{formData.base_fare}</div>
                  <div><span className="font-medium">Per KM:</span> ₹{formData.per_km_rate}</div>
                  <div><span className="font-medium">Surge:</span> {formData.surge_multiplier}x</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={cancelDrawing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveZone}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Zone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Area Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">Customer Booking Restrictions</h4>
            <div className="space-y-2 text-sm text-yellow-700">
              <p>• <strong>Inside Active Zones:</strong> Customers can book rides normally</p>
              <p>• <strong>Outside All Zones:</strong> Message displayed: "Sorry! We are not available here at this moment."</p>
              <p>• <strong>Inactive Zones:</strong> Treated as outside service area</p>
              <p>• <strong>Multiple Zones:</strong> Customer can book if inside ANY active zone</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">💡 Pro Tip:</p>
              <p className="text-xs text-yellow-700 mt-1">
                Use the "Test Location" button to verify zone coverage and customer booking availability
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZonesManagement;