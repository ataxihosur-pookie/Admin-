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
    // Use SERVICE ROLE KEY to create test data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      console.log('🧪 Creating test driver locations...');
      
      // Get all drivers
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('user_id, users!drivers_user_id_fkey(full_name)');

      if (driversError) {
        throw driversError;
      }

      if (!drivers || drivers.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No drivers found in database'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log(`📍 Creating test locations for ${drivers.length} drivers`);

      // Hosur area coordinates (center: 12.1266, 77.8308)
      const hosurCenter = { lat: 12.1266, lng: 77.8308 };
      const radius = 0.05; // ~5km radius

      // Clear existing test locations first
      console.log('🧹 Clearing existing live locations...');
      const { error: clearError } = await supabase
        .from('live_locations')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible ID)

      if (clearError) {
        console.warn('⚠️ Warning clearing existing locations:', clearError);
      }

      // Create test locations for each driver
      const testLocations = drivers.map((driver, index) => {
        // Generate random location within Hosur area
        const randomLat = hosurCenter.lat + (Math.random() - 0.5) * radius;
        const randomLng = hosurCenter.lng + (Math.random() - 0.5) * radius;
        
        return {
          user_id: driver.user_id,
          latitude: randomLat,
          longitude: randomLng,
          heading: Math.random() * 360,
          speed: Math.random() * 60, // 0-60 km/h
          accuracy: 5 + Math.random() * 10, // 5-15 meters
          updated_at: new Date().toISOString()
        };
      });

      console.log('💾 Inserting test locations into live_locations table...');
      const { data: createdLocations, error: locationError } = await supabase
        .from('live_locations')
        .insert(testLocations)
        .select();

      if (locationError) {
        console.error('❌ Error creating test locations:', locationError);
        throw locationError;
      }

      console.log(`✅ Created ${createdLocations?.length || 0} test driver locations`);

      // Log each created location
      createdLocations?.forEach((location, index) => {
        const driver = drivers.find(d => d.user_id === location.user_id);
        console.log(`📍 ${index + 1}. ${driver?.users?.full_name}: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      });

      // Verify the data was inserted by querying back
      const { data: verifyLocations, error: verifyError } = await supabase
        .from('live_locations')
        .select('count');

      console.log('🔍 Verification: Total live_locations records:', verifyLocations);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test driver locations created successfully',
          locations_created: createdLocations?.length || 0,
          drivers_updated: drivers.length,
          center_coordinates: hosurCenter,
          radius_km: radius * 111, // Convert to approximate km
          verification: {
            total_records: verifyLocations?.[0]?.count || 0
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
    console.error('❌ Test location creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create test locations'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});