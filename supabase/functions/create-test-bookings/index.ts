import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CreateTestBookingsRequest {
  create_customer: boolean;
  create_bookings: boolean;
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
      const { create_customer, create_bookings }: CreateTestBookingsRequest = await req.json();
      
      console.log('🚀 Creating test data with service role...');
      
      let customerId = '00000000-0000-0000-0000-000000000002'; // Default test customer ID
      
      if (create_customer) {
        // Check if test customer already exists
        const { data: existingCustomer, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', customerId)
          .single();
        
        if (!existingCustomer) {
          console.log('👤 Creating test customer with service role...');
          
          const { data: newCustomer, error: createCustomerError } = await supabase
            .from('users')
            .insert({
              id: customerId,
              email: 'testcustomer@example.com',
              full_name: 'Test Customer',
              phone_number: '+91 98765 43210',
              role: 'customer',
              is_active: true
            })
            .select()
            .single();
          
          if (createCustomerError) {
            console.error('❌ Error creating test customer:', createCustomerError);
            throw new Error(`Failed to create test customer: ${createCustomerError.message}`);
          }
          
          console.log('✅ Test customer created:', newCustomer.id);
        } else {
          console.log('✅ Test customer already exists:', customerId);
        }
      }
      
      if (create_bookings) {
        // Clear existing test bookings first
        console.log('🧹 Clearing existing test bookings...');
        await supabase
          .from('scheduled_bookings')
          .delete()
          .eq('customer_id', customerId);
        
        console.log('📝 Creating new test scheduled bookings...');
        
        const testBookings = [
          {
            customer_id: customerId,
            booking_type: 'rental',
            vehicle_type: 'sedan_ac',
            pickup_address: 'Hosur Bus Stand, Hosur',
            destination_address: 'Multiple stops within Hosur',
            pickup_landmark: 'Near State Bank',
            destination_landmark: 'Various locations',
            pickup_latitude: 12.1266,
            pickup_longitude: 77.8308,
            destination_latitude: 12.1366,
            destination_longitude: 77.8408,
            rental_hours: 6,
            special_instructions: 'Need AC vehicle for 6-hour city tour with multiple stops',
            estimated_fare: 1800,
            status: 'pending'
          },
          {
            customer_id: customerId,
            booking_type: 'outstation',
            vehicle_type: 'suv_ac',
            pickup_address: 'Hosur Railway Station',
            destination_address: 'Bangalore Airport, Bengaluru',
            pickup_landmark: 'Platform 1 exit',
            destination_landmark: 'Terminal 1 Departure',
            pickup_latitude: 12.1200,
            pickup_longitude: 77.8250,
            destination_latitude: 13.1986,
            destination_longitude: 77.7066,
            special_instructions: 'Early morning departure at 5 AM, need spacious vehicle for luggage',
            estimated_fare: 2500,
            status: 'pending',
            scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          {
            customer_id: customerId,
            booking_type: 'airport',
            vehicle_type: 'sedan_ac',
            pickup_address: 'Electronic City, Bangalore',
            destination_address: 'Kempegowda International Airport',
            pickup_landmark: 'Infosys Gate 1',
            destination_landmark: 'Terminal 2 Departure',
            pickup_latitude: 12.8456,
            pickup_longitude: 77.6632,
            destination_latitude: 13.1986,
            destination_longitude: 77.7066,
            special_instructions: 'Flight at 8 PM, need to reach by 6 PM',
            estimated_fare: 1200,
            status: 'pending',
            scheduled_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        const { data: createdBookings, error: createError } = await supabase
          .from('scheduled_bookings')
          .insert(testBookings)
          .select();
        
        if (createError) {
          console.error('❌ Error creating test bookings:', createError);
          throw new Error(`Failed to create test bookings: ${createError.message}`);
        }
        
        console.log(`✅ Created ${createdBookings?.length || 0} test scheduled bookings`);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Test scheduled bookings created successfully',
            customer_created: create_customer,
            bookings_created: createdBookings?.length || 0,
            customer_id: customerId
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test data creation completed',
          customer_id: customerId
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
    console.error('❌ Test data creation failed:', error);
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