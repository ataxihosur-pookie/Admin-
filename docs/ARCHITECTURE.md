# Taxi App Ecosystem Architecture

## Overview

This is a hybrid architecture combining web and mobile technologies:

- **Admin Dashboard**: React web application for platform management
- **Customer App**: React Native mobile app for ride booking
- **Driver App**: React Native mobile app for trip management
- **Vendor Portal**: React Native mobile app for fleet management

## Technology Stack

### Web (Admin Dashboard)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Mobile Apps (Customer, Driver, Vendor)
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **Maps**: React Native Maps
- **Location**: Expo Location
- **Icons**: Expo Vector Icons

### Shared Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Functions

## Project Structure

```
/
├── src/                    # Web admin dashboard
│   ├── components/         # React components
│   ├── pages/             # Admin pages
│   ├── hooks/             # React hooks
│   ├── utils/             # Web utilities
│   └── types/             # Web-specific types
├── mobile-apps/           # React Native applications
│   ├── customer/          # Customer mobile app
│   ├── driver/            # Driver mobile app
│   └── vendor/            # Vendor mobile app
├── shared/                # Shared code and utilities
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Helper functions
│   ├── services/          # API service classes
│   └── constants/         # App constants
├── supabase/              # Backend configuration
│   └── migrations/        # Database migrations
└── docs/                  # Documentation
```

## Database Schema

### Core Tables
- `users` - User profiles with role-based access
- `drivers` - Driver information and status
- `vehicles` - Vehicle registration and details
- `vendors` - Fleet partner information
- `rides` - Ride requests and trip history
- `live_locations` - Real-time location tracking
- `payments` - Payment transactions

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Secure API endpoints with authentication

## Development Workflow

### Admin Dashboard (Web)
```bash
npm run dev:admin    # Starts on port 3000
```

### Mobile Apps
```bash
# Customer App
cd mobile-apps/customer && npm start

# Driver App  
cd mobile-apps/driver && npm start

# Vendor Portal
cd mobile-apps/vendor && npm start
```

## Authentication Flow

1. **Admin**: Web-based login with admin role verification
2. **Mobile Apps**: Email/password authentication with role-specific access
3. **Shared Session**: All apps use the same Supabase auth system

## Real-time Features

- Live location tracking for drivers
- Real-time ride status updates
- Push notifications for ride events
- Live driver availability updates

## Deployment Strategy

- **Admin Dashboard**: Web deployment (Vercel/Netlify)
- **Mobile Apps**: Expo Application Services (EAS)
- **Backend**: Supabase hosted infrastructure

## Next Steps

1. Connect to Supabase and run database migrations
2. Set up environment variables for each app
3. Implement authentication flows
4. Add map integration and location services
5. Build core ride booking functionality
6. Implement real-time features
7. Add payment processing
8. Deploy to respective platforms