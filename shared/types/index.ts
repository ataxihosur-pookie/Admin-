// User roles and authentication types
export type UserRole = 'admin' | 'customer' | 'driver' | 'vendor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Driver specific types
export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  vehicle_id?: string;
  vendor_id?: string;
  status: 'offline' | 'online' | 'busy' | 'suspended';
  rating: number;
  total_rides: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Vehicle types
export interface Vehicle {
  id: string;
  driver_id?: string;
  vendor_id?: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: 'hatchback' | 'hatchback_ac' | 'sedan' | 'sedan_ac' | 'suv' | 'suv_ac';
  capacity: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Fare Matrix types
export interface FareMatrix {
  id: string;
  booking_type: 'regular' | 'rental' | 'outstation' | 'airport';
  vehicle_type: 'hatchback' | 'hatchback_ac' | 'sedan' | 'sedan_ac' | 'suv' | 'suv_ac';
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  minimum_fare: number;
  surge_multiplier: number;
  platform_fee_percent: number;
  cancellation_fee: number;
  hourly_rate: number; // For rental bookings only
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Vendor types
export interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  address: string;
  total_vehicles: number;
  total_drivers: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Ride types
export interface Ride {
  id: string;
  ride_code: string;
  customer_id: string;
  driver_id?: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  pickup_landmark?: string;
  destination_latitude: number;
  destination_longitude: number;
  destination_address: string;
  destination_landmark?: string;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  fare_amount?: number;
  distance_km?: number;
  duration_minutes?: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method: 'cash' | 'card' | 'wallet';
  rating?: number;
  feedback?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
}

export interface LiveLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updated_at: string;
}

// Payment types
export interface Payment {
  id: string;
  ride_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  gateway_response?: any;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Common UI types
export interface SelectOption {
  value: string;
  label: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// React Native specific types
export interface NavigationProps {
  navigation: any;
  route?: any;
}

export interface ScreenProps extends NavigationProps {
  // Common props for all screens
}