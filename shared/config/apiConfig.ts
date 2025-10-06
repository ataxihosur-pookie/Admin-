// API Configuration for all applications
export const API_CONFIG = {
  // Supabase configuration (same for all apps)
  supabase: {
    url: process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // API endpoints
  endpoints: {
    auth: {
      signIn: '/auth/v1/token?grant_type=password',
      signUp: '/auth/v1/signup',
      signOut: '/auth/v1/logout',
      refresh: '/auth/v1/token?grant_type=refresh_token'
    },
    users: '/rest/v1/users',
    drivers: '/rest/v1/drivers',
    vehicles: '/rest/v1/vehicles',
    vendors: '/rest/v1/vendors',
    rides: '/rest/v1/rides',
    payments: '/rest/v1/payments',
    liveLocations: '/rest/v1/live_locations'
  },
  
  // Real-time channels
  channels: {
    rideUpdates: 'ride_updates',
    driverLocations: 'driver_locations',
    notifications: 'notifications'
  },
  
  // Request configuration
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Environment-specific configurations
export const getApiConfig = (environment: 'web' | 'mobile') => {
  const baseConfig = API_CONFIG;
  
  if (environment === 'mobile') {
    return {
      ...baseConfig,
      supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      }
    };
  }
  
  return {
    ...baseConfig,
    supabase: {
      url: process.env.VITE_SUPABASE_URL,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    }
  };
};