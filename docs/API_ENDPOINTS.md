# API Endpoints Documentation

## Base URL
- **Admin Dashboard**: `http://localhost:3000`
- **Supabase API**: `https://your-project.supabase.co`

## Authentication Endpoints

### POST /auth/signin
```json
{
  "email": "admin@taxiapp.com",
  "password": "password"
}
```

### POST /auth/signup
```json
{
  "email": "user@example.com",
  "password": "password",
  "full_name": "John Doe",
  "role": "customer|driver|vendor|admin",
  "phone_number": "+91 98765 43210"
}
```

## Core API Endpoints (via Supabase)

### Users Management
- `GET /rest/v1/users` - List all users (admin only)
- `GET /rest/v1/users?id=eq.{user_id}` - Get user profile
- `PATCH /rest/v1/users?id=eq.{user_id}` - Update user profile
- `DELETE /rest/v1/users?id=eq.{user_id}` - Delete user (admin only)

### Rides Management
- `GET /rest/v1/rides` - List rides (filtered by role)
- `POST /rest/v1/rides` - Create new ride
- `PATCH /rest/v1/rides?id=eq.{ride_id}` - Update ride status
- `GET /rest/v1/rides?customer_id=eq.{user_id}` - Customer's rides
- `GET /rest/v1/rides?driver_id=eq.{user_id}` - Driver's rides

### Drivers Management
- `GET /rest/v1/drivers` - List drivers
- `POST /rest/v1/drivers` - Register new driver
- `PATCH /rest/v1/drivers?id=eq.{driver_id}` - Update driver info
- `GET /rest/v1/drivers?status=eq.online` - Available drivers

### Vehicles Management
- `GET /rest/v1/vehicles` - List vehicles
- `POST /rest/v1/vehicles` - Register vehicle
- `PATCH /rest/v1/vehicles?id=eq.{vehicle_id}` - Update vehicle

### Live Locations (Real-time)
- `POST /rest/v1/live_locations` - Update location
- `GET /rest/v1/live_locations?user_id=eq.{user_id}` - Get user location
- **Real-time Channel**: `live_locations` for live tracking

### Payments
- `GET /rest/v1/payments?ride_id=eq.{ride_id}` - Get ride payments
- `POST /rest/v1/payments` - Process payment
- `PATCH /rest/v1/payments?id=eq.{payment_id}` - Update payment status

## Headers Required

```javascript
{
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
  'apikey': supabaseAnonKey
}
```

## Real-time Subscriptions

### Driver Location Updates
```javascript
supabase
  .channel('driver_locations')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_locations'
  }, (payload) => {
    // Handle location updates
  })
  .subscribe()
```

### Ride Status Updates
```javascript
supabase
  .channel('ride_updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rides'
  }, (payload) => {
    // Handle ride status changes
  })
  .subscribe()
```