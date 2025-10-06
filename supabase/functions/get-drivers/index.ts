import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Use SERVICE ROLE KEY to bypass RLS and get all drivers
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      console.log('🔍 Fetching all drivers with service role...');
      
      // Fetch drivers with user and vehicle details using service role (bypasses RLS)
      const { data: drivers, error: driversError } = await supabase
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
          vehicles!fk_drivers_vehicle(
            id,
            registration_number,
            make,
            model,
            vehicle_type,
            color,
            year,
            capacity,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (driversError) {
        console.error('❌ Error fetching drivers:', driversError);
        throw driversError;
      }

      console.log(`✅ Found ${drivers?.length || 0} drivers in database`);
      
      // Log each driver for debugging
      drivers?.forEach((driver, index) => {
        console.log(`👤 Driver ${index + 1}:`, {
          id: driver.id,
          name: driver.users?.full_name || 'NO NAME FOUND',
          email: driver.users?.email || 'NO EMAIL FOUND',
          phone: driver.users?.phone_number || 'NO PHONE FOUND',
          license: driver.license_number,
          status: driver.status,
          verified: driver.is_verified,
          vehicle_reg: driver.vehicles?.registration_number || 'NO VEHICLE',
          vehicle_make: driver.vehicles?.make || 'NO MAKE',
          vehicle_model: driver.vehicles?.model || 'NO MODEL'
        });
      });
      
      // Transform data to flatten user and vehicle information for easier access
      const transformedDrivers = drivers?.map(driver => ({
        driver_id: driver.id,
        user_id: driver.user_id,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        vehicle_id: driver.vehicle_id,
        vendor_id: driver.vendor_id,
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
          id: driver.vehicles.id,
          registration_number: driver.vehicles.registration_number,
          make: driver.vehicles.make,
          model: driver.vehicles.model,
          vehicle_type: driver.vehicles.vehicle_type,
          color: driver.vehicles.color,
          year: driver.vehicles.year,
          capacity: driver.vehicles.capacity,
          is_verified: driver.vehicles.is_verified
        } : null
      })) || [];

      console.log(`✅ Transformed ${transformedDrivers.length} drivers for response`);
      
      return new Response(
        JSON.stringify({
          success: true,
          drivers: transformedDrivers,
          count: transformedDrivers.length,
          debug_info: {
            total_found: drivers?.length || 0,
            with_user_data: drivers?.filter(d => d.users?.full_name).length || 0,
            with_vehicle_data: drivers?.filter(d => d.vehicles?.registration_number).length || 0,
            online_drivers: drivers?.filter(d => d.status === 'online').length || 0,
            verified_drivers: drivers?.filter(d => d.is_verified).length || 0
          }
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('❌ Get drivers error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch drivers'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});