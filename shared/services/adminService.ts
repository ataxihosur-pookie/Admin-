import { databaseService } from '../../src/services/databaseService';
import { User, Driver, Vehicle, Vendor, Ride, Payment } from '../types';

export class AdminService {
  // Dashboard Statistics
  static async getDashboardStats() {
    try {
      // Add timeout and error handling for each query
      const queryWithTimeout = async (query: any, name: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const result = await query;
          clearTimeout(timeoutId);
          return result;
        } catch (error) {
          clearTimeout(timeoutId);
          console.warn(`⚠️ ${name} query failed:`, error);
          return { data: [], count: 0, error };
        }
      };
      
      const [
        usersResult,
        driversResult,
        ridesResult,
        paymentsResult,
        activeRidesResult
      ] = await Promise.all([
        queryWithTimeout(databaseService.supabase.from('users').select('id', { count: 'exact' }), 'Users'),
        queryWithTimeout(databaseService.supabase.from('drivers').select('id', { count: 'exact' }).eq('status', 'online'), 'Drivers'),
        queryWithTimeout(databaseService.supabase.from('rides').select('id', { count: 'exact' }), 'Rides'),
        queryWithTimeout(databaseService.supabase.from('payments').select('amount').eq('status', 'completed'), 'Payments'),
        queryWithTimeout(databaseService.supabase.from('rides').select('id', { count: 'exact' }).in('status', ['requested', 'accepted', 'in_progress']), 'Active Rides')
      ]);

      const todayRevenue = paymentsResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      return {
        totalUsers: usersResult.count || 0,
        activeDrivers: driversResult.count || 0,
        totalRides: ridesResult.count || 0,
        todayRevenue,
        activeRides: activeRidesResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats instead of throwing error
      return {
        totalUsers: 0,
        activeDrivers: 0,
        totalRides: 0,
        todayRevenue: 0,
        activeRides: 0
      };
    }
  }

  // User Management
  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await databaseService.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async updateUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await databaseService.supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Driver Management
  static async getAllDrivers(): Promise<Driver[]> {
    const { data, error } = await databaseService.supabase
      .from('drivers')
      .select(`
        *,
        users!inner(full_name, email, phone_number),
        vehicles(registration_number, make, model)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async verifyDriver(driverId: string) {
    const { data, error } = await databaseService.supabase
      .from('drivers')
      .update({ is_verified: true })
      .eq('id', driverId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async suspendDriver(driverId: string) {
    const { data, error } = await databaseService.supabase
      .from('drivers')
      .update({ status: 'suspended' })
      .eq('id', driverId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Ride Management
  static async getAllRides(): Promise<Ride[]> {
    const { data, error } = await databaseService.supabase
      .from('rides')
      .select(`
        *,
        users!customer_id(full_name, phone_number),
        drivers!driver_id(
          users!inner(full_name, phone_number),
          vehicles(registration_number, make, model)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getRideAnalytics(startDate: string, endDate: string) {
    const { data, error } = await databaseService.supabase
      .from('rides')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (error) throw error;
    
    // Process analytics data
    const totalRides = data?.length || 0;
    const completedRides = data?.filter(ride => ride.status === 'completed').length || 0;
    const cancelledRides = data?.filter(ride => ride.status === 'cancelled').length || 0;
    const totalRevenue = data?.reduce((sum, ride) => sum + (ride.fare_amount || 0), 0) || 0;
    
    return {
      totalRides,
      completedRides,
      cancelledRides,
      totalRevenue,
      completionRate: totalRides > 0 ? (completedRides / totalRides) * 100 : 0
    };
  }

  // Vehicle Management
  static async getAllVehicles(): Promise<Vehicle[]> {
    const { data, error } = await databaseService.supabase
      .from('vehicles')
      .select(`
        *,
        drivers(
          users!inner(full_name, phone_number)
        ),
        vendors(company_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async verifyVehicle(vehicleId: string) {
    const { data, error } = await databaseService.supabase
      .from('vehicles')
      .update({ is_verified: true })
      .eq('id', vehicleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Vendor Management
  static async getAllVendors(): Promise<Vendor[]> {
    const { data, error } = await databaseService.supabase
      .from('vendors')
      .select(`
        *,
        users!inner(full_name, email, phone_number)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Real-time subscriptions
  static subscribeToRideUpdates(callback: (payload: any) => void) {
    return databaseService.supabase
      .channel('ride_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, callback)
      .subscribe();
  }

  static subscribeToDriverLocations(callback: (payload: any) => void) {
    return databaseService.supabase
      .channel('driver_locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_locations'
      }, callback)
      .subscribe();
  }

  // Get Supabase client for direct access
  getClient() {
    return databaseService.supabase;
  }
}

// Factory function for creating API clients
export const createApiClient = (supabaseUrl: string, supabaseKey: string) => {
  return databaseService;
};