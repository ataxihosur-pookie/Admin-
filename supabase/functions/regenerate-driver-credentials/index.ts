import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RegenerateCredentialsRequest {
  user_id: string;
  driver_name: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Use SERVICE ROLE KEY to update driver credentials
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { user_id, driver_name }: RegenerateCredentialsRequest = await req.json();
      
      console.log('🔄 Regenerating credentials for driver:', driver_name);
      
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

      // Generate new credentials
      const newUsername = generateUsername(driver_name);
      const newPassword = generatePassword();
      
      console.log('🔐 Generated new credentials:', { username: newUsername });

      // Check if credentials exist
      const { data: existingCredentials, error: checkError } = await supabase
        .from('driver_credentials')
        .select('id')
        .eq('user_id', user_id)
        .single();

      let credentialsResult;

      if (existingCredentials) {
        // Update existing credentials
        console.log('📝 Updating existing credentials...');
        const { data, error } = await supabase
          .from('driver_credentials')
          .update({
            username: newUsername,
            password_hash: newPassword,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)
          .select()
          .single();
        
        credentialsResult = { data, error };
      } else {
        // Create new credentials
        console.log('➕ Creating new credentials...');
        const { data, error } = await supabase
          .from('driver_credentials')
          .insert({
            user_id: user_id,
            username: newUsername,
            password_hash: newPassword
          })
          .select()
          .single();
        
        credentialsResult = { data, error };
      }

      if (credentialsResult.error) {
        console.error('❌ Error updating credentials:', credentialsResult.error);
        throw credentialsResult.error;
      }

      console.log('✅ Credentials updated successfully');

      // Create notification for driver about new credentials
      await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          type: 'credentials_updated',
          title: 'Login Credentials Updated',
          message: `Your login credentials have been updated. New username: ${newUsername}`,
          data: {
            username: newUsername,
            password: newPassword,
            updated_by: 'admin',
            updated_at: new Date().toISOString()
          },
          status: 'unread'
        });

      return new Response(
        JSON.stringify({
          success: true,
          credentials: {
            username: newUsername,
            password: newPassword,
            created_at: credentialsResult.data.created_at,
            updated_at: credentialsResult.data.updated_at
          },
          message: 'New credentials generated successfully'
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
    console.error('❌ Regenerate credentials error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate credentials'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

function generateUsername(driverName: string): string {
  // Create username from driver name + random suffix
  const cleanName = driverName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomSuffix}`;
}

function generatePassword(): string {
  // Generate a secure 8-character password
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}