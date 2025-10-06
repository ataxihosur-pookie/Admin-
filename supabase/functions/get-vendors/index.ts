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
    // Use SERVICE ROLE KEY to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      console.log('🔍 Fetching all vendors with service role...');
      
      // Fetch vendors with user details using service role (bypasses RLS)
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          *,
          users!vendors_user_id_fkey(
            full_name,
            email,
            phone_number,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (vendorsError) {
        console.error('❌ Error fetching vendors:', vendorsError);
        throw vendorsError;
      }

      console.log(`✅ Found ${vendors?.length || 0} vendors`);
      
      // Transform data to flatten user information
      const transformedVendors = vendors?.map(vendor => ({
        id: vendor.id,
        user_id: vendor.user_id,
        company_name: vendor.company_name,
        license_number: vendor.license_number,
        address: vendor.address,
        total_vehicles: vendor.total_vehicles,
        total_drivers: vendor.total_drivers,
        is_verified: vendor.is_verified,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at,
        full_name: vendor.users?.full_name,
        email: vendor.users?.email,
        phone_number: vendor.users?.phone_number,
        is_active: vendor.users?.is_active
      })) || [];

      return new Response(
        JSON.stringify({
          success: true,
          vendors: transformedVendors,
          count: transformedVendors.length
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
    console.error('❌ Get vendors error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vendors'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});