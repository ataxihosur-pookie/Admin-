import { createClient } from '@supabase/supabase-js';

interface AirportFare {
  id: string;
  vehicle_type: string;
  base_fare: number;
  per_km_rate: number;
  airport_fee: number;
  waiting_charge_per_hour: number;
  night_charge_percent: number;
  luggage_assistance_fee: number;
  meet_greet_fee: number;
  cancellation_fee: number;
  advance_booking_discount: number;
  peak_hour_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AirportFareService {
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
        console.log('✅ AirportFareService: Supabase connected successfully');
      } else {
        console.warn('⚠️ AirportFareService: Supabase credentials missing');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ AirportFareService: Failed to initialize Supabase:', error);
      this.isConnected = false;
    }
  }

  async fetchAirportFares(): Promise<AirportFare[]> {
    if (!this.isConnected) {
      console.warn('⚠️ AirportFareService: Using mock data (Supabase not connected)');
      return this.getMockAirportFares();
    }

    try {
      console.log('📡 AirportFareService: Fetching airport fares from Supabase...');
      
      const { data, error } = await this.supabase
        .from('airport_fares')
        .select('*')
        .order('vehicle_type', { ascending: true });
      
      if (error) {
        console.error('❌ AirportFareService: Query error:', error);
        
        // If table doesn't exist, return mock data
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('⚠️ AirportFareService: Table does not exist, using mock data');
          return this.getMockAirportFares();
        }
        
        throw error;
      }
      
      console.log(`✅ AirportFareService: Fetched ${data?.length || 0} airport fares`);
      return data || [];
    } catch (error) {
      console.error('❌ AirportFareService: Fetch failed, using mock data:', error);
      return this.getMockAirportFares();
    }
  }

  async createAirportFare(fareData: any): Promise<AirportFare> {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('airport_fares')
        .insert(fareData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ AirportFareService: Create failed:', error);
      throw error;
    }
  }

  async updateAirportFare(fareId: string, updates: Partial<AirportFare>): Promise<AirportFare> {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { data, error } = await this.supabase
        .from('airport_fares')
        .update(updates)
        .eq('id', fareId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ AirportFareService: Update failed:', error);
      throw error;
    }
  }

  async deleteAirportFare(fareId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Supabase not connected');
    }

    try {
      const { error } = await this.supabase
        .from('airport_fares')
        .delete()
        .eq('id', fareId);
      
      if (error) throw error;
    } catch (error) {
      console.error('❌ AirportFareService: Delete failed:', error);
      throw error;
    }
  }

  // Create all 6 vehicle types with default fares
  async createAllVehicleTypes(): Promise<AirportFare[]> {
    console.log('🚀 Creating airport fares for all 6 vehicle types...');
    
    const defaultFares = this.getMockAirportFares();
    const createdFares: AirportFare[] = [];
    
    for (const fareData of defaultFares) {
      try {
        console.log(`🚗 Creating airport fare for ${fareData.vehicle_type}...`);
        
        if (this.isConnected) {
          const created = await this.createAirportFare({
            vehicle_type: fareData.vehicle_type,
            hosur_to_airport_fare: fareData.hosur_to_airport_fare,
            airport_to_hosur_fare: fareData.airport_to_hosur_fare,
            is_active: true
          });
          createdFares.push(created);
        } else {
          // Use mock data if not connected
          createdFares.push(fareData);
        }
        
        console.log(`✅ Created airport fare for ${fareData.vehicle_type}`);
      } catch (createError) {
        console.error(`❌ Failed to create airport fare for ${fareData.vehicle_type}:`, createError);
        // Add mock data as fallback
        createdFares.push(fareData);
      }
    }
    
    console.log(`✅ Total airport fares created: ${createdFares.length}`);
    return createdFares;
  }

  // Recreate all vehicle types (delete existing and create new)
  async recreateAllVehicleTypes(): Promise<AirportFare[]> {
    if (!this.isConnected) {
      console.warn('⚠️ Not connected to database, returning mock data');
      return this.getMockAirportFares();
    }

    try {
      console.log('🧹 Clearing all existing airport fares...');
      
      // Delete all existing entries
      const { error: deleteError } = await this.supabase
        .from('airport_fares')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.warn('⚠️ Warning clearing existing entries:', deleteError);
      }
      
      // Create all 6 vehicle types
      return await this.createAllVehicleTypes();
      
    } catch (error) {
      console.error('❌ Error recreating airport fares:', error);
      return this.getMockAirportFares();
    }
  }

  // Make getMockAirportFares public so it can be used externally
  getMockAirportFares(): AirportFare[] {
    return this.getMockAirportFares();
  }

  private getMockAirportFares(): AirportFare[] {
    const vehicleTypes = [
      'hatchback',
      'hatchback_ac', 
      'sedan',
      'sedan_ac',
      'suv',
      'suv_ac'
    ];

    const baseRates = {
      hatchback: { base: 200, perKm: 16, airport: 100 },
      hatchback_ac: { base: 250, perKm: 18, airport: 100 },
      sedan: { base: 300, perKm: 20, airport: 100 },
      sedan_ac: { base: 350, perKm: 22, airport: 100 },
      suv: { base: 400, perKm: 24, airport: 100 },
      suv_ac: { base: 450, perKm: 26, airport: 100 }
    };

    return vehicleTypes.map((vehicleType) => {
      const rates = baseRates[vehicleType as keyof typeof baseRates];
      
      return {
        id: `mock-airport-${vehicleType}`,
        vehicle_type: vehicleType,
        base_fare: rates.base,
        per_km_rate: rates.perKm,
        airport_fee: rates.airport,
        waiting_charge_per_hour: 50,
        night_charge_percent: 25,
        luggage_assistance_fee: 20,
        meet_greet_fee: 30,
        cancellation_fee: 150,
        advance_booking_discount: 10,
        peak_hour_multiplier: 1.5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }
}

// Export singleton instance
export const airportFareService = new AirportFareService();