import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface BookingRequest {
  customer_id: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  pickup_address: string;
  destination_latitude: number;
  destination_longitude: number;
  destination_address: string;
  pickup_landmark?: string;
  destination_landmark?: string;
  destination_address: string;
  booking_type: 'rental' | 'outstation' | 'airport';
  vehicle_type: string;
  rental_hours?: number;
  estimated_fare?: number;
  special_requirements?: string;
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
      const bookingData: BookingRequest = await req.json();
      
      console.log('📝 Creating scheduled booking for special trip:', bookingData);
      
      // Create scheduled booking record
      const { data: booking, error: bookingError } = await supabase
        .from('scheduled_bookings')
        .insert({
          customer_id: bookingData.customer_id,
          booking_type: bookingData.booking_type,
          vehicle_type: bookingData.vehicle_type,
          pickup_address: bookingData.pickup_address,
          destination_address: bookingData.destination_address,
          pickup_landmark: bookingData.pickup_landmark,
          destination_landmark: bookingData.destination_landmark,
          pickup_latitude: bookingData.pickup_latitude,
          pickup_longitude: bookingData.pickup_longitude,
          destination_latitude: bookingData.destination_latitude,
          destination_longitude: bookingData.destination_longitude,
          rental_hours: bookingData.rental_hours,
          special_instructions: bookingData.special_requirements,
          estimated_fare: bookingData.estimated_fare,
          status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      console.log('✅ Scheduled booking created:', booking.id);
      
      // Create admin notification for the booking
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('full_name, phone_number')
        .eq('id', bookingData.customer_id)
        .single();
      
      if (!customerError && customer) {
        // Get admin users
        const { data: adminUsers, error: adminError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .eq('is_active', true);
        
        if (adminUsers && adminUsers.length > 0) {
          // Create notification for each admin
          const notifications = adminUsers.map(admin => ({
            user_id: admin.id,
            type: 'admin_booking',
            title: `New ${getBookingTypeLabel(bookingData.booking_type)} Booking`,
            message: `Customer: ${customer.full_name} • Pickup: ${bookingData.pickup_address}`,
            data: {
              booking_id: booking.id,
              booking_type: bookingData.booking_type,
              customer_id: bookingData.customer_id,
              customer_name: customer.full_name,
              customer_phone: customer.phone_number,
              pickup_address: bookingData.pickup_address,
              destination_address: bookingData.destination_address,
              vehicle_type: bookingData.vehicle_type,
              rental_hours: bookingData.rental_hours,
              estimated_fare: bookingData.estimated_fare,
              special_instructions: bookingData.special_requirements,
              requires_allocation: true
            },
            status: 'unread'
          }));
          
          await supabase.from('notifications').insert(notifications);
          console.log(`✅ Created ${notifications.length} admin notifications`);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Scheduled booking created successfully. Admin will assign a driver shortly.',
          booking: {
            id: booking.id,
            booking_type: booking.booking_type,
            status: booking.status
          }
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error creating special booking:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create booking',
        details: error
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
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