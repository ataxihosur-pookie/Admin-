import { createClient } from 'npm:@supabase/supabase-js@2.56.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface FareRequest {
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  vehicle_type: string;
  time_of_day?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method === 'POST') {
      const fareRequest: FareRequest = await req.json();
      
      // Calculate distance
      const distance = calculateDistance(
        fareRequest.pickup_latitude,
        fareRequest.pickup_longitude,
        fareRequest.destination_latitude,
        fareRequest.destination_longitude
      );

      // Get fare configuration based on vehicle type
      const fareConfig = getFareConfig(fareRequest.vehicle_type);
      
      // Calculate base fare
      let totalFare = fareConfig.baseFare + (distance * fareConfig.perKmRate);
      
      // Apply time-based multipliers (surge pricing)
      const timeMultiplier = getTimeMultiplier(fareRequest.time_of_day);
      totalFare *= timeMultiplier;
      
      // Ensure minimum fare
      totalFare = Math.max(totalFare, fareConfig.minimumFare);
      
      // Add platform fee
      const platformFee = totalFare * (fareConfig.platformFeePercent / 100);
      const finalFare = Math.round(totalFare + platformFee);

      return new Response(
        JSON.stringify({
          success: true,
          fare: {
            baseFare: fareConfig.baseFare,
            distanceFare: distance * fareConfig.perKmRate,
            platformFee,
            totalFare: finalFare,
            distance: Math.round(distance * 100) / 100,
            estimatedDuration: Math.round(distance * 3), // 3 minutes per km estimate
            surgeMultiplier: timeMultiplier
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
    return new Response(
      JSON.stringify({ error: error.message }),
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function getFareConfig(vehicleType: string) {
  const configs = {
    sedan: {
      baseFare: 60,
      perKmRate: 14,
      minimumFare: 60,
      platformFeePercent: 8
    },
    suv: {
      baseFare: 80,
      perKmRate: 18,
      minimumFare: 80,
      platformFeePercent: 8
    },
    hatchback: {
      baseFare: 50,
      perKmRate: 12,
      minimumFare: 50,
      platformFeePercent: 8
    },
    auto: {
      baseFare: 30,
      perKmRate: 8,
      minimumFare: 30,
      platformFeePercent: 5
    },
    bike: {
      baseFare: 20,
      perKmRate: 6,
      minimumFare: 20,
      platformFeePercent: 5
    }
  };
  
  return configs[vehicleType as keyof typeof configs] || configs.sedan;
}

function getTimeMultiplier(timeOfDay?: string): number {
  if (!timeOfDay) return 1.0;
  
  const hour = new Date().getHours();
  
  // Peak hours: 8-10 AM, 6-9 PM
  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21)) {
    return 1.5; // 50% surge
  }
  
  // Late night: 11 PM - 6 AM
  if (hour >= 23 || hour <= 6) {
    return 1.3; // 30% surge
  }
  
  return 1.0; // Normal pricing
}