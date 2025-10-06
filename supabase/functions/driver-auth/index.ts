import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AuthenticateRequest {
  identifier: string; // username
  password: string;
}

interface VerifySessionRequest {
  user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Use SERVICE ROLE KEY to bypass RLS for authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname;

    // Main authentication endpoint
    if (req.method === 'POST' && path.endsWith('/authenticate')) {
      const { identifier, password }: AuthenticateRequest = await req.json();
      
      console.log('🔐 Driver authentication attempt for username:', identifier);
      
      if (!identifier || !password) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Username and password are required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Step 1: Search in driver_credentials table for the exact username
      console.log('🔍 Searching driver_credentials table for username:', identifier);
      
      const { data: credentialData, error: credentialError } = await supabase
        .from('driver_credentials')
        .select('*')
        .eq('username', identifier)
        .single();

      if (credentialError || !credentialData) {
        console.log('❌ Username not found in driver_credentials:', identifier);
        console.log('❌ Credential error:', credentialError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid username or password'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('✅ Found credentials for username:', identifier);
      console.log('🔍 Credential user_id:', credentialData.user_id);

      // Step 2: Verify password against password_hash
      if (credentialData.password_hash !== password) {
        console.log('❌ Password mismatch for username:', identifier);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid username or password'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('✅ Password verified for username:', identifier);

      // Step 3: Get user details using user_id from credentials
      console.log('👤 Fetching user details for user_id:', credentialData.user_id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', credentialData.user_id)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found for user_id:', credentialData.user_id);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'User profile not found'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('✅ User details found:', userData.full_name);

      // Step 4: Check if user is active and has driver role
      if (!userData.is_active) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Account is deactivated. Please contact admin.'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      if (userData.role !== 'driver') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Account is not authorized for driver access'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Step 5: Get driver profile using the same user_id from credentials
      console.log('🚗 Fetching driver profile for user_id:', credentialData.user_id);
      
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles!fk_drivers_vehicle(
            id,
            registration_number,
            make,
            model,
            year,
            color,
            vehicle_type
          )
        `)
        .eq('user_id', credentialData.user_id)
        .single();

      if (driverError || !driverData) {
        console.error('❌ Driver profile not found for user_id:', credentialData.user_id);
        console.error('❌ Driver error:', driverError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver profile not found. Please contact admin.'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('✅ Driver profile found:', driverData.id);
      console.log('🚗 Vehicle info:', driverData.vehicles ? 'Found' : 'Not assigned');

      // Return successful authentication response
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            role: userData.role,
            is_active: userData.is_active
          },
          driver: {
            id: driverData.id,
            user_id: driverData.user_id,
            license_number: driverData.license_number,
            license_expiry: driverData.license_expiry,
            status: driverData.status,
            rating: driverData.rating,
            total_rides: driverData.total_rides,
            is_verified: driverData.is_verified,
            vehicle: driverData.vehicles ? {
              id: driverData.vehicles.id,
              make: driverData.vehicles.make,
              model: driverData.vehicles.model,
              registration_number: driverData.vehicles.registration_number,
              year: driverData.vehicles.year,
              color: driverData.vehicles.color,
              vehicle_type: driverData.vehicles.vehicle_type
            } : null
          },
          credentials: {
            username: credentialData.username
          },
          message: 'Authentication successful'
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Verify session endpoint
    if (req.method === 'POST' && path.endsWith('/verify-session')) {
      const { user_id }: VerifySessionRequest = await req.json();
      
      console.log('🔍 Verifying session for user_id:', user_id);
      
      if (!user_id) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'User ID is required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user_id)
        .eq('role', 'driver')
        .single();

      if (userError || !userData) {
        console.log('❌ User not found or not a driver:', user_id);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid session'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Get driver data
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles!fk_drivers_vehicle(*)
        `)
        .eq('user_id', user_id)
        .single();

      if (driverError || !driverData) {
        console.log('❌ Driver profile not found for user_id:', user_id);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver profile not found'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('✅ Session verified for driver:', userData.full_name);

      return new Response(
        JSON.stringify({
          success: true,
          user: userData,
          driver: driverData,
          message: 'Session valid'
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Refresh profile endpoint
    if (req.method === 'POST' && path.endsWith('/refresh-profile')) {
      const { user_id }: VerifySessionRequest = await req.json();
      
      if (!user_id) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'User ID is required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Get fresh driver data
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          users!drivers_user_id_fkey(*),
          vehicles!fk_drivers_vehicle(*)
        `)
        .eq('user_id', user_id)
        .single();

      if (driverError || !driverData) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver profile not found'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: driverData.users,
          driver: {
            id: driverData.id,
            user_id: driverData.user_id,
            license_number: driverData.license_number,
            license_expiry: driverData.license_expiry,
            status: driverData.status,
            rating: driverData.rating,
            total_rides: driverData.total_rides,
            is_verified: driverData.is_verified,
            vehicle: driverData.vehicles
          },
          message: 'Profile refreshed'
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('❌ Driver authentication error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});