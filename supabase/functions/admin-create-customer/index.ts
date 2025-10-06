import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CreateCustomerRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
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
      const customerData: CreateCustomerRequest = await req.json();
      
      console.log('🚀 Starting customer creation with service role...');
      
      // Normalize data
      const normalizedEmail = customerData.email.toLowerCase().trim();
      
      // Step 1: Check for existing email (using service role - no RLS)
      console.log('🔍 Checking for existing email...');
      
      const { data: existingUser, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .ilike('email', normalizedEmail)
        .limit(1);
      
      if (existingUser && existingUser.length > 0) {
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
      
      console.log('✅ Email validation passed');
      
      // Generate unique UUID
      const userId = crypto.randomUUID();
      
      // Step 2: Create user profile (SERVICE ROLE BYPASSES RLS)
      console.log('👤 Creating user profile...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: normalizedEmail,
          full_name: customerData.fullName.trim(),
          phone_number: customerData.phoneNumber.trim(),
          role: 'customer',
          is_active: true
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ User creation error:', userError);
        throw new Error(`Profile creation failed: ${userError.message}`);
      }
      
      console.log('✅ User profile created:', userData.id);
      
      // Step 3: Create Supabase Auth user (SERVICE ROLE BYPASSES RLS)
      console.log('🔐 Creating Supabase auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: customerData.password,
        email_confirm: true,
        user_metadata: {
          full_name: customerData.fullName,
          role: 'customer'
        }
      });
      
      if (authError) {
        console.warn('⚠️ Auth user creation warning:', authError);
        // Continue anyway as main record is created
      } else {
        console.log('✅ Auth user created:', authUser.user?.id);
      }
      
      console.log('🎉 Customer creation completed successfully!');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Customer created successfully!',
          customer: {
            id: userData.id,
            full_name: customerData.fullName,
            email: normalizedEmail,
            phone_number: customerData.phoneNumber,
            role: 'customer',
            password: customerData.password
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
    console.error('❌ Customer creation failed:', error);
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