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
    // Use SERVICE ROLE KEY to bypass RLS and get all drivers with live locations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      console.log('🗺️ [GET-DRIVERS-LOCATIONS] ===== STARTING DRIVER FETCH =====');
      
      // Step 1: Get all drivers with basic info (no complex joins initially)
      console.log('📊 [GET-DRIVERS-LOCATIONS] Step 1: Fetching all drivers...');
      const { data: allDrivers, error: driversError } = await supabase
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
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (driversError) {
        console.error('❌ [GET-DRIVERS-LOCATIONS] Database error fetching drivers:', driversError);
        throw new Error(`Failed to fetch drivers: ${driversError.message}`);
      }

      console.log(`✅ [GET-DRIVERS-LOCATIONS] Found ${allDrivers?.length || 0} drivers in database`);

      if (!allDrivers || allDrivers.length === 0) {
        console.log('⚠️ [GET-DRIVERS-LOCATIONS] No drivers found in database');
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

      // Step 2: Get user details for all drivers
      console.log('👤 [GET-DRIVERS-LOCATIONS] Step 2: Fetching user details...');
      const userIds = allDrivers.map(d => d.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number, is_active')
        .in('id', userIds);

      if (usersError) {
        console.error('❌ [GET-DRIVERS-LOCATIONS] Error fetching users:', usersError);
        throw new Error(`Failed to fetch user details: ${usersError.message}`);
      }

      console.log(`✅ [GET-DRIVERS-LOCATIONS] Found ${users?.length || 0} user records`);

      // Step 3: Get vehicle details for drivers that have vehicles
      console.log('🚗 [GET-DRIVERS-LOCATIONS] Step 3: Fetching vehicle details...');
      const vehicleIds = allDrivers.filter(d => d.vehicle_id).map(d => d.vehicle_id);
      let vehicles = [];
      
      if (vehicleIds.length > 0) {
        const { data: vehicleData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, registration_number, make, model, vehicle_type, color, year, capacity, is_verified')
          .in('id', vehicleIds);

        if (vehiclesError) {
          console.warn('⚠️ [GET-DRIVERS-LOCATIONS] Warning fetching vehicles:', vehiclesError);
          // Continue without vehicle data
        } else {
          vehicles = vehicleData || [];
          console.log(`✅ [GET-DRIVERS-LOCATIONS] Found ${vehicles.length} vehicle records`);
        }
      }

      // Step 4: Get ALL live locations
      console.log('📍 [GET-DRIVERS-LOCATIONS] Step 4: Fetching ALL live locations...');
      const { data: allLocations, error: locationsError } = await supabase
        .from('live_locations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (locationsError) {
        console.warn('⚠️ [GET-DRIVERS-LOCATIONS] Warning fetching live locations:', locationsError);
        // Continue without live locations
      }

      console.log(`📍 [GET-DRIVERS-LOCATIONS] Found ${allLocations?.length || 0} live location records`);
      
      // Log all locations for debugging
      allLocations?.forEach((location, index) => {
        console.log(`📍 [GET-DRIVERS-LOCATIONS] Location ${index + 1}: User ${location.user_id.slice(-6)} at ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (${new Date(location.updated_at).toLocaleTimeString()})`);
      });
      
      // Step 5: Create maps for efficient lookup
      const userMap = new Map();
      users?.forEach(user => userMap.set(user.id, user));
      
      const vehicleMap = new Map();
      vehicles.forEach(vehicle => vehicleMap.set(vehicle.id, vehicle));
      
      const locationMap = new Map();
      allLocations?.forEach(location => {
        const existingLocation = locationMap.get(location.user_id);
        if (!existingLocation || new Date(location.updated_at) > new Date(existingLocation.updated_at)) {
          locationMap.set(location.user_id, location);
        }
      });

      console.log(`🗺️ [GET-DRIVERS-LOCATIONS] Created maps: ${userMap.size} users, ${vehicleMap.size} vehicles, ${locationMap.size} locations`);

      // Step 6: Combine all data
      console.log('🔗 [GET-DRIVERS-LOCATIONS] Step 6: Combining all data...');
      const transformedDrivers = allDrivers.map(driver => {
        const user = userMap.get(driver.user_id);
        const vehicle = driver.vehicle_id ? vehicleMap.get(driver.vehicle_id) : null;
        const liveLocation = locationMap.get(driver.user_id);
        
        const transformedDriver = {
          id: driver.id,
          user_id: driver.user_id,
          full_name: user?.full_name || 'Unknown Driver',
          phone_number: user?.phone_number || 'No phone',
          email: user?.email || 'No email',
          license_number: driver.license_number,
          license_expiry: driver.license_expiry,
          status: driver.status,
          rating: driver.rating || 5.0,
          total_rides: driver.total_rides || 0,
          is_verified: driver.is_verified,
          vehicle_registration: vehicle?.registration_number,
          vehicle_make: vehicle?.make,
          vehicle_model: vehicle?.model,
          vehicle_type: vehicle?.vehicle_type,
          vehicle_color: vehicle?.color,
          vehicle_year: vehicle?.year,
          latitude: liveLocation?.latitude || null,
          longitude: liveLocation?.longitude || null,
          heading: liveLocation?.heading || null,
          speed: liveLocation?.speed || null,
          accuracy: liveLocation?.accuracy || null,
          last_location_update: liveLocation?.updated_at || null,
          created_at: driver.created_at,
          updated_at: driver.updated_at
        };

        if (liveLocation) {
          console.log(`📍 [GET-DRIVERS-LOCATIONS] Driver with location: ${transformedDriver.full_name} at ${transformedDriver.latitude}, ${transformedDriver.longitude}`);
        } else {
          console.log(`📍 [GET-DRIVERS-LOCATIONS] Driver without location: ${transformedDriver.full_name} (User ID: ${driver.user_id.slice(-6)})`);
        }

        return transformedDriver;
      });

      // Step 7: Separate drivers with and without locations
      const driversWithLocations = transformedDrivers.filter(d => d.latitude && d.longitude);
      const driversWithoutLocations = transformedDrivers.filter(d => !d.latitude || !d.longitude);
      
      console.log(`🗺️ [GET-DRIVERS-LOCATIONS] ===== FINAL SUMMARY =====`);
      console.log(`   - Total drivers: ${transformedDrivers.length}`);
      console.log(`   - With locations: ${driversWithLocations.length}`);
      console.log(`   - Without locations: ${driversWithoutLocations.length}`);
      console.log(`   - Live location records: ${allLocations?.length || 0}`);
      console.log(`   - Unique users with locations: ${locationMap.size}`);
      console.log('🗺️ [GET-DRIVERS-LOCATIONS] ===== END SUMMARY =====');
      
      return new Response(
        JSON.stringify({
          success: true,
          drivers: transformedDrivers,
          total_drivers: transformedDrivers.length,
          drivers_with_locations: driversWithLocations.length,
          drivers_without_locations: driversWithoutLocations.length,
          live_location_records: allLocations?.length || 0,
          unique_users_with_locations: locationMap.size,
          debug_info: {
            total_found: allDrivers.length,
            users_found: users?.length || 0,
            vehicles_found: vehicles.length,
            live_locations_found: allLocations?.length || 0,
            location_map_size: locationMap.size,
            sample_locations: allLocations?.slice(0, 3).map(loc => ({
              user_id: loc.user_id.slice(-6),
              lat: loc.latitude,
              lng: loc.longitude,
              updated: loc.updated_at
            })) || []
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
    console.error('❌ [GET-DRIVERS-LOCATIONS] Critical error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch drivers with locations',
        details: error
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});