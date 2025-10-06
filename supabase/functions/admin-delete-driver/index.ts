import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DeleteDriverRequest {
  driver_id: string;
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
      const { driver_id }: DeleteDriverRequest = await req.json();
      
      console.log('🗑️ Starting driver deletion with service role...');
      console.log('🔍 Driver ID to delete:', driver_id);
      
      if (!driver_id) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver ID is required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Step 1: Get driver details before deletion
      console.log('🔍 Fetching driver details...');
      const { data: driverData, error: driverFetchError } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          vehicle_id,
          users!drivers_user_id_fkey(
            full_name,
            email
          )
        `)
        .eq('id', driver_id)
        .single();

      if (driverFetchError || !driverData) {
        console.error('❌ Driver not found:', driverFetchError);
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

      console.log('✅ Driver found:', driverData.users?.full_name);

      // Step 2: Delete driver credentials
      console.log('🔐 Deleting driver credentials...');
      const { error: credentialsError } = await supabase
        .from('driver_credentials')
        .delete()
        .eq('user_id', driverData.user_id);

      if (credentialsError) {
        console.warn('⚠️ Warning: Failed to delete credentials:', credentialsError);
        // Continue anyway
      } else {
        console.log('✅ Driver credentials deleted');
      }

      // Step 3: Delete vehicle if assigned
      if (driverData.vehicle_id) {
        console.log('🚗 Deleting assigned vehicle...');
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', driverData.vehicle_id);

        if (vehicleError) {
          console.warn('⚠️ Warning: Failed to delete vehicle:', vehicleError);
          // Continue anyway
        } else {
          console.log('✅ Vehicle deleted');
        }
      }

      // Step 4: Delete driver profile
      console.log('👤 Deleting driver profile...');
      const { error: driverDeleteError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driver_id);

      if (driverDeleteError) {
        console.error('❌ Failed to delete driver profile:', driverDeleteError);
        throw new Error(`Failed to delete driver profile: ${driverDeleteError.message}`);
      }

      console.log('✅ Driver profile deleted');

      // Step 5: Delete user profile
      console.log('👤 Deleting user profile...');
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', driverData.user_id);

      if (userDeleteError) {
        console.warn('⚠️ Warning: Failed to delete user profile:', userDeleteError);
        // Continue anyway as main driver record is deleted
      } else {
        console.log('✅ User profile deleted');
      }

      console.log('🎉 Driver deletion completed successfully!');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Driver deleted successfully',
          deleted_driver: {
            id: driver_id,
            name: driverData.users?.full_name,
            email: driverData.users?.email
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
    console.error('❌ Driver deletion failed:', error);
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