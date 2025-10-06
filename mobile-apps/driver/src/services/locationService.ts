import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export class LocationService {
  private isTracking = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private userId: string | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('📍 LocationService initialized');
  }

  // Start location tracking for a driver
  async startLocationTracking(userId: string): Promise<boolean> {
    try {
      console.log('🚀 Starting location tracking for user:', userId);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Location permission denied');
        return false;
      }

      // Request background location permissions for continuous tracking
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('⚠️ Background location permission denied - tracking will only work when app is open');
      }

      this.userId = userId;
      this.isTracking = true;

      // Start watching position with high accuracy
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      // Also start a backup interval to ensure updates every 10 seconds
      this.updateInterval = setInterval(async () => {
        if (this.isTracking && this.userId) {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation,
            });
            this.handleLocationUpdate(currentLocation);
          } catch (error) {
            console.error('❌ Error getting current location in interval:', error);
          }
        }
      }, 10000); // Every 10 seconds

      console.log('✅ Location tracking started successfully');
      return true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  async stopLocationTracking(): Promise<void> {
    try {
      console.log('🛑 Stopping location tracking');
      
      this.isTracking = false;
      
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      console.log('✅ Location tracking stopped');
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
    }
  }

  // Handle location updates
  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    if (!this.isTracking || !this.userId) {
      return;
    }

    try {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        accuracy: location.coords.accuracy || undefined
      };

      console.log('📍 Sending location update:', {
        user_id: this.userId,
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy,
        timestamp: new Date().toISOString()
      });

      // Send location to Supabase via Edge Function
      await this.sendLocationToServer(this.userId, locationData);
      
    } catch (error) {
      console.error('❌ Error handling location update:', error);
    }
  }

  // Send location data to server
  private async sendLocationToServer(userId: string, locationData: LocationData): Promise<void> {
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase configuration missing');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/update-driver-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          heading: locationData.heading,
          speed: locationData.speed,
          accuracy: locationData.accuracy
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Failed to update location on server:', result.error);
        return;
      }

      console.log('✅ Location updated on server successfully');
      
    } catch (error) {
      console.error('❌ Error sending location to server:', error);
    }
  }

  // Get current location once
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        accuracy: location.coords.accuracy || undefined
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  }

  // Check if tracking is active
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  // Get tracking status
  getTrackingStatus(): {
    isTracking: boolean;
    userId: string | null;
    hasSubscription: boolean;
    hasInterval: boolean;
  } {
    return {
      isTracking: this.isTracking,
      userId: this.userId,
      hasSubscription: this.locationSubscription !== null,
      hasInterval: this.updateInterval !== null
    };
  }

  // Force send current location (for testing)
  async forceSendLocation(): Promise<boolean> {
    if (!this.userId) {
      console.error('❌ No user ID set for location tracking');
      return false;
    }

    try {
      const currentLocation = await this.getCurrentLocation();
      if (currentLocation) {
        await this.sendLocationToServer(this.userId, currentLocation);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error force sending location:', error);
      return false;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();