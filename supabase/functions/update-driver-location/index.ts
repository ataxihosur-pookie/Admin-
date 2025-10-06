import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface LocationUpdate {
  user_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Use SERVICE ROLE KEY for location updates to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const locationData: LocationUpdate = await req.json();
      
      console.log('📍 Updating driver location:', {
        user_id: locationData.user_id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: new Date().toISOString()
      });
      
      // Validate required fields
      if (!locationData.user_id || !locationData.latitude || !locationData.longitude) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'user_id, latitude, and longitude are required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Validate coordinates
      if (locationData.latitude < -90 || locationData.latitude > 90) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid latitude value'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      if (locationData.longitude < -180 || locationData.longitude > 180) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid longitude value'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Check if driver exists and is active
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id, status, users!drivers_user_id_fkey(full_name)')
        .eq('user_id', locationData.user_id)
        .single();

      if (driverError || !driver) {
        console.error('❌ Driver not found:', driverError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver not found'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Update or insert location record using UPSERT
      const { data: locationRecord, error: locationError } = await supabase
        .from('live_locations')
        .upsert({
          user_id: locationData.user_id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          heading: locationData.heading || null,
          speed: locationData.speed || null,
          accuracy: locationData.accuracy || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (locationError) {
        console.error('❌ Error updating location:', locationError);
        throw locationError;
      }

      console.log(`✅ Location updated for driver: ${driver.users?.full_name} at ${locationData.latitude}, ${locationData.longitude}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Location updated successfully',
          location: {
            user_id: locationRecord.user_id,
            latitude: locationRecord.latitude,
            longitude: locationRecord.longitude,
            updated_at: locationRecord.updated_at
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
    console.error('❌ Location update error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update location'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});