import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AssignDriverRequest {
  ride_id: string;
  driver_id: string;
  admin_notes?: string;
  source_table?: string;
}

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

    if (req.method === 'POST') {
      const { ride_id, driver_id, admin_notes, source_table }: AssignDriverRequest = await req.json();
      
      console.log('🚗 Assigning driver to ride:', { ride_id, driver_id, admin_notes });
      
      // Validate input
      if (!ride_id || !driver_id) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Ride ID and Driver ID are required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Determine which table to query based on source_table or auto-detect
      let ride = null;
      let isScheduledBooking = false;
      
      if (source_table === 'rides') {
        // Check rides table first if explicitly specified
        console.log('🔍 Checking rides table for ride_id:', ride_id);
        const { data: regularRide, error: regularError } = await supabase
          .from('rides')
          .select(`
            id,
            ride_code,
            status,
            customer_id,
            pickup_address,
            destination_address,
            booking_type,
            users!rides_customer_id_fkey(
              full_name,
              phone_number
            )
          `)
          .eq('id', ride_id)
          .single();
        
        if (!regularError && regularRide) {
          ride = regularRide;
          isScheduledBooking = false;
          console.log('✅ Found regular ride:', ride.ride_code);
        } else {
          console.log('🔍 Not found in rides, checking scheduled_bookings table...');
          // Try scheduled_bookings table as fallback
          const { data: scheduledRide, error: scheduledError } = await supabase
            .from('scheduled_bookings')
            .select(`
              id,
              booking_type,
              status,
              customer_id,
              pickup_address,
              destination_address,
              users:customer_id(
                full_name,
                phone_number
              )
            `)
            .eq('id', ride_id)
            .single();
          
          if (!scheduledError && scheduledRide) {
            ride = {
              ...scheduledRide,
              ride_code: `SB${scheduledRide.id.slice(-6).toUpperCase()}`
            };
            isScheduledBooking = true;
            console.log('✅ Found scheduled booking:', ride.ride_code);
          }
        }
      } else {
        // Check scheduled_bookings table first (default behavior)
        console.log('🔍 Checking scheduled_bookings table for ride_id:', ride_id);
        const { data: scheduledRide, error: scheduledError } = await supabase
          .from('scheduled_bookings')
          .select(`
            id,
            booking_type,
            status,
            customer_id,
            pickup_address,
            destination_address,
            users:customer_id(
              full_name,
              phone_number
            )
          `)
          .eq('id', ride_id)
          .single();
        
        if (!scheduledError && scheduledRide) {
          ride = {
            ...scheduledRide,
            ride_code: `SB${scheduledRide.id.slice(-6).toUpperCase()}`
          };
          isScheduledBooking = true;
          console.log('✅ Found scheduled booking:', ride.ride_code);
        } else {
          console.log('🔍 Not found in scheduled_bookings, checking rides table...');
          // Try rides table as fallback
          const { data: regularRide, error: regularError } = await supabase
            .from('rides')
            .select(`
              id,
              ride_code,
              status,
              customer_id,
              pickup_address,
              destination_address,
              booking_type,
              users!rides_customer_id_fkey(
                full_name,
                phone_number
              )
            `)
            .eq('id', ride_id)
            .single();
          
          if (!regularError && regularRide) {
            ride = regularRide;
            isScheduledBooking = false;
            console.log('✅ Found regular ride:', ride.ride_code);
          }
        }
      }

      if (!ride) {
        console.error('❌ Ride/Booking not found in either table');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Ride or booking not found'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log(`✅ Found ${isScheduledBooking ? 'scheduled booking' : 'ride'}: ${ride.ride_code || ride.id}`);

      // Get driver details
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          status,
          is_verified,
          users!drivers_user_id_fkey(
            full_name,
            phone_number
          )
        `)
        .eq('id', driver_id)
        .single();

      if (driverError || !driver) {
        console.error('❌ Driver not found:', driverError);
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

      // Validate driver availability
      if (driver.status !== 'online') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver is not online'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      if (!driver.is_verified) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Driver is not verified'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Update the appropriate table based on source
      let updatedRecord = null;
      
      if (isScheduledBooking) {
        // Update scheduled_bookings table with assigned_driver_id and status = 'assigned'
        console.log('📝 Updating scheduled_bookings table...');
        const { data: updatedBooking, error: updateError } = await supabase
          .from('scheduled_bookings')
          .update({
            assigned_driver_id: driver_id,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', ride_id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating scheduled booking:', updateError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Failed to assign driver to scheduled booking: ${updateError.message}`
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        
        updatedRecord = updatedBooking;
        console.log('✅ Scheduled booking updated with assigned driver:', driver_id);
      } else {
        // Update rides table with driver_id and status = 'accepted'
        console.log('📝 Updating rides table...');
        const { data: updatedRide, error: updateError } = await supabase
          .from('rides')
          .update({
            driver_id: driver_id,
            status: 'accepted',
            updated_at: new Date().toISOString()
          })
          .eq('id', ride_id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating ride:', updateError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Failed to assign driver to ride'
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        
        updatedRecord = updatedRide;
        console.log('✅ Ride updated with assigned driver');
      }


      console.log('📋 Assignment details:', {
        record_id: ride_id,
        driver_id: driver_id,
        status: isScheduledBooking ? 'assigned' : 'accepted',
        table: isScheduledBooking ? 'scheduled_bookings' : 'rides',
        field_used: isScheduledBooking ? 'assigned_driver_id' : 'driver_id'
      });

      // Update driver status to busy
      const { error: driverUpdateError } = await supabase
        .from('drivers')
        .update({ 
          status: 'busy',
          updated_at: new Date().toISOString()
        })
        .eq('id', driver_id);

      if (driverUpdateError) {
        console.warn('⚠️ Warning: Failed to update driver status:', driverUpdateError);
        // Don't fail the entire operation for this
      }

      // Create notification for driver
      const notificationData = {
        user_id: driver.user_id,
        type: 'ride_assigned',
        title: `New ${ride.booking_type || 'ride'} ${isScheduledBooking ? 'booking' : 'ride'} assigned`,
        message: `Pickup: ${ride.pickup_address}`,
        data: {
          ride_id: ride.id,
          ride_code: ride.ride_code,
          booking_type: ride.booking_type,
          customer_name: ride.users?.full_name,
          customer_phone: ride.users?.phone_number,
          pickup_address: ride.pickup_address,
          destination_address: ride.destination_address,
          admin_notes: admin_notes || null,
          assigned_by: 'admin',
          assigned_at: new Date().toISOString(),
          source_table: isScheduledBooking ? 'scheduled_bookings' : 'rides'
        },
        status: 'unread'
      };

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([notificationData]);

      if (notificationError) {
        console.warn('⚠️ Warning: Failed to create driver notification:', notificationError);
        // Don't fail the entire operation for this
      } else {
        console.log('✅ Driver notification created successfully');
      }

      console.log(`✅ Driver assigned successfully to ${isScheduledBooking ? 'scheduled booking' : 'ride'}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Driver assigned to ${isScheduledBooking ? 'scheduled booking' : 'ride'} successfully`,
          [isScheduledBooking ? 'booking' : 'ride']: {
            id: updatedRecord.id,
            status: updatedRecord.status,
            [isScheduledBooking ? 'assigned_driver_id' : 'driver_id']: driver_id
          },
          driver: {
            id: driver.id,
            name: driver.users?.full_name,
            phone: driver.users?.phone_number
          },
          table_updated: isScheduledBooking ? 'scheduled_bookings' : 'rides'
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
    console.error('❌ Driver assignment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign driver'
      }),
      {
        status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});