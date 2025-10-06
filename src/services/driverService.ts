import { createClient } from '@supabase/supabase-js';

// Dedicated service for driver operations
export class DriverService {
  private supabase: any;
  private isConnected: boolean = false;

  constructor() {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.isConnected = true;
        console.log('✅ DriverService: Supabase connected successfully');
      } else {
        console.warn('⚠️ DriverService: Supabase credentials missing');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ DriverService: Failed to initialize Supabase:', error);
      this.isConnected = false;
    }
  }

  // Test Supabase connection
  async testConnection(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const { data, error } = await this.supabase.from('users').select('count').limit(1);
      if (error) throw error;
      console.log('✅ DriverService: Connection test passed');
      return true;
    } catch (error) {
      console.error('❌ DriverService: Connection test failed:', error);
      return false;
    }
  }

  // Create driver using edge function (bypasses RLS)
  async createDriverViaEdgeFunction(driverData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Supabase not connected. Please check your environment variables.');
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(driverData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ DriverService: Driver created via edge function:', result);
      return result;
    } catch (error) {
      console.error('❌ DriverService: Edge function failed:', error);
      throw error;
    }
  }

  // Fallback: Create driver directly (for testing)
  async createDriverDirect(driverData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: driverData.email,
        password: driverData.password,
      });

      if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
      if (!authData.user) throw new Error('No user returned from auth signup');

      console.log('✅ Auth user created:', authData.user.id);

      // Step 2: Create driver profile
      const { data: driverRecord, error: driverError } = await this.supabase
        .from('drivers')
        .insert({
          user_id: authData.user.id,
          license_number: driverData.licenseNumber,
          license_expiry: driverData.licenseExpiry,
          status: 'offline',
          is_verified: false,
          rating: 5.0,
          total_rides: 0
        })
        .select()
        .single();

      if (driverError) throw new Error(`Driver profile creation failed: ${driverError.message}`);
      console.log('✅ Driver profile created:', driverRecord);

      return {
        success: true,
        driver: driverRecord,
        user: authData.user,
        username: driverData.username
      };
    } catch (error) {
      console.error('❌ DriverService: Direct creation failed:', error);
      throw error;
    }
  }

  // Main create driver method with multiple strategies
  async createDriver(driverData: any): Promise<any> {
    console.log('🚀 DriverService: Starting driver creation process...');
    
    // Strategy 1: Try edge function first (recommended)
    try {
      console.log('📡 Attempting edge function creation...');
      const result = await this.createDriverViaEdgeFunction(driverData);
      console.log('✅ Driver created successfully via edge function');
      return result;
    } catch (edgeError) {
      console.warn('⚠️ Edge function failed, trying direct method:', edgeError);
      
      // Strategy 2: Fallback to direct creation
      try {
        console.log('🔄 Attempting direct creation...');
        const result = await this.createDriverDirect(driverData);
        console.log('✅ Driver created successfully via direct method');
        return result;
      } catch (directError) {
        console.error('❌ Both methods failed');
        throw new Error(`Driver creation failed: ${directError.message}`);
      }
    }
  }

  // Fetch all drivers with proper error handling
  async fetchDrivers(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ DriverService: Using mock data (Supabase not connected)');
      return this.getMockDrivers();
    }

    try {
      console.log('📡 DriverService: Fetching drivers from Supabase...');
      
      const { data, error } = await this.supabase
        .from('drivers')
        .select(`
          *,
          users!drivers_user_id_fkey(
            full_name,
            email,
            phone_number
          ),
          vehicles!fk_drivers_vehicle(
            registration_number,
            make,
            model
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ DriverService: Query error:', error);
        throw error;
      }
      
      console.log(`✅ DriverService: Fetched ${data?.length || 0} drivers`);
      return data || [];
    } catch (error) {
      console.error('❌ DriverService: Fetch failed, using mock data:', error);
      return this.getMockDrivers();
    }
  }

  // Mock data for fallback
  private getMockDrivers() {
    return [
      {
        id: 'mock-1',
        user_id: 'mock-user-1',
        license_number: 'DL123456789',
        license_expiry: '2025-12-31',
        status: 'online',
        rating: 4.8,
        total_rides: 45,
        is_verified: true,
        created_at: new Date().toISOString(),
        users: {
          full_name: 'Mock Driver',
          email: 'mock@example.com',
          phone_number: '+91 98765 43210'
        },
        vehicles: {
          registration_number: 'KA 01 AB 1234',
          make: 'Maruti',
          model: 'Swift'
        }
      }
    ];
  }
}

// Export singleton instance
export const driverService = new DriverService();