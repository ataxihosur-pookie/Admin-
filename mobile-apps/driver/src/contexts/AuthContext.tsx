import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { User } from '../../../shared/types';
import { locationService } from '../services/locationService';

interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  status: string;
  rating: number;
  total_rides: number;
  is_verified: boolean;
  vehicle?: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    year: number;
    color: string;
    vehicle_type: string;
  };
}

interface AuthContextType {
  user: User | null;
  driver: Driver | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDriverStatus: (status: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    checkStoredSession();
  }, []);

  const checkStoredSession = async () => {
    try {
      // Check if we have stored credentials
      const storedUserId = localStorage.getItem('driver_user_id');
      const storedUsername = localStorage.getItem('driver_username');
      
      if (storedUserId && storedUsername) {
        console.log('🔍 Found stored session, verifying...');
        await verifyStoredSession(storedUserId);
      }
    } catch (error) {
      console.error('❌ Error checking stored session:', error);
      clearStoredSession();
    } finally {
      setLoading(false);
    }
  };

  const verifyStoredSession = async (userId: string) => {
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/driver-auth/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ user_id: userId })
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        setDriver(result.driver);
        console.log('✅ Session verified successfully');
      } else {
        throw new Error('Session invalid');
      }
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      clearStoredSession();
    }
  };

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Driver authentication attempt:', { username });

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Call the driver authentication edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/driver-auth/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          identifier: username,
          password: password
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      console.log('✅ Driver authentication successful:', result.user.full_name);

      // Store session data
      localStorage.setItem('driver_user_id', result.user.id);
      localStorage.setItem('driver_username', result.credentials.username);

      // Set state
      setUser(result.user);
      setDriver(result.driver);

    } catch (error) {
      console.error('❌ Driver authentication failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Update driver status to offline before signing out
      if (driver) {
        await updateDriverStatus('offline');
        // Stop location tracking
        await locationService.stopLocationTracking();
      }
      
      clearStoredSession();
      setUser(null);
      setDriver(null);
      
      console.log('✅ Driver signed out successfully');
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Still clear local session even if server update fails
      clearStoredSession();
      setUser(null);
      setDriver(null);
    }
  };

  const updateDriverStatus = async (status: string) => {
    if (!driver) return;

    try {
      console.log(`🔄 Updating driver status to: ${status}`);
      
      // Handle location tracking based on status
      if (status === 'online') {
        console.log('🟢 Driver going online - starting location tracking');
        const trackingStarted = await locationService.startLocationTracking(driver.user_id);
        if (!trackingStarted) {
          console.error('❌ Failed to start location tracking');
          throw new Error('Failed to start location tracking. Please check location permissions.');
        }
        console.log('✅ Location tracking started successfully');
      } else if (status === 'offline') {
        console.log('🔴 Driver going offline - stopping location tracking');
        await locationService.stopLocationTracking();
        console.log('✅ Location tracking stopped successfully');
      }

      // Update driver status in database
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.id);

      if (error) {
        console.error('❌ Error updating driver status in database:', error);
        throw error;
      }

      // Update local driver state
      setDriver(prev => prev ? { ...prev, status } : null);
      
      console.log(`✅ Driver status updated to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating driver status:', error);
      throw error;
    }
  };

  const clearStoredSession = () => {
    localStorage.removeItem('driver_user_id');
    localStorage.removeItem('driver_username');
  };

  return (
    <AuthContext.Provider value={{
      user,
      driver,
      loading,
      signIn,
      signOut,
      updateDriverStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};