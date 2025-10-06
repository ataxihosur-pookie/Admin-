import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AssignDriverRequest {
  notification_id: string;
  driver_id: string;
  admin_notes?: string;
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
      const { notification_id, driver_id, admin_notes }: AssignDriverRequest = await req.json();
      
      console.log('🚗 Assigning driver to booking:', { notification_id, driver_id });
      
      // Get notification details
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notification_id)
        .single();

      if (notificationError || !notification) {
        throw new Error('Notification not found');
      }

      const rideId = notification.data?.ride_id;
      if (!rideId) {
        throw new Error('Ride ID not found in notification');
      }

      // Get driver details
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          users!drivers_user_id_fkey(full_name, phone_number)
        `)
        .eq('id', driver_id)
        .single();

      if (driverError || !driverData) {
        throw new Error('Driver not found');
      }

      // Update ride with assigned driver
      const { data: updatedRide, error: rideError } = await supabase
        .from('rides')
        .update({
          driver_id: driver_id,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .select()
        .single();

      if (rideError) {
        console.error('❌ Error updating ride:', rideError);
        throw new Error('Failed to assign driver to ride');
      }

      // Update driver status to busy
      await supabase
        .from('drivers')
        .update({ status: 'busy' })
        .eq('id', driver_id);

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notification_id);

      // Create notification for driver
      await supabase
        .from('notifications')
        .insert({
          user_id: driverData.user_id,
          type: 'ride_assigned',
          title: `New ${notification.data.booking_type} Ride Assigned`,
          message: `Pickup: ${notification.data.pickup_address}`,
          data: {
            ride_id: rideId,
            booking_type: notification.data.booking_type,
            pickup_address: notification.data.pickup_address,
            destination_address: notification.data.destination_address,
            customer_name: notification.data.customer_name,
            customer_phone: notification.data.customer_phone,
            admin_notes: admin_notes
          }
        });

      console.log('✅ Driver assigned successfully');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Driver assigned successfully',
          ride: {
            id: updatedRide.id,
            ride_code: updatedRide.ride_code,
            status: updatedRide.status
          },
          driver: {
            id: driverData.id,
            name: driverData.users?.full_name,
            phone: driverData.users?.phone_number
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