import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Location update helper - ENHANCED VERSION
export const updateDriverLocation = async (locationData: {
  user_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}) => {
  try {
    console.log('📡 Sending location update to Supabase:', {
      user_id: locationData.user_id,
      lat: locationData.latitude.toFixed(6),
      lng: locationData.longitude.toFixed(6),
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/update-driver-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(locationData)
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('❌ Location update failed:', result.error);
      throw new Error(result.error || 'Failed to update location');
    }

    console.log('✅ Location update successful:', result.message);
    return result;
  } catch (error) {
    console.error('❌ Error updating driver location:', error);
    throw error;
  }
};

// Test location update function
export const testLocationUpdate = async (userId: string) => {
  try {
    // Send a test location in Hosur area
    const testLocation = {
      user_id: userId,
      latitude: 12.1266 + (Math.random() - 0.5) * 0.01, // Random location near Hosur
      longitude: 77.8308 + (Math.random() - 0.5) * 0.01,
      heading: Math.random() * 360,
      speed: Math.random() * 60,
      accuracy: 5 + Math.random() * 10
    };

    console.log('🧪 Sending test location update:', testLocation);
    
    const result = await updateDriverLocation(testLocation);
    console.log('✅ Test location update successful');
    return result;
  } catch (error) {
    console.error('❌ Test location update failed:', error);
    throw error;
  }
};