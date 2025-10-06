import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

// Supabase client with error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
let isSupabaseConnected = false;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isSupabaseConnected = true;
    console.log('✅ Supabase connected successfully');
  } else {
    console.warn('⚠️ Supabase environment variables missing:');
    console.warn('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  }
} catch (error) {
  console.error('❌ Supabase initialization failed:', error);
}

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing Supabase session
  useEffect(() => {
    const checkSession = async () => {
      if (supabase && isSupabaseConnected) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('⚠️ Session check error:', error);
            setLoading(false);
            return;
          }
          
          if (session?.user) {
            console.log('✅ Found existing session');
            // Fetch user profile from users table
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('id, email, role, full_name')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.warn('⚠️ Could not fetch user profile:', profileError);
              // Use session data as fallback
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'admin',
                full_name: 'Admin User'
              });
            } else {
              setUser(userProfile);
            }
          }
        } catch (error) {
          console.warn('⚠️ Session check failed:', error);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (supabase && isSupabaseConnected) {
        try {
          console.log('🔐 Attempting Supabase authentication...');
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) {
            console.error('❌ Supabase auth error:', error);
            throw error;
          }
          console.log('✅ Supabase authentication successful');
          
          // Fetch user profile from users table
          if (data.user) {
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('id, email, role, full_name')
              .eq('id', data.user.id)
              .single();
            
            if (profileError) {
              console.warn('⚠️ Could not fetch user profile:', profileError);
              // Use auth data as fallback
              setUser({
                id: data.user.id,
                email: email,
                role: 'admin',
                full_name: 'Admin User'
              });
            } else {
              setUser(userProfile);
            }
            return;
          }
        } catch (authError) {
          console.warn('⚠️ Supabase auth failed, falling back to mock login:', authError);
          // Fall back to mock login if Supabase is unreachable
          if (email === 'admin@taxiapp.com' && password === 'admin123') {
            console.log('✅ Mock login successful');
            setUser({
              id: crypto.randomUUID(),
              email: email,
              role: 'admin',
              full_name: 'Admin User'
            });
            return;
          } else {
            throw new Error('Invalid credentials. Please use admin@taxiapp.com / admin123 or check your Supabase connection.');
          }
        }
      } else {
        console.log('⚠️ Supabase not connected, using mock authentication');
        // Mock login for demo
        if (email === 'admin@taxiapp.com' && password === 'admin123') {
          console.log('✅ Mock login successful');
          setUser({
            id: crypto.randomUUID(),
            email: email,
            role: 'admin',
            full_name: 'Admin User'
          });
        } else {
          throw new Error('Invalid credentials. Please use admin@taxiapp.com / admin123');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (supabase && isSupabaseConnected) {
        await supabase.auth.signOut();
      }
      setUser(null);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Signout error:', error);
      // Still clear user state even if Supabase signout fails
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} />;
  }

  return <Dashboard user={user} onSignOut={signOut} supabase={supabase} />;
}

export default App;