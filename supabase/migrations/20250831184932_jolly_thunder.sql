/*
  # Initial Taxi App Database Schema

  1. New Tables
    - `users` - Core user profiles with role-based access
    - `drivers` - Driver-specific information and status
    - `vehicles` - Vehicle registration and details
    - `vendors` - Fleet partner information
    - `rides` - Ride requests and trip history
    - `live_locations` - Real-time location tracking
    - `payments` - Payment transactions and records

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure sensitive driver and payment data

  3. Features
    - Real-time location updates
    - Comprehensive ride lifecycle management
    - Multi-role user system
    - Payment tracking and verification
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'customer', 'driver', 'vendor')),
  full_name text NOT NULL,
  phone_number text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  license_number text UNIQUE NOT NULL,
  license_expiry date NOT NULL,
  vehicle_id uuid,
  vendor_id uuid,
  status text DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'busy', 'suspended')),
  rating numeric(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_rides integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  vendor_id uuid,
  registration_number text UNIQUE NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'auto', 'bike')),
  capacity integer DEFAULT 4,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  address text NOT NULL,
  total_vehicles integer DEFAULT 0,
  total_drivers integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_latitude numeric(10,8) NOT NULL,
  pickup_longitude numeric(11,8) NOT NULL,
  pickup_address text NOT NULL,
  pickup_landmark text,
  destination_latitude numeric(10,8) NOT NULL,
  destination_longitude numeric(11,8) NOT NULL,
  destination_address text NOT NULL,
  destination_landmark text,
  status text DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  fare_amount numeric(10,2),
  distance_km numeric(8,2),
  duration_minutes integer,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'wallet')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  cancelled_by uuid REFERENCES users(id),
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Live locations table for real-time tracking
CREATE TABLE IF NOT EXISTS live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  heading numeric(5,2),
  speed numeric(5,2),
  accuracy numeric(8,2),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'wallet')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  gateway_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE drivers ADD CONSTRAINT fk_drivers_vehicle 
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

ALTER TABLE drivers ADD CONSTRAINT fk_drivers_vendor 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_vendor 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vendor_id ON vehicles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rides_customer_id ON rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_live_locations_user_id ON live_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments(ride_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for drivers table
CREATE POLICY "Drivers can read own data"
  ON drivers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Drivers can update own data"
  ON drivers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and vendors can read drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'vendor')
    )
  );

-- RLS Policies for vehicles table
CREATE POLICY "Drivers can read own vehicle"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can read own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for rides table
CREATE POLICY "Users can read own rides"
  ON rides FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR 
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create rides"
  ON rides FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Drivers can update assigned rides"
  ON rides FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all rides"
  ON rides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for live_locations table
CREATE POLICY "Users can manage own location"
  ON live_locations FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Drivers can read customer location during ride"
  ON live_locations FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT customer_id FROM rides 
      WHERE driver_id IN (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      ) AND status IN ('accepted', 'in_progress')
    )
  );

-- RLS Policies for payments table
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    ride_id IN (
      SELECT id FROM rides 
      WHERE customer_id = auth.uid() OR 
      driver_id IN (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can read all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();