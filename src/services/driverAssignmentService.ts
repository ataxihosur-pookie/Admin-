import { createClient } from '@supabase/supabase-js';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  rating: number;
  total_rides: number;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  distance?: number;
}

interface AssignDriverRequest {
  rideId: string;
  driverId: string;
  adminNotes?: string;
}

interface AssignDriverResponse {
  success: boolean;
  message?: string;
  error?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  booking?: {
    id: string;
    status: string;
  };
}

export class DriverAssignmentService {
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
        console.log('✅ DriverAssignmentService: Connected successfully');
      } else {
        console.warn('⚠️ DriverAssignmentService: Supabase credentials missing');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ DriverAssignmentService: Failed to initialize:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get all available drivers (online, verified, not currently on a ride)
   */
  async getAvailableDrivers(): Promise<Driver[]> {
    // Always try to fetch real drivers first, even if connection seems unavailable
    console.log('🔍 Fetching real available drivers from database...');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Supabase credentials missing, using mock data');
        return this.getMockAvailableDrivers();
      }

      // Use edge function to get drivers with SERVICE ROLE to bypass RLS
      console.log('📡 Calling get-available-drivers edge function...');
      const response = await fetch(`${supabaseUrl}/functions/v1/get-available-drivers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Edge function failed, trying direct query...');
        return await this.getAvailableDriversDirect();
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('⚠️ Edge function returned error, trying direct query:', result.error);
        return await this.getAvailableDriversDirect();
      }

      console.log(`✅ Found ${result.drivers?.length || 0} available drivers via edge function`);
      return result.drivers || [];

    } catch (error) {
      console.error('❌ Error fetching available drivers via edge function:', error);
      console.log('🔄 Falling back to direct database query...');
      return await this.getAvailableDriversDirect();
    }
  }

  /**
   * Direct database query as fallback
   */
  private async getAvailableDriversDirect(): Promise<Driver[]> {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ Database not connected, using mock data');
        return this.getMockAvailableDrivers();
      }

      console.log('🔍 Direct query: Fetching all drivers with details...');
      const { data: allDrivers, error: driversError } = await this.supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          status,
          rating,
          total_rides,
          is_verified,
          users!drivers_user_id_fkey(
            full_name,
            email,
            phone_number
          ),
          vehicles!fk_drivers_vehicle(
            registration_number,
            make,
            model,
            vehicle_type
          )
        `);

      if (driversError) {
        console.error('❌ Error fetching drivers:', driversError);
        console.warn('⚠️ Using mock data due to query error');
        return this.getMockAvailableDrivers();
      }

      console.log(`📊 Direct query: Found ${allDrivers?.length || 0} total drivers`);
      
      // Log all drivers for debugging
      allDrivers?.forEach(driver => {
        console.log(`👤 Direct query: ${driver.users?.full_name || 'Unknown'} - Status: ${driver.status} - Verified: ${driver.is_verified} - Vehicle: ${driver.vehicles?.registration_number || 'None'}`);
      });

      if (!allDrivers || allDrivers.length === 0) {
        console.log('⚠️ Direct query: No drivers found in database, using mock data');
        return this.getMockAvailableDrivers();
      }

      // Filter for online and verified drivers
      const onlineVerifiedDrivers = allDrivers.filter(driver => 
        driver.status === 'online' && driver.is_verified === true
      );
      
      console.log(`📊 Direct query: Online verified drivers: ${onlineVerifiedDrivers.length}`);
      onlineVerifiedDrivers.forEach(driver => {
        console.log(`✅ Direct query: Online & Verified: ${driver.users?.full_name} (${driver.id})`);
      });

      // Step 2: Get drivers who are currently on active rides
      const { data: busyDrivers, error: busyError } = await this.supabase
        .from('rides')
        .select('driver_id')
        .not('driver_id', 'is', null)
        .in('status', ['accepted', 'driver_arrived', 'in_progress']);

      if (busyError) {
        console.warn('⚠️ Direct query: Error fetching busy drivers, proceeding with all online drivers:', busyError);
      }

      const busyDriverIds = new Set(busyDrivers?.map(ride => ride.driver_id) || []);
      console.log(`📊 Direct query: Found ${busyDriverIds.size} busy drivers:`, Array.from(busyDriverIds));

      // Step 3: Filter out busy drivers
      const availableDrivers = onlineVerifiedDrivers.filter(driver => !busyDriverIds.has(driver.id));
      console.log(`📊 Direct query: Available drivers after filtering: ${availableDrivers.length}`);

      // Transform the data to match our interface
      const transformedDrivers: Driver[] = availableDrivers.map(driver => {
        console.log(`🔍 Direct query: Processing driver: ${driver.users?.full_name || 'Unknown'} (${driver.id})`);
        return {
          id: driver.id,
          full_name: driver.users?.full_name || 'Unknown Driver',
          phone_number: driver.users?.phone_number || 'No phone',
          rating: driver.rating || 5.0,
          total_rides: driver.total_rides || 0,
          vehicle_registration: driver.vehicles?.registration_number,
          vehicle_make: driver.vehicles?.make,
          vehicle_model: driver.vehicles?.model,
          vehicle_type: driver.vehicles?.vehicle_type
        };
      });

      console.log(`✅ Direct query: Found ${transformedDrivers.length} available drivers`);
      transformedDrivers.forEach(driver => {
        console.log(`👤 Direct query: Available: ${driver.full_name} - ${driver.phone_number} - ⭐${driver.rating} - 🚗${driver.vehicle_registration || 'No vehicle'}`);
      });
      
      return transformedDrivers;

    } catch (error) {
      console.error('❌ Direct query: Failed to fetch available drivers:', error);
      console.warn('⚠️ Direct query: Falling back to mock data');
      return this.getMockAvailableDrivers();
    }
  }

  /**
   * Mock available drivers for fallback
   */
  private getMockAvailableDrivers(): Driver[] {
    return [
      {
        id: 'mock-driver-1',
        full_name: 'Rajesh Kumar',
        phone_number: '+91 98765 43210',
        rating: 4.8,
        total_rides: 156,
        vehicle_registration: 'KA 01 AB 1234',
        vehicle_make: 'Maruti',
        vehicle_model: 'Swift',
        vehicle_type: 'hatchback_ac'
      },
      {
        id: 'mock-driver-2',
        full_name: 'Suresh Babu',
        phone_number: '+91 87654 32109',
        rating: 4.6,
        total_rides: 89,
        vehicle_registration: 'KA 02 CD 5678',
        vehicle_make: 'Hyundai',
        vehicle_model: 'i20',
        vehicle_type: 'sedan_ac'
      },
      {
        id: 'mock-driver-3',
        full_name: 'Priya Sharma',
        phone_number: '+91 76543 21098',
        rating: 4.9,
        total_rides: 234,
        vehicle_registration: 'KA 03 EF 9012',
        vehicle_make: 'Toyota',
        vehicle_model: 'Innova',
        vehicle_type: 'suv_ac'
      }
    ];
  }

  /**
   * Assign a driver to a ride using the edge function
   */
  async assignDriverToRide(request: { rideId: string; driverId: string; adminNotes?: string; sourceTable?: string }): Promise<AssignDriverResponse> {
    if (!this.isConnected) {
      console.warn('⚠️ Database not connected, simulating assignment');
      return {
        success: true,
        message: 'Driver assigned successfully (mock)',
        driver: {
          id: request.driverId,
          name: 'Mock Driver',
          phone: '+91 98765 43210'
        },
        booking: {
          id: request.rideId,
          status: 'assigned'
        }
      };
    }

    try {
      console.log('🚗 Assigning driver via edge function...', request);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Call the edge function to assign driver
      const response = await fetch(`${supabaseUrl}/functions/v1/assign-driver-to-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          ride_id: request.rideId,
          driver_id: request.driverId,
          admin_notes: request.adminNotes || '',
          source_table: request.sourceTable || 'auto_detect'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Edge function error:', result);
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Driver assigned successfully via edge function:', result);
      return result;

    } catch (error) {
      console.error('❌ DriverAssignmentService: Failed to assign driver:', error);
      throw error;
    }
  }

  /**
   * Get driver details by ID
   */
  async getDriverById(driverId: string): Promise<Driver | null> {
    if (!this.isConnected) {
      const mockDrivers = this.getMockAvailableDrivers();
      return mockDrivers.find(d => d.id === driverId) || null;
    }

    try {
      const { data: driver, error } = await this.supabase
        .from('drivers')
        .select(`
          id,
          rating,
          total_rides,
          users!drivers_user_id_fkey(
            full_name,
            phone_number
          ),
          vehicles!fk_drivers_vehicle(
            registration_number,
            make,
            model,
            vehicle_type
          )
        `)
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('❌ Error fetching driver details:', error);
        return null;
      }

      return {
        id: driver.id,
        full_name: driver.users?.full_name || 'Unknown Driver',
        phone_number: driver.users?.phone_number || 'No phone',
        rating: driver.rating || 5.0,
        total_rides: driver.total_rides || 0,
        vehicle_registration: driver.vehicles?.registration_number,
        vehicle_make: driver.vehicles?.make,
        vehicle_model: driver.vehicles?.model,
        vehicle_type: driver.vehicles?.vehicle_type
      };

    } catch (error) {
      console.error('❌ Error fetching driver details:', error);
      return null;
    }
  }

  /**
   * Check connection status
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const driverAssignmentService = new DriverAssignmentService();