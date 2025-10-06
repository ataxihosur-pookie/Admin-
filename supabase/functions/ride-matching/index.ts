import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RideRequest {
  customer_id: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  vehicle_type: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const rideRequest: RideRequest = await req.json();
      
      // Find nearby available drivers
      const { data: nearbyDrivers, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          vehicles!inner(vehicle_type),
          live_locations!inner(latitude, longitude)
        `)
        .eq('status', 'online')
        .eq('vehicles.vehicle_type', rideRequest.vehicle_type);

      if (driversError) throw driversError;

      // Calculate distances and find closest driver
      const driversWithDistance = nearbyDrivers?.map(driver => {
        const distance = calculateDistance(
          rideRequest.pickup_latitude,
          rideRequest.pickup_longitude,
          driver.live_locations.latitude,
          driver.live_locations.longitude
        );
        return { ...driver, distance };
      }).sort((a, b) => a.distance - b.distance);

      // Create ride record
      const rideCode = generateRideCode();
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .insert({
          ride_code: rideCode,
          customer_id: rideRequest.customer_id,
          pickup_latitude: rideRequest.pickup_latitude,
          pickup_longitude: rideRequest.pickup_longitude,
          destination_latitude: rideRequest.destination_latitude,
          destination_longitude: rideRequest.destination_longitude,
          status: 'requested'
        })
        .select()
        .single();

      if (rideError) throw rideError;

      return new Response(
        JSON.stringify({
          success: true,
          ride,
          nearbyDrivers: driversWithDistance?.slice(0, 5) || []
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function generateRideCode(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `RIDE_${timestamp}_${randomStr}`.toUpperCase();
}