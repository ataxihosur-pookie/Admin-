import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CreateVendorRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  licenseNumber: string;
  address: string;
  totalVehicles: number;
  totalDrivers: number;
  fleetDescription: string;
  operatingAreas: string;
  serviceTypes: string[];
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
      const vendorData: CreateVendorRequest = await req.json();
      
      console.log('🚀 Starting vendor creation with service role...');
      
      // Normalize data
      const normalizedEmail = vendorData.email.toLowerCase().trim();
      const normalizedLicense = vendorData.licenseNumber.toUpperCase().trim();
      
      // Step 1: Check for existing records (using service role - no RLS)
      console.log('🔍 Checking for existing records...');
      
      const [emailCheck, licenseCheck] = await Promise.all([
        supabase.from('users').select('id').ilike('email', normalizedEmail).limit(1),
        supabase.from('vendors').select('id').ilike('license_number', normalizedLicense).limit(1)
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
          full_name: vendorData.fullName.trim(),
          phone_number: vendorData.phoneNumber.trim(),
          role: 'vendor',
          is_active: true
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ User creation error:', userError);
        throw new Error(`Profile creation failed: ${userError.message}`);
      }
      
      console.log('✅ User profile created:', userData.id);
      
      // Step 3: Create vendor profile (SERVICE ROLE BYPASSES RLS)
      console.log('🏢 Creating vendor profile...');
      const { data: vendorRecord, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          company_name: vendorData.companyName.trim(),
          license_number: normalizedLicense,
          address: vendorData.address.trim(),
          total_vehicles: vendorData.totalVehicles,
          total_drivers: vendorData.totalDrivers,
          is_verified: false
        })
        .select()
        .single();
      
      if (vendorError) {
        console.error('❌ Vendor creation error:', vendorError);
        throw new Error(`Vendor profile creation failed: ${vendorError.message}`);
      }
      
      console.log('✅ Vendor profile created:', vendorRecord.id);
      
      // Step 4: Create Supabase Auth user (SERVICE ROLE BYPASSES RLS)
      console.log('🔐 Creating Supabase auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: vendorData.password,
        email_confirm: true,
        user_metadata: {
          full_name: vendorData.fullName,
          role: 'vendor'
        }
      });
      
      if (authError) {
        console.warn('⚠️ Auth user creation warning:', authError);
        // Continue anyway as main records are created
      } else {
        console.log('✅ Auth user created:', authUser.user?.id);
      }
      
      console.log('🎉 Vendor creation completed successfully!');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Vendor created successfully!',
          vendor: {
            id: vendorRecord.id,
            user_id: userId,
            company_name: vendorData.companyName,
            full_name: vendorData.fullName,
            email: normalizedEmail,
            phone_number: vendorData.phoneNumber,
            license_number: normalizedLicense,
            address: vendorData.address,
            total_vehicles: vendorData.totalVehicles,
            total_drivers: vendorData.totalDrivers,
            driver_names: vendorData.driverNames,
            driver_licenses: vendorData.driverLicenses,
            driver_phones: vendorData.driverPhones,
            vehicle_registrations: vendorData.vehicleRegistrations,
            vehicle_makes: vendorData.vehicleMakes,
            vehicle_models: vendorData.vehicleModels,
            vehicle_types: vendorData.vehicleTypes,
            username: vendorData.username,
            password: vendorData.password
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
    console.error('❌ Vendor creation failed:', error);
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