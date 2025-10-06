import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface BookingNotificationRequest {
  ride_id: string;
  booking_type: 'rental' | 'outstation' | 'airport';
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_address: string;
  destination_address: string;
  vehicle_type: string;
  fare_amount?: number;
  special_instructions?: string;
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
      const notificationData: BookingNotificationRequest = await req.json();
      
      console.log('📢 Creating admin booking notification:', notificationData);
      
      console.log('🔍 Searching for admin users...');
      
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (adminError) {
        console.error('❌ Error fetching admin users:', adminError);
        throw adminError;
      }

      console.log('👥 Found admin users:', adminUsers);

      if (!adminUsers || adminUsers.length === 0) {
        console.log('⚠️ No active admin users found, creating admin with SERVICE ROLE...');
        
        // Create admin user using SERVICE ROLE KEY (bypasses ALL RLS policies)
        const adminId = '00000000-0000-0000-0000-000000000001';
        
        console.log('👤 Force creating admin user with SERVICE ROLE KEY...');
        
        // First, try to find if admin already exists but wasn't found in the query
        const { data: existingAdminCheck, error: existingError } = await supabase
          .from('users')
          .select('*')
          .eq('id', adminId)
          .maybeSingle();
        
        console.log('🔍 Existing admin check result:', { existingAdminCheck, existingError });
        
        if (existingAdminCheck) {
          console.log('✅ Found existing admin, ensuring proper role...');
          
          // Update existing admin to ensure proper role and status
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              role: 'admin', 
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', adminId);
          
          if (updateError) {
            console.error('❌ Error updating existing admin:', updateError);
          } else {
            console.log('✅ Updated existing admin successfully');
          }
          
          // Use existing admin for notification
          const notification = {
            user_id: adminId,
            type: 'admin_booking',
            title: `New ${getBookingTypeLabel(notificationData.booking_type)} Booking`,
            message: `Customer: ${notificationData.customer_name} • Pickup: ${notificationData.pickup_address}`,
            data: {
              ride_id: notificationData.ride_id,
              booking_type: notificationData.booking_type,
              customer_id: notificationData.customer_id,
              customer_name: notificationData.customer_name,
              customer_phone: notificationData.customer_phone,
              pickup_address: notificationData.pickup_address,
              destination_address: notificationData.destination_address,
              vehicle_type: notificationData.vehicle_type,
              fare_amount: notificationData.fare_amount,
              special_instructions: notificationData.special_instructions,
              requires_allocation: true
            },
            status: 'unread'
          };
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([notification]);
          
          if (notificationError) {
            console.error('❌ Error creating notification for existing admin:', notificationError);
            throw notificationError;
          }
          
          console.log('✅ Notification created for existing admin');
          return new Response(
            JSON.stringify({
              success: true,
              message: `Admin notification created for ${notificationData.booking_type} booking`,
              notifications_created: 1,
              admin_found: true
            }),
            {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        
        // Create new admin user
        console.log('👤 Creating new admin user...');
        const { data: newAdmin, error: createError } = await supabase
          .from('users')
          .insert({
            id: adminId,
            email: 'admin@taxiapp.com',
            role: 'admin',
            full_name: 'System Administrator',
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Admin creation error:', createError);
          console.error('❌ Full error details:', JSON.stringify(createError, null, 2));
          
          // If we can't create admin, return error
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to create admin user: ${createError.message}`,
              details: createError
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        } else {
          console.log('✅ New admin created successfully:', newAdmin.id);
          
          // Create notification for new admin
          const notification = {
            user_id: newAdmin.id,
            type: 'admin_booking',
            title: `New ${getBookingTypeLabel(notificationData.booking_type)} Booking`,
            message: `Customer: ${notificationData.customer_name} • Pickup: ${notificationData.pickup_address}`,
            data: {
              ride_id: notificationData.ride_id,
              booking_type: notificationData.booking_type,
              customer_id: notificationData.customer_id,
              customer_name: notificationData.customer_name,
              customer_phone: notificationData.customer_phone,
              pickup_address: notificationData.pickup_address,
              destination_address: notificationData.destination_address,
              vehicle_type: notificationData.vehicle_type,
              fare_amount: notificationData.fare_amount,
              special_instructions: notificationData.special_instructions,
              requires_allocation: true
            },
            status: 'unread'
          };
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([notification]);
          
          if (!notificationError) {
            console.log('✅ Notification created for new admin');
            return new Response(
              JSON.stringify({
                success: true,
                message: `Admin notification created for ${notificationData.booking_type} booking`,
                notifications_created: 1,
                admin_created: true
              }),
              {
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
              }
            );
          }
        }
      }

      // Create notification for the single admin (there should only be one)
      const admin = adminUsers[0]; // Use the first (and should be only) admin
      const notification = {
        user_id: admin.id,
        type: 'admin_booking',
        title: `New ${getBookingTypeLabel(notificationData.booking_type)} Booking`,
        message: `Customer: ${notificationData.customer_name} • Pickup: ${notificationData.pickup_address}`,
        data: {
          ride_id: notificationData.ride_id,
          booking_type: notificationData.booking_type,
          customer_id: notificationData.customer_id,
          customer_name: notificationData.customer_name,
          customer_phone: notificationData.customer_phone,
          pickup_address: notificationData.pickup_address,
          destination_address: notificationData.destination_address,
          vehicle_type: notificationData.vehicle_type,
          fare_amount: notificationData.fare_amount,
          special_instructions: notificationData.special_instructions,
          requires_allocation: true
        },
        status: 'unread'
      };

      const { data: createdNotification, error: notificationError } = await supabase
        .from('notifications')
        .insert([notification])
        .select();

      if (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        throw notificationError;
      }

      console.log(`✅ Created admin notification for user: ${admin.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Admin notifications created for ${notificationData.booking_type} booking`,
          notifications_created: 1
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
    console.error('❌ Admin booking notification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create notification'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

function getBookingTypeLabel(bookingType: string): string {
  const labels = {
    rental: 'Rental',
    outstation: 'Outstation',
    airport: 'Airport Transfer'
  };
  return labels[bookingType as keyof typeof labels] || 'Special';
}