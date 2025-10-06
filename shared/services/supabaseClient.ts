import { createClient } from '@supabase/supabase-js';

// This will be used by React Native apps
// Environment variables will be configured per app
export const createSupabaseClient = (supabaseUrl: string, supabaseAnonKey: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
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
};

// Shared helper functions
export const getCurrentUser = async (supabase: any) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (supabase: any, userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};