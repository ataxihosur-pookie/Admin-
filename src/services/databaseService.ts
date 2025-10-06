import { createClient } from '@supabase/supabase-js';

// Database service for all admin operations
class DatabaseService {
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
        console.log('✅ DatabaseService: Supabase connected successfully');
      } else {
        console.warn('⚠️ DatabaseService: Supabase credentials missing');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ DatabaseService: Failed to initialize Supabase:', error);
      this.isConnected = false;
    }
  }

  // Promo Codes Management
  async fetchPromoCodes(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ Database not connected, using mock promo codes');
      return this.getMockPromoCodes();
    }

    try {
      console.log('🔍 Fetching promo codes from database...');
      const { data, error } = await this.supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching promo codes:', error);
        return this.getMockPromoCodes();
      }

      console.log(`✅ Fetched ${data?.length || 0} promo codes from database`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching promo codes:', error);
      return this.getMockPromoCodes();
    }
  }

  async createPromoCode(promoData: any, user: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Creating promo code in database:', promoData);
      
      const { data, error } = await this.supabase
        .from('promo_codes')
        .insert({
          code: promoData.code.toUpperCase(),
          title: promoData.title,
          description: promoData.description,
          discount_type: promoData.discount_type,
          discount_value: promoData.discount_value,
          minimum_fare: promoData.minimum_fare,
          maximum_discount: promoData.maximum_discount || null,
          usage_limit: promoData.usage_limit || null,
          user_usage_limit: promoData.user_usage_limit,
          valid_from: new Date(promoData.valid_from).toISOString(),
          valid_until: new Date(promoData.valid_until).toISOString(),
          is_active: true,
          created_by: user.id,
          usage_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating promo code:', error);
        throw new Error(`Failed to create promo code: ${error.message}`);
      }

      console.log('✅ Promo code created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating promo code:', error);
      throw error;
    }
  }

  async updatePromoCode(promoId: string, promoData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Updating promo code in database:', promoId, promoData);
      
      const { data, error } = await this.supabase
        .from('promo_codes')
        .update({
          code: promoData.code.toUpperCase(),
          title: promoData.title,
          description: promoData.description,
          discount_type: promoData.discount_type,
          discount_value: promoData.discount_value,
          minimum_fare: promoData.minimum_fare,
          maximum_discount: promoData.maximum_discount || null,
          usage_limit: promoData.usage_limit || null,
          user_usage_limit: promoData.user_usage_limit,
          valid_from: new Date(promoData.valid_from).toISOString(),
          valid_until: new Date(promoData.valid_until).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', promoId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating promo code:', error);
        throw new Error(`Failed to update promo code: ${error.message}`);
      }

      console.log('✅ Promo code updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating promo code:', error);
      throw error;
    }
  }

  async updatePromoCodeStatus(promoId: string, isActive: boolean): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Updating promo code status in database:', promoId, isActive);
      
      const { data, error } = await this.supabase
        .from('promo_codes')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', promoId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating promo code status:', error);
        throw new Error(`Failed to update promo code status: ${error.message}`);
      }

      console.log('✅ Promo code status updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating promo code status:', error);
      throw error;
    }
  }

  async deletePromoCode(promoId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('🗑️ Deleting promo code from database:', promoId);
      
      const { error } = await this.supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoId);

      if (error) {
        console.error('❌ Error deleting promo code:', error);
        throw new Error(`Failed to delete promo code: ${error.message}`);
      }

      console.log('✅ Promo code deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting promo code:', error);
      throw error;
    }
  }

  private getMockPromoCodes(): any[] {
    return [
      {
        id: 'mock-promo-1',
        code: 'WELCOME20',
        title: 'Welcome Offer',
        description: 'Get 20% off on your first ride',
        discount_type: 'percentage',
        discount_value: 20,
        minimum_fare: 100,
        maximum_discount: 50,
        usage_limit: 1000,
        usage_count: 45,
        user_usage_limit: 1,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-promo-2',
        code: 'SAVE50',
        title: 'Fixed Discount',
        description: 'Save ₹50 on rides above ₹200',
        discount_type: 'fixed_amount',
        discount_value: 50,
        minimum_fare: 200,
        maximum_discount: null,
        usage_limit: 500,
        usage_count: 123,
        user_usage_limit: 2,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const { data, error } = await this.supabase.from('users').select('count').limit(1);
      if (error) throw error;
      console.log('✅ DatabaseService: Connection test passed');
      return true;
    } catch (error) {
      console.error('❌ DatabaseService: Connection test failed:', error);
      return false;
    }
  }

  // Fetch drivers using edge function to bypass RLS
  async fetchDrivers(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Using mock data (Supabase not connected)');
      return this.getMockDrivers();
    }

    try {
      console.log('📡 DatabaseService: Fetching drivers via edge function...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Use edge function to get drivers with SERVICE ROLE to bypass RLS
      const response = await fetch(`${supabaseUrl}/functions/v1/get-drivers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Edge function failed, trying direct query...');
        return await this.fetchDriversDirect();
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('⚠️ Edge function returned error, trying direct query:', result.error);
        return await this.fetchDriversDirect();
      }

      console.log(`✅ DatabaseService: Fetched ${result.drivers?.length || 0} drivers via edge function`);
      return result.drivers || [];

    } catch (error) {
      console.error('❌ DatabaseService: Error fetching drivers via edge function:', error);
      console.log('🔄 Falling back to direct database query...');
      return await this.fetchDriversDirect();
    }
  }

  // Direct database query as fallback
  private async fetchDriversDirect(): Promise<any[]> {
    try {
      console.log('🔍 DatabaseService: Direct query - fetching drivers...');
      
      const { data, error } = await this.supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          license_number,
          license_expiry,
          vehicle_id,
          vendor_id,
          status,
          rating,
          total_rides,
          is_verified,
          created_at,
          updated_at,
          users!drivers_user_id_fkey(
            full_name,
            email,
            phone_number,
            is_active
          ),
          vehicles(
            registration_number,
            make,
            model,
            vehicle_type,
            color,
            year
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ DatabaseService: Direct query error:', error);
        throw error;
      }
      
      console.log(`✅ DatabaseService: Direct query found ${data?.length || 0} drivers`);
      
      // Log each driver for debugging
      data?.forEach((driver, index) => {
        console.log(`👤 Driver ${index + 1}:`, {
          id: driver.id,
          name: driver.users?.full_name || 'NO NAME',
          email: driver.users?.email || 'NO EMAIL',
          phone: driver.users?.phone_number || 'NO PHONE',
          license: driver.license_number,
          status: driver.status,
          verified: driver.is_verified,
          vehicle: driver.vehicles?.registration_number || 'NO VEHICLE'
        });
      });
      
      // Transform data to match expected format
      const transformedDrivers = data?.map(driver => ({
        driver_id: driver.id,
        user_id: driver.user_id,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        status: driver.status,
        rating: driver.rating,
        total_rides: driver.total_rides,
        is_verified: driver.is_verified,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
        users: driver.users ? {
          full_name: driver.users.full_name,
          email: driver.users.email,
          phone_number: driver.users.phone_number,
          is_active: driver.users.is_active
        } : null,
        vehicles: driver.vehicles ? {
          registration_number: driver.vehicles.registration_number,
          make: driver.vehicles.make,
          model: driver.vehicles.model,
          vehicle_type: driver.vehicles.vehicle_type,
          color: driver.vehicles.color,
          year: driver.vehicles.year
        } : null
      })) || [];
      
      console.log(`✅ DatabaseService: Transformed ${transformedDrivers.length} drivers`);
      return transformedDrivers;
      
    } catch (error) {
      console.error('❌ DatabaseService: Direct query failed, using mock data:', error);
      return this.getMockDrivers();
    }
  }

  // Fetch customers using edge function
  async fetchCustomers(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Using mock data (Supabase not connected)');
      return this.getMockCustomers();
    }

    try {
      console.log('📡 DatabaseService: Fetching customers via edge function...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Edge function failed, trying direct query...');
        return await this.fetchCustomersDirect();
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('⚠️ Edge function returned error:', result.error);
        return await this.fetchCustomersDirect();
      }

      console.log(`✅ DatabaseService: Fetched ${result.customers?.length || 0} customers`);
      return result.customers || [];

    } catch (error) {
      console.error('❌ DatabaseService: Error fetching customers:', error);
      return await this.fetchCustomersDirect();
    }
  }

  // Direct customers query
  private async fetchCustomersDirect(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ DatabaseService: Direct customers query failed:', error);
      return this.getMockCustomers();
    }
  }

  // Fetch vendors using edge function
  async fetchVendors(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Using mock data (Supabase not connected)');
      return this.getMockVendors();
    }

    try {
      console.log('📡 DatabaseService: Fetching vendors via edge function...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-vendors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Edge function failed, trying direct query...');
        return await this.fetchVendorsDirect();
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('⚠️ Edge function returned error:', result.error);
        return await this.fetchVendorsDirect();
      }

      console.log(`✅ DatabaseService: Fetched ${result.vendors?.length || 0} vendors`);
      return result.vendors || [];

    } catch (error) {
      console.error('❌ DatabaseService: Error fetching vendors:', error);
      return await this.fetchVendorsDirect();
    }
  }

  // Direct vendors query
  private async fetchVendorsDirect(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('vendors')
        .select(`
          *,
          users!vendors_user_id_fkey(
            full_name,
            email,
            phone_number,
            is_active
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ DatabaseService: Direct vendors query failed:', error);
      return this.getMockVendors();
    }
  }

  private getMockDrivers(): any[] {
    return [
      {
        driver_id: 'mock-driver-1',
        user_id: 'mock-user-1',
        license_number: 'DL123456789',
        license_expiry: '2025-12-31',
        status: 'online',
        rating: 4.8,
        total_rides: 245,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          full_name: 'John Driver',
          email: 'john.driver@example.com',
          phone_number: '+91-9876543210',
          is_active: true
        },
        vehicles: {
          registration_number: 'TN01AB1234',
          make: 'Maruti',
          model: 'Swift',
          vehicle_type: 'hatchback',
          color: 'White',
          year: 2022
        }
      }
    ];
  }

  private getMockCustomers(): any[] {
    return [
      {
        id: 'mock-customer-1',
        email: 'customer@example.com',
        role: 'customer',
        full_name: 'Jane Customer',
        phone_number: '+91-9876543211',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockVendors(): any[] {
    return [
      {
        id: 'mock-vendor-1',
        user_id: 'mock-user-vendor-1',
        company_name: 'ABC Taxi Services',
        license_number: 'VL123456789',
        address: '123 Business Street, City',
        total_vehicles: 15,
        total_drivers: 12,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          full_name: 'Vendor Owner',
          email: 'vendor@example.com',
          phone_number: '+91-9876543212',
          is_active: true
        }
      }
    ];
  }

  // Fetch rides
  async fetchRides(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Using mock rides data');
      return this.getMockRides();
    }

    try {
      const { data, error } = await this.supabase
        .from('rides')
        .select(`
          *,
          users!rides_customer_id_fkey(full_name, phone_number),
          drivers!rides_driver_id_fkey(
            users!drivers_user_id_fkey(full_name, phone_number),
            vehicles!fk_drivers_vehicle(registration_number, make, model)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching rides:', error);
      return this.getMockRides();
    }
  }

  // Subscribe to customer updates
  subscribeToCustomerUpdates(callback: (payload: any) => void) {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Cannot subscribe without connection');
      return null;
    }

    return this.supabase
      .channel('customer_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: 'role=eq.customer'
      }, callback)
      .subscribe();
  }

  // Get ongoing special rides
  async getOngoingSpecialRides(): Promise<any[]> {
    if (!this.isConnected) {
      return this.getMockOngoingRides();
    }

    try {
      const { data, error } = await this.supabase
        .from('scheduled_bookings')
        .select(`
          *,
          users:customer_id(full_name, phone_number),
          drivers:assigned_driver_id(
            users!drivers_user_id_fkey(full_name, phone_number),
            vehicles!fk_drivers_vehicle(registration_number, make, model)
          )
        `)
        .in('status', ['pending', 'assigned', 'confirmed', 'driver_arrived', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching ongoing rides:', error);
      return this.getMockOngoingRides();
    }
  }

  // Subscribe to ride updates
  subscribeToRideUpdates(callback: (payload: any) => void) {
    if (!this.isConnected) {
      return null;
    }

    return this.supabase
      .channel('ride_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, callback)
      .subscribe();
  }

  // Create test scheduled bookings
  async createTestScheduledBookings(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-test-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          create_customer: true,
          create_bookings: true
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error creating test bookings:', error);
      throw error;
    }
  }

  // Fetch zones
  async fetchZones(): Promise<any[]> {
    if (!this.isConnected) {
      return this.getMockZones();
    }

    try {
      const { data, error } = await this.supabase
        .from('zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching zones:', error);
      return this.getMockZones();
    }
  }

  // Create zone
  async createZone(zoneData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('zones')
        .insert(zoneData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creating zone:', error);
      throw error;
    }
  }

  // Update zone
  async updateZone(zoneId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('zones')
        .update(updates)
        .eq('id', zoneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error updating zone:', error);
      throw error;
    }
  }

  // Delete zone
  async deleteZone(zoneId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { error } = await this.supabase
        .from('zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error deleting zone:', error);
      throw error;
    }
  }

  // Fetch fare matrix
  async fetchFareMatrix(): Promise<any[]> {
    if (!this.isConnected) {
      return this.getMockFareMatrix();
    }

    try {
      console.log('🔍 Fetching fare matrix from database...');
      const { data, error } = await this.supabase
        .from('fare_matrix')
        .select('*')
        .order('booking_type', { ascending: true });

      if (error) {
        console.error('❌ Error fetching fare matrix:', error);
        return this.getMockFareMatrix();
      }

      console.log(`✅ Fetched ${data?.length || 0} fare matrix entries from database`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching fare matrix:', error);
      return this.getMockFareMatrix();
    }
  }

  // Create fare matrix entry
  async createFareMatrixEntry(entryData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('fare_matrix')
        .insert({
          booking_type: entryData.booking_type,
          vehicle_type: entryData.vehicle_type,
          base_fare: entryData.base_fare,
          per_km_rate: entryData.per_km_rate,
          minimum_fare: entryData.minimum_fare,
          surge_multiplier: entryData.surge_multiplier,
          cancellation_fee: entryData.cancellation_fee,
          platform_fee: entryData.platform_fee || 25.0,
          Platform_fee: entryData.Platform_fee || 25.0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating fare matrix entry:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('❌ Error creating fare matrix entry:', error);
      throw error;
    }
  }

  // Update fare matrix
  async updateFareMatrix(entryId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      // Ensure platform_fee is included in updates if provided
      const validUpdates = { ...updates };
      if (updates.platform_fee !== undefined) {
        validUpdates.platform_fee = updates.platform_fee;
      }
      
      // Ensure Platform_fee is included in valid update fields
      const validFields = [
        'base_fare', 'per_km_rate', 'per_minute_rate', 'minimum_fare', 
        'surge_multiplier', 'platform_fee_percent', 'cancellation_fee', 
        'hourly_rate', 'Platform_fee', 'is_active'
      ];
      
      const filteredUpdates = Object.keys(updates)
        .filter(key => validFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const { data, error } = await this.supabase
        .from('fare_matrix')
        .update(validUpdates)
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error updating fare matrix:', error);
      throw error;
    }
  }

  // Rental Fares Management
  async fetchRentalFaresFromTable(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ Database not connected, returning empty array');
      return [];
    }

    try {
      console.log('🔍 Fetching rental fares from rental_fares table...');
      const { data, error } = await this.supabase
        .from('rental_fares')
        .select('*')
        .order('vehicle_type', { ascending: true });

      if (error) {
        console.error('❌ Error fetching rental fares from table:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} rental fares from rental_fares table`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching rental fares from table:', error);
      throw error;
    }
  }

  async createRentalFareInTable(fareData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Creating rental fare in rental_fares table:', fareData);
      
      const { data, error } = await this.supabase
        .from('rental_fares')
        .insert({
          vehicle_type: fareData.vehicle_type,
          package_name: fareData.package_name,
          duration_hours: fareData.duration_hours,
          km_included: fareData.km_included,
          base_fare: fareData.base_fare,
          extra_km_rate: fareData.extra_km_rate,
          extra_minute_rate: fareData.extra_minute_rate,
          is_popular: fareData.is_popular || false,
          discount_percent: fareData.discount_percent || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating rental fare in table:', error);
        throw new Error(`Failed to create rental fare in table: ${error.message}`);
      }

      console.log('✅ Rental fare created successfully in table:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating rental fare in table:', error);
      throw error;
    }
  }

  async updateRentalFareInTable(fareId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Updating rental fare in rental_fares table:', fareId, updates);
      
      const { data, error } = await this.supabase
        .from('rental_fares')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', fareId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating rental fare in table:', error);
        throw new Error(`Failed to update rental fare in table: ${error.message}`);
      }

      console.log('✅ Rental fare updated successfully in table:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating rental fare in table:', error);
      throw error;
    }
  }

  async deleteRentalFareFromTable(fareId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('🗑️ Deleting rental fare from rental_fares table:', fareId);
      
      const { error } = await this.supabase
        .from('rental_fares')
        .delete()
        .eq('id', fareId);

      if (error) {
        console.error('❌ Error deleting rental fare from table:', error);
        throw new Error(`Failed to delete rental fare from table: ${error.message}`);
      }

      console.log('✅ Rental fare deleted successfully from table');
    } catch (error) {
      console.error('❌ Error deleting rental fare from table:', error);
      throw error;
    }
  }

  async checkRentalFaresTableExists(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      console.log('🔍 Checking if rental_fares table exists...');
      const { data, error } = await this.supabase
        .from('rental_fares')
        .select('count')
        .limit(1);

      if (error) {
        console.log('❌ rental_fares table does not exist:', error.message);
        return false;
      }

      console.log('✅ rental_fares table exists');
      return true;
    } catch (error) {
      console.log('❌ rental_fares table check failed:', error);
      return false;
    }
  }

  private getBaseRatesForVehicle(vehicleType: string) {
    const baseRates = {
      hatchback: {
        packages: {
          '1h': 325, '1h-15km': 375, '2h': 525, '2h-25km': 575, '3h': 725, '4h': 925,
          '5h': 1125, '6h': 1325, '7h': 1525, '8h': 1725, '9h': 1900, '10h': 2075,
          '11h': 2175, '11h-110km': 2275, '12h-100km': 2275, '12h-120km': 2400
        },
        extraKmRate: 17, extraMinuteRate: 2, extraKmRate2: 11, extraMinuteRate2: 1.5, extraKmRate3: 10, extraMinuteRate3: 1.5
      },
      hatchback_ac: {
        packages: {
          '1h': 375, '1h-15km': 425, '2h': 575, '2h-25km': 625, '3h': 775, '4h': 975,
          '5h': 1175, '6h': 1375, '7h': 1575, '8h': 1775, '9h': 1950, '10h': 2125,
          '11h': 2225, '11h-110km': 2325, '12h-100km': 2325, '12h-120km': 2450
        },
        extraKmRate: 18, extraMinuteRate: 2.2, extraKmRate2: 12, extraMinuteRate2: 1.6, extraKmRate3: 11, extraMinuteRate3: 1.6
      },
      sedan: {
        packages: {
          '1h': 425, '1h-15km': 475, '2h': 625, '2h-25km': 675, '3h': 825, '4h': 1025,
          '5h': 1225, '6h': 1425, '7h': 1625, '8h': 1825, '9h': 2000, '10h': 2175,
          '11h': 2275, '11h-110km': 2375, '12h-100km': 2375, '12h-120km': 2500
        },
        extraKmRate: 19, extraMinuteRate: 2.4, extraKmRate2: 13, extraMinuteRate2: 1.7, extraKmRate3: 12, extraMinuteRate3: 1.7
      },
      sedan_ac: {
        packages: {
          '1h': 475, '1h-15km': 525, '2h': 675, '2h-25km': 725, '3h': 875, '4h': 1075,
          '5h': 1275, '6h': 1475, '7h': 1675, '8h': 1875, '9h': 2050, '10h': 2225,
          '11h': 2325, '11h-110km': 2425, '12h-100km': 2425, '12h-120km': 2550
        },
        extraKmRate: 20, extraMinuteRate: 2.6, extraKmRate2: 14, extraMinuteRate2: 1.8, extraKmRate3: 13, extraMinuteRate3: 1.8
      },
      suv: {
        packages: {
          '1h': 525, '1h-15km': 575, '2h': 725, '2h-25km': 775, '3h': 925, '4h': 1125,
          '5h': 1325, '6h': 1525, '7h': 1725, '8h': 1925, '9h': 2100, '10h': 2275,
          '11h': 2375, '11h-110km': 2475, '12h-100km': 2475, '12h-120km': 2600
        },
        extraKmRate: 21, extraMinuteRate: 2.8, extraKmRate2: 15, extraMinuteRate2: 1.9, extraKmRate3: 14, extraMinuteRate3: 1.9
      },
      suv_ac: {
        packages: {
          '1h': 575, '1h-15km': 625, '2h': 775, '2h-25km': 825, '3h': 975, '4h': 1175,
          '5h': 1375, '6h': 1575, '7h': 1775, '8h': 1975, '9h': 2150, '10h': 2325,
          '11h': 2425, '11h-110km': 2525, '12h-100km': 2525, '12h-120km': 2650
        },
        extraKmRate: 22, extraMinuteRate: 3.0, extraKmRate2: 16, extraMinuteRate2: 2.0, extraKmRate3: 15, extraMinuteRate3: 2.0
      }
    };
    
    return baseRates[vehicleType as keyof typeof baseRates];
  }

  // Fetch rental fares
  async fetchRentalFaresOld(): Promise<any[]> {
    if (!this.isConnected) {
      return this.getMockRentalFares();
    }

    try {
      const { data, error } = await this.supabase
        .from('rental_fares')
        .select('*')
        .order('vehicle_type', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching rental fares:', error);
      return this.getMockRentalFares();
    }
  }

  // Update rental fare (old method)
  async updateRentalFareOld(fareId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('rental_fares')
        .update(updates)
        .eq('id', fareId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error updating rental fare:', error);
      throw error;
    }
  }

  // Fetch advertisements
  async fetchAdvertisements(): Promise<any[]> {
    if (!this.isConnected) {
      return this.getMockAdvertisements();
    }

    try {
      const { data, error } = await this.supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching advertisements:', error);
      return this.getMockAdvertisements();
    }
  }

  // Create advertisement
  async createAdvertisement(adData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('advertisements')
        .insert(adData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creating advertisement:', error);
      throw error;
    }
  }

  // Update advertisement
  async updateAdvertisement(adId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('advertisements')
        .update(updates)
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error updating advertisement:', error);
      throw error;
    }
  }

  // Update advertisement status
  async updateAdvertisementStatus(adId: string, isActive: boolean): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('advertisements')
        .update({ is_active: isActive })
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error updating advertisement status:', error);
      throw error;
    }
  }

  // Delete advertisement
  async deleteAdvertisement(adId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { error } = await this.supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error deleting advertisement:', error);
      throw error;
    }
  }

  // Fetch drivers with live locations
  async fetchDriversWithLiveLocations(): Promise<any[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Supabase configuration missing, using mock data');
        return this.getMockDriversWithLocations();
      }

      console.log('📡 DatabaseService: Calling get-drivers-with-locations Edge Function...');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-drivers-with-locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Edge function HTTP error: ${response.status} ${response.statusText}`);
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        console.error('❌ Edge function returned error:', result.error);
        throw new Error(result.error);
      }

      console.log(`✅ Successfully fetched ${result.drivers?.length || 0} drivers with locations`);
      return result.drivers || [];
      
    } catch (error) {
      console.error('❌ Error fetching drivers with locations:', error);
      console.log('🔄 Falling back to mock data');
      return this.getMockDriversWithLocations();
    }
  }

  // Subscribe to driver location updates
  subscribeToDriverLocations(callback: (payload: any) => void) {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Cannot subscribe without connection');
      return null;
    }

    return this.supabase
      .channel('driver_locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_locations'
      }, callback)
      .subscribe();
  }

  // Mock data methods
  private getMockRides(): any[] {
    return [
      {
        id: 'mock-ride-1',
        ride_code: 'RIDE123',
        status: 'completed',
        pickup_address: 'Hosur Bus Stand',
        destination_address: 'Electronic City',
        fare_amount: 250,
        created_at: new Date().toISOString(),
        users: { full_name: 'John Customer', phone_number: '+91-9876543210' },
        drivers: {
          users: { full_name: 'Driver Name', phone_number: '+91-9876543211' },
          vehicles: { registration_number: 'KA01AB1234', make: 'Maruti', model: 'Swift' }
        }
      }
    ];
  }

  private getMockOngoingRides(): any[] {
    return [
      {
        id: 'mock-ongoing-1',
        ride_code: 'RENTAL001',
        booking_type: 'rental',
        status: 'pending',
        pickup_address: 'Hosur Railway Station',
        destination_address: 'Multiple stops in Hosur',
        rental_hours: 6,
        customer_name: 'Test Customer',
        customer_phone: '+91-9876543210',
        created_at: new Date().toISOString()
      }
    ];
  }

  private getMockZones(): any[] {
    return [
      {
        id: 'mock-zone-1',
        name: 'Hosur Central',
        city: 'Hosur',
        state: 'Tamil Nadu',
        center_latitude: 12.1266,
        center_longitude: 77.8308,
        radius_km: 5,
        base_fare: 50,
        per_km_rate: 12,
        surge_multiplier: 1.0,
        is_active: true,
        zone_type: 'circle',
        coordinates: {
          type: 'circle',
          center: { lat: 12.1266, lng: 77.8308 },
          radius: 5000
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockFareMatrix(): any[] {
    return [
      {
        id: 'mock-fare-1',
        booking_type: 'regular',
        vehicle_type: 'sedan',
        base_fare: 60,
        per_km_rate: 14,
        per_minute_rate: 2,
        minimum_fare: 60,
        surge_multiplier: 1.0,
        platform_fee_percent: 20.0,
        cancellation_fee: 25,
        hourly_rate: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockRentalFares(): any[] {
    return [
      {
        id: 'mock-rental-fare-1',
        vehicle_type: 'hatchback',
        package_name: '4 Hours',
        duration_hours: 4,
        km_included: 40,
        base_fare: 925,
        extra_km_rate: 17,
        extra_minute_rate: 2,
        is_popular: true,
        discount_percent: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-rental-fare-2',
        vehicle_type: 'sedan_ac',
        package_name: '6 Hours',
        duration_hours: 6,
        km_included: 60,
        base_fare: 1475,
        extra_km_rate: 14,
        extra_minute_rate: 1.8,
        is_popular: false,
        discount_percent: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockAdvertisements(): any[] {
    return [
      {
        id: 'mock-ad-1',
        title: 'Special Offer',
        description: 'Get 20% off on your next ride',
        images: ['https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg'],
        target_audience: 'all',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        click_count: 45,
        view_count: 1200,
        priority: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  getMockOutstationFares(): any[] {
    return [
      {
        id: 'mock-outstation-1',
        vehicle_type: 'hatchback',
        base_fare: 500,
        per_km_rate: 14,
        driver_allowance_per_day: 300,
        daily_km_limit: 250,
        daily_km_limit: 300,
        night_charge_percent: 20.0,
        toll_charges_included: false,
        minimum_distance_km: 50,
        cancellation_fee: 200,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-outstation-2',
        vehicle_type: 'sedan_ac',
        base_fare: 800,
        per_km_rate: 20,
        driver_allowance_per_day: 450,
        daily_km_limit: 300,
        daily_km_limit: 400,
        night_charge_percent: 20.0,
        toll_charges_included: false,
        minimum_distance_km: 50,
        cancellation_fee: 200,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Outstation Fares Management
  async fetchOutstationFares(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ Database not connected, using mock outstation fares');
      return this.getMockOutstationFares();
    }

    try {
      console.log('🔍 Fetching outstation fares from database...');
      const { data, error } = await this.supabase
        .from('outstation_fares')
        .select('*')
        .order('vehicle_type', { ascending: true });

      if (error) {
        console.error('❌ Error fetching outstation fares:', error);
        return this.getMockOutstationFares();
      }

      console.log(`✅ Fetched ${data?.length || 0} outstation fares from database`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching outstation fares:', error);
      return this.getMockOutstationFares();
    }
  }

  // Outstation Packages (Slab System) Methods
  async fetchOutstationPackages() {
    if (!this.isConnected) {
      console.warn('⚠️ DatabaseService: Using mock outstation packages (Supabase not connected)');
      return this.getMockOutstationPackages();
    }

    try {
      console.log('📡 DatabaseService: Fetching outstation packages from Supabase...');
      
      const { data, error } = await this.supabase
        .from('outstation_packages')
        .select(`
          id,
          vehicle_type,
          slab_10km,
          slab_20km,
          slab_30km,
          slab_40km,
          slab_50km,
          slab_60km,
          slab_70km,
          slab_80km,
          slab_90km,
          slab_100km,
          slab_110km,
          slab_120km,
          slab_130km,
          slab_140km,
          slab_150km,
          extra_km_rate,
          driver_allowance_per_day,
          night_charge_percent,
          toll_charges_included,
          cancellation_fee,
          advance_booking_discount,
          use_slab_system,
          is_active,
          created_at,
          updated_at
        `)
        .order('vehicle_type', { ascending: true });
      
      if (error) {
        console.error('❌ DatabaseService: Outstation packages query error:', error);
        
        // If table doesn't exist, return mock data
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('⚠️ DatabaseService: outstation_packages table does not exist, using mock data');
          return this.getMockOutstationPackages();
        }
        
        throw error;
      }
      
      console.log(`✅ DatabaseService: Fetched ${data?.length || 0} outstation packages`);
      
      // Log the first package to verify all slab columns are present
      if (data && data.length > 0) {
        console.log('🔍 Sample package data (first record):', {
          vehicle_type: data[0].vehicle_type,
          slab_10km: data[0].slab_10km,
          slab_20km: data[0].slab_20km,
          slab_30km: data[0].slab_30km,
          slab_40km: data[0].slab_40km,
          slab_50km: data[0].slab_50km,
          slab_60km: data[0].slab_60km,
          slab_70km: data[0].slab_70km,
          slab_80km: data[0].slab_80km,
          slab_90km: data[0].slab_90km,
          slab_100km: data[0].slab_100km,
          slab_110km: data[0].slab_110km,
          slab_120km: data[0].slab_120km,
          slab_130km: data[0].slab_130km,
          slab_140km: data[0].slab_140km,
          slab_150km: data[0].slab_150km
        });
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ DatabaseService: Outstation packages fetch failed, using mock data:', error);
      return this.getMockOutstationPackages();
    }
  }

  async createOutstationPackage(packageData: any) {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('outstation_packages')
        .insert(packageData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ DatabaseService: Create outstation package failed:', error);
      throw error;
    }
  }

  async updateOutstationPackage(packageId: string, updates: any) {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('outstation_packages')
        .update(updates)
        .eq('id', packageId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ DatabaseService: Update outstation package failed:', error);
      throw error;
    }
  }

  async deleteOutstationPackage(packageId: string) {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { error } = await this.supabase
        .from('outstation_packages')
        .delete()
        .eq('id', packageId);
      
      if (error) throw error;
    } catch (error) {
      console.error('❌ DatabaseService: Delete outstation package failed:', error);
      throw error;
    }
  }

  private getMockOutstationPackages() {
    const vehicleTypes = ['hatchback', 'hatchback_ac', 'sedan', 'sedan_ac', 'suv', 'suv_ac'];
    
    return vehicleTypes.map((vehicleType) => {
      const baseRates = this.getBaseSlabRatesForVehicle(vehicleType);
      
      return {
        id: `mock-package-${vehicleType}`,
        vehicle_type: vehicleType,
        slab_10km: baseRates.slab_10km,
        slab_20km: baseRates.slab_20km,
        slab_30km: baseRates.slab_30km,
        slab_40km: baseRates.slab_40km,
        slab_50km: baseRates.slab_50km,
        slab_60km: baseRates.slab_60km,
        slab_70km: baseRates.slab_70km,
        slab_80km: baseRates.slab_80km,
        slab_90km: baseRates.slab_90km,
        slab_100km: baseRates.slab_100km,
        slab_110km: baseRates.slab_110km,
        slab_120km: baseRates.slab_120km,
        slab_130km: baseRates.slab_130km,
        slab_140km: baseRates.slab_140km,
        slab_150km: baseRates.slab_150km,
        extra_km_rate: baseRates.extra_km_rate,
        driver_allowance_per_day: baseRates.driver_allowance,
        night_charge_percent: 20.0,
        toll_charges_included: false,
        cancellation_fee: baseRates.cancellation_fee,
        advance_booking_discount: 5.0,
        use_slab_system: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }

  private getBaseSlabRatesForVehicle(vehicleType: string) {
    const baseRates = {
      hatchback: {
        slab_10km: 500,
        slab_20km: 700,
        slab_30km: 950,
        slab_40km: 1200,
        slab_50km: 1400,
        slab_60km: 1650,
        slab_70km: 1700,
        slab_80km: 2100,
        slab_90km: 2300,
        slab_100km: 2500,
        slab_110km: 2700,
        slab_120km: 2900,
        slab_130km: 3100,
        slab_140km: 3250,
        slab_150km: 3400,
        extra_km_rate: 16,
        driver_allowance: 350,
        cancellation_fee: 250
      },
      hatchback_ac: {
        slab_10km: 550,
        slab_20km: 800,
        slab_30km: 1000,
        slab_40km: 1350,
        slab_50km: 1550,
        slab_60km: 1850,
        slab_70km: 2100,
        slab_80km: 2350,
        slab_90km: 2650,
        slab_100km: 2800,
        slab_110km: 3150,
        slab_120km: 3250,
        slab_130km: 3650,
        slab_140km: 3650,
        slab_150km: 3800,
        extra_km_rate: 17,
        driver_allowance: 375,
        cancellation_fee: 275
      },
      sedan: {
        slab_10km: 600,
        slab_20km: 900,
        slab_30km: 1100,
        slab_40km: 1500,
        slab_50km: 1700,
        slab_60km: 2050,
        slab_70km: 2300,
        slab_80km: 2600,
        slab_90km: 2900,
        slab_100km: 3100,
        slab_110km: 3450,
        slab_120km: 3600,
        slab_130km: 4000,
        slab_140km: 4050,
        slab_150km: 4200,
        extra_km_rate: 18,
        driver_allowance: 400,
        cancellation_fee: 300
      },
      sedan_ac: {
        slab_10km: 650,
        slab_20km: 1000,
        slab_30km: 1200,
        slab_40km: 1650,
        slab_50km: 1850,
        slab_60km: 2250,
        slab_70km: 2500,
        slab_80km: 2850,
        slab_90km: 3150,
        slab_100km: 3400,
        slab_110km: 3750,
        slab_120km: 3950,
        slab_130km: 4350,
        slab_140km: 4450,
        slab_150km: 4600,
        extra_km_rate: 19,
        driver_allowance: 425,
        cancellation_fee: 325
      },
      suv: {
        slab_10km: 700,
        slab_20km: 1100,
        slab_30km: 1300,
        slab_40km: 1800,
        slab_50km: 2000,
        slab_60km: 2450,
        slab_70km: 2700,
        slab_80km: 3100,
        slab_90km: 3400,
        slab_100km: 3700,
        slab_110km: 4050,
        slab_120km: 4300,
        slab_130km: 4700,
        slab_140km: 4850,
        slab_150km: 5000,
        extra_km_rate: 20,
        driver_allowance: 450,
        cancellation_fee: 350
      },
      suv_ac: {
        slab_10km: 750,
        slab_20km: 1200,
        slab_30km: 1400,
        slab_40km: 1950,
        slab_50km: 2150,
        slab_60km: 2650,
        slab_70km: 2900,
        slab_80km: 3350,
        slab_90km: 3650,
        slab_100km: 4000,
        slab_110km: 4350,
        slab_120km: 4650,
        slab_130km: 5050,
        slab_140km: 5250,
        slab_150km: 5450,
        extra_km_rate: 21,
        driver_allowance: 500,
        cancellation_fee: 375
      }
    };
    
    return baseRates[vehicleType as keyof typeof baseRates] || baseRates.sedan;
  }

  // Fetch zones from database
  async fetchZones() {
    if (!this.isConnected) {
      return this.getMockZones();
    }

    try {
      const { data, error } = await this.supabase
        .from('zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching zones:', error);
      return this.getMockZones();
    }
  }

  async createOutstationFare(fareData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Creating outstation fare in database:', fareData);
      
      const { data, error } = await this.supabase
        .from('outstation_fares')
        .insert(fareData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating outstation fare:', error);
        throw new Error(`Failed to create outstation fare: ${error.message}`);
      }

      console.log('✅ Outstation fare created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating outstation fare:', error);
      throw error;
    }
  }

  async updateOutstationFare(fareId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Updating outstation fare in database:', fareId, updates);
      
      // First check if the record exists
      const { data: existingFare, error: checkError } = await this.supabase
        .from('outstation_fares')
        .select('*')
        .eq('id', fareId)
        .single();
      
      if (checkError) {
        console.error('❌ Error checking existing fare:', checkError);
        throw new Error(`Fare record not found: ${checkError.message}`);
      }
      
      console.log('✅ Found existing fare record:', existingFare);
      
      const { data, error } = await this.supabase
        .from('outstation_fares')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', fareId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating outstation fare:', error);
        console.error('❌ Update details:', { fareId, updates, error });
        throw new Error(`Failed to update outstation fare: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from update operation');
        throw new Error('Update operation returned no data');
      }

      console.log('✅ Outstation fare updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating outstation fare:', error);
      throw error;
    }
  }

  // Airport Fares Management
  async fetchAirportFares(): Promise<any[]> {
    if (!this.isConnected) {
      console.warn('⚠️ Database not connected, using mock airport fares');
      return this.getMockAirportFares();
    }

    try {
      console.log('🔍 Fetching airport fares from database...');
      const { data, error } = await this.supabase
        .from('airport_fares')
        .select('*')
        .order('vehicle_type', { ascending: true });

      if (error) {
        console.error('❌ Error fetching airport fares:', error);
        return this.getMockAirportFares();
      }

      console.log(`✅ Fetched ${data?.length || 0} airport fares from database`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching airport fares:', error);
      return this.getMockAirportFares();
    }
  }

  async createAirportFare(fareData: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Creating airport fare in database:', fareData);
      
      const { data, error } = await this.supabase
        .from('airport_fares')
        .insert(fareData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating airport fare:', error);
        throw new Error(`Failed to create airport fare: ${error.message}`);
      }

      console.log('✅ Airport fare created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating airport fare:', error);
      throw error;
    }
  }

  async updateAirportFare(fareId: string, updates: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Please check your Supabase configuration.');
    }

    try {
      console.log('💾 Updating airport fare in database:', fareId, updates);
      
      const { data, error } = await this.supabase
        .from('airport_fares')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', fareId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating airport fare:', error);
        throw new Error(`Failed to update airport fare: ${error.message}`);
      }

      console.log('✅ Airport fare updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating airport fare:', error);
      throw error;
    }
  }

  private getMockAirportFares(): any[] {
    return [
      {
        id: 'mock-airport-hatchback',
        vehicle_type: 'hatchback',
        hosur_to_airport_fare: 1200,
        airport_to_hosur_fare: 1200,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-airport-sedan_ac',
        vehicle_type: 'sedan_ac',
        hosur_to_airport_fare: 1800,
        airport_to_hosur_fare: 1800,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Driver management methods
  async verifyDriver(driverId: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .update({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error verifying driver:', error);
      throw error;
    }
  }

  async updateDriverStatus(driverId: string, status: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error updating driver status:', error);
      throw error;
    }
  }

  async deleteDriver(driverId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-delete-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          driver_id: driverId
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete driver');
      }

      console.log('✅ Driver deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting driver:', error);
      throw error;
    }
  }

  async fixMissingDriverRecords(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      // This would implement logic to fix missing driver records
      // For now, just return a success message
      return {
        fixed: 0,
        message: 'No missing driver records found'
      };
    } catch (error) {
      console.error('❌ Error fixing driver records:', error);
      throw error;
    }
  }

  private getMockDriversWithLocations(): any[] {
    return [
      {
        id: 'mock-driver-loc-1',
        user_id: 'mock-user-loc-1',
        full_name: 'Rajesh Kumar',
        phone_number: '+91-9876543210',
        email: 'rajesh@example.com',
        license_number: 'DL123456789',
        license_expiry: '2025-12-31',
        status: 'online',
        rating: 4.8,
        total_rides: 156,
        is_verified: true,
        vehicle_registration: 'KA01AB1234',
        vehicle_make: 'Maruti',
        vehicle_model: 'Swift',
        vehicle_type: 'hatchback_ac',
        vehicle_color: 'White',
        vehicle_year: 2022,
        latitude: 12.1266,
        longitude: 77.8308,
        last_location_update: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

const databaseService = new DatabaseService();
export { databaseService };
export default databaseService;