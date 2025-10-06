import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CreateDriverRequest {
  fullName: string;
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleRegistration?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const driverData: CreateDriverRequest = await req.json();
      
      // Check if license number already exists
      const { data: existingDriver, error: checkError } = await supabase
        .from('drivers')
        .select('id')
        .eq('license_number', driverData.licenseNumber)
        .single();
      
      if (existingDriver) {
        return new Response(
          JSON.stringify({ 
            error: `License number ${driverData.licenseNumber} is already registered`,
            code: 'DUPLICATE_LICENSE'
          }),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
      
      // Create user account first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: driverData.email,
        password: driverData.password,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Update user profile with username and role
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            full_name: driverData.fullName,
            role: 'driver',
            phone_number: driverData.phoneNumber
          })
          .eq('id', authData.user.id);
        
        if (userUpdateError) {
          console.error('User profile update error:', userUpdateError);
        }
        
        // Create driver profile
        const { data: driverRecord, error: driverError } = await supabase
          .from('drivers')
          .insert({
            user_id: authData.user.id,
            license_number: driverData.licenseNumber,
            license_expiry: driverData.licenseExpiry,
            status: 'offline',
            is_verified: false,
            rating: 5.0,
            total_rides: 0
          })
          .select()
          .single();
        
        if (driverError) throw driverError;

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Driver created successfully',
            username: driverData.username,
            password: driverData.password,
            driver: driverRecord,
            user: authData.user
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
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
    console.error('Error creating driver:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create driver',
        details: error
      }),
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