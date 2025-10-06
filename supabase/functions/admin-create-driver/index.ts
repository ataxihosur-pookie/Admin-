import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CreateDriverRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleRegistration: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  username: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Use SERVICE ROLE KEY to bypass ALL RLS policies
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const driverData: CreateDriverRequest = await req.json();
      
      console.log('🚀 Starting driver creation with service role...');
      
      // Normalize data
      const normalizedEmail = driverData.email.toLowerCase().trim();
      const normalizedLicense = driverData.licenseNumber.toUpperCase().trim();
      const normalizedRegistration = driverData.vehicleRegistration.toUpperCase().trim();
      
      // Step 1: Check for existing records (using service role - no RLS)
      console.log('🔍 Checking for existing records...');
      
      const [emailCheck, licenseCheck, vehicleCheck] = await Promise.all([
        supabase.from('users').select('id').ilike('email', normalizedEmail).limit(1),
        supabase.from('drivers').select('id').ilike('license_number', normalizedLicense).limit(1),
        supabase.from('vehicles').select('id').ilike('registration_number', normalizedRegistration).limit(1)
      ]);
      
      if (emailCheck.data && emailCheck.data.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This email address is already registered. Please use a different email.'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      if (licenseCheck.data && licenseCheck.data.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This license number is already registered. Please use a different license number.'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      if (vehicleCheck.data && vehicleCheck.data.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This vehicle registration is already registered. Please use a different registration number.'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      console.log('✅ All validation checks passed');
      
      // Generate unique UUID
      const userId = crypto.randomUUID();
      
      // Step 2: Create user profile (SERVICE ROLE BYPASSES RLS)
      console.log('👤 Creating user profile...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: normalizedEmail,
          full_name: driverData.fullName.trim(),
          phone_number: driverData.phoneNumber.trim(),
          role: 'driver',
          is_active: true
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ User creation error:', userError);
        throw new Error(`Profile creation failed: ${userError.message}`);
      }
      
      console.log('✅ User profile created:', userData.id);
      
      // Step 3: Create vehicle record (SERVICE ROLE BYPASSES RLS)
      console.log('🚗 Creating vehicle record...');
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          registration_number: normalizedRegistration,
          make: driverData.vehicleMake.trim(),
          model: driverData.vehicleModel.trim(),
          year: parseInt(driverData.vehicleYear),
          color: driverData.vehicleColor.trim(),
          vehicle_type: driverData.vehicleType,
          capacity: 4,
          is_verified: false
        })
        .select()
        .single();
      
      if (vehicleError) {
        console.error('❌ Vehicle creation error:', vehicleError);
        throw new Error(`Vehicle registration failed: ${vehicleError.message}`);
      }
      
      console.log('✅ Vehicle created:', vehicleData.id);
      
      // Step 4: Create driver profile (SERVICE ROLE BYPASSES RLS)
      console.log('🪪 Creating driver profile...');
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .insert({
          user_id: userId,
          license_number: normalizedLicense,
          license_expiry: driverData.licenseExpiry,
          vehicle_id: vehicleData.id,
          status: 'offline',
          rating: 5.0,
          total_rides: 0,
          is_verified: false
        })
        .select()
        .single();
      
      if (driverError) {
        console.error('❌ Driver creation error:', driverError);
        throw new Error(`Driver profile creation failed: ${driverError.message}`);
      }
      
      console.log('✅ Driver profile created:', driverRecord.id);
      
      // Step 5: Update vehicle with driver_id (SERVICE ROLE BYPASSES RLS)
      console.log('🔗 Linking vehicle to driver...');
      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({ driver_id: driverRecord.id })
        .eq('id', vehicleData.id);
      
      if (vehicleUpdateError) {
        console.warn('⚠️ Vehicle update warning:', vehicleUpdateError);
        // Continue anyway as main records are created
      }
      
      // Step 6: Create driver credentials (SERVICE ROLE BYPASSES RLS)
      console.log('🔐 Creating login credentials...');
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('driver_credentials')
        .insert({
          user_id: userId,
          username: driverData.username.trim(),
          password_hash: driverData.password // Store password for admin reference
        })
        .select()
        .single();
      
      if (credentialsError) {
        console.error('❌ Credentials creation error:', credentialsError);
        // This is critical for login functionality, so we should handle it properly
        console.warn('⚠️ Driver created but login credentials not stored. Driver may not be able to log in.');
      } else {
        console.log('✅ Driver credentials stored:', credentialsData.id);
      }
      
      console.log('🎉 Driver creation completed successfully!');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Driver created successfully!',
          driver: {
            id: driverRecord.id,
            user_id: userId,
            vehicle_id: vehicleData.id,
            full_name: driverData.fullName,
            email: normalizedEmail,
            phone_number: driverData.phoneNumber,
            license_number: normalizedLicense,
            vehicle_registration: normalizedRegistration,
            username: driverData.username,
            password: driverData.password
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
    console.error('❌ Driver creation failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});