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
      console.log('🔍 Fetching available drivers with service role...');
      
      // Step 1: Get ALL drivers with their user and vehicle details
      const { data: allDrivers, error: driversError } = await supabase
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
            vehicle_type,
            color,
            year
          )
        `)
        .order('created_at', { ascending: false });

      if (driversError) {
        console.error('❌ Error fetching drivers:', driversError);
        throw driversError;
      }

      console.log(`📊 Found ${allDrivers?.length || 0} total drivers in database`);
      
      // Log all drivers for debugging
      allDrivers?.forEach(driver => {
        console.log(`👤 Driver: ${driver.users?.full_name || 'Unknown'} - Status: ${driver.status} - Verified: ${driver.is_verified} - Vehicle: ${driver.vehicles?.registration_number || 'None'}`);
      });

      if (!allDrivers || allDrivers.length === 0) {
        console.log('⚠️ No drivers found in database');
        return new Response(
          JSON.stringify({
            success: true,
            drivers: [],
            message: 'No drivers found in database'
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Step 2: Filter for online and verified drivers
      const onlineVerifiedDrivers = allDrivers.filter(driver => 
        driver.status === 'online' && driver.is_verified === true
      );
      
      console.log(`📊 Online verified drivers: ${onlineVerifiedDrivers.length}`);
      onlineVerifiedDrivers.forEach(driver => {
        console.log(`✅ Online & Verified: ${driver.users?.full_name} (${driver.id})`);
      });

      // Step 3: Get drivers who are currently on active rides
      const { data: busyDrivers, error: busyError } = await supabase
        .from('rides')
        .select('driver_id')
        .not('driver_id', 'is', null)
        .in('status', ['accepted', 'driver_arrived', 'in_progress']);

      if (busyError) {
        console.warn('⚠️ Error fetching busy drivers, proceeding with all online drivers:', busyError);
      }

      const busyDriverIds = new Set(busyDrivers?.map(ride => ride.driver_id) || []);
      console.log(`📊 Found ${busyDriverIds.size} busy drivers:`, Array.from(busyDriverIds));

      // Step 4: Filter out busy drivers
      const availableDrivers = onlineVerifiedDrivers.filter(driver => !busyDriverIds.has(driver.id));
      console.log(`📊 Available drivers after filtering: ${availableDrivers.length}`);

      // Step 5: Transform the data
      const transformedDrivers = availableDrivers.map(driver => {
        console.log(`🔍 Processing available driver: ${driver.users?.full_name || 'Unknown'} (${driver.id})`);
        return {
          id: driver.id,
          full_name: driver.users?.full_name || 'Unknown Driver',
          phone_number: driver.users?.phone_number || 'No phone',
          rating: driver.rating || 5.0,
          total_rides: driver.total_rides || 0,
          vehicle_registration: driver.vehicles?.registration_number,
          vehicle_make: driver.vehicles?.make,
          vehicle_model: driver.vehicles?.model,
          vehicle_type: driver.vehicles?.vehicle_type,
          vehicle_color: driver.vehicles?.color,
          vehicle_year: driver.vehicles?.year
        };
      });

      console.log(`✅ Returning ${transformedDrivers.length} available drivers`);
      transformedDrivers.forEach(driver => {
        console.log(`👤 Available: ${driver.full_name} - ${driver.phone_number} - ⭐${driver.rating} - 🚗${driver.vehicle_registration || 'No vehicle'}`);
      });

      return new Response(
        JSON.stringify({
          success: true,
          drivers: transformedDrivers,
          total_drivers: allDrivers.length,
          online_verified: onlineVerifiedDrivers.length,
          busy_drivers: busyDriverIds.size,
          available_count: transformedDrivers.length
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
    console.error('❌ Get available drivers error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available drivers'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});