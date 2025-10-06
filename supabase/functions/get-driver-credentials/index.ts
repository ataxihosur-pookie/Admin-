import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GetCredentialsRequest {
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
    // Use SERVICE ROLE KEY to access driver credentials
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { user_id }: GetCredentialsRequest = await req.json();
      
      console.log('🔍 Fetching driver credentials for user:', user_id);
      
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

      // Get driver credentials from driver_credentials table
      const { data: credentials, error: credentialsError } = await supabase
        .from('driver_credentials')
        .select('username, password_hash, created_at, updated_at')
        .eq('user_id', user_id)
        .single();

      if (credentialsError) {
        console.error('❌ Error fetching credentials:', credentialsError);
        
        if (credentialsError.code === 'PGRST116') {
          // No credentials found
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'No login credentials found for this driver',
              code: 'NO_CREDENTIALS'
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        
        throw credentialsError;
      }

      if (!credentials) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No login credentials found for this driver',
            code: 'NO_CREDENTIALS'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('✅ Driver credentials found:', credentials.username);

      return new Response(
        JSON.stringify({
          success: true,
          credentials: {
            username: credentials.username,
            password: credentials.password_hash, // In production, this should be handled more securely
            created_at: credentials.created_at,
            updated_at: credentials.updated_at
          },
          message: 'Credentials retrieved successfully'
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
    console.error('❌ Get credentials error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch credentials'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});