# Taxi App Ecosystem

A comprehensive taxi application system similar to Namma Yatri, built with a hybrid architecture combining React web and React Native mobile applications, all connected to a shared Supabase backend.

## Architecture

This is a hybrid monorepo containing one web application and three mobile applications:

- **Admin Dashboard** (`/src`) - Web-based platform management and analytics
- **Customer App** (`/mobile-apps/customer`) - React Native ride booking app
- **Driver App** (`/mobile-apps/driver`) - React Native trip management app
- **Vendor Portal** (`/mobile-apps/vendor`) - React Native fleet management app

## Shared Infrastructure

- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Real-time**: Supabase Realtime for live updates
- **Authentication**: Role-based access control
- **Database**: Comprehensive schema for multi-tenant operations

## Getting Started

### Prerequisites

1. **Supabase Setup**: Click the "Connect to Supabase" button in the top right to set up your Supabase project
2. **Expo CLI**: Install globally with `npm install -g @expo/cli`
3. **Environment Variables**: Ensure your `.env` file contains the Supabase credentials

### Development

```bash
# Install dependencies
npm install

# Start specific applications
npm run dev:admin     # Web admin dashboard (port 3000)
npm run dev:customer  # Customer React Native app
npm run dev:driver    # Driver React Native app
npm run dev:vendor    # Vendor React Native app
```

## Database Schema

The system uses a single Supabase database with the following core tables:

- `users` - User profiles with role-based access
- `drivers` - Driver information and status
- `vehicles` - Vehicle registration and details
- `vendors` - Fleet partner information
- `rides` - Ride requests and trip history
- `live_locations` - Real-time location tracking
- `payments` - Payment transactions

## Features

### Core Functionality
- Multi-role user authentication
- Real-time ride matching
- Live location tracking
- Fare calculation and payment processing
- Driver and vehicle verification
- Comprehensive analytics
- Native mobile experience for field users
- Web-based admin interface for management

### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Secure API endpoints
- Data encryption and validation

## Development Phases

1. **Phase 1**: ✅ Hybrid architecture and backend setup
2. **Phase 2**: Customer app with ride booking
3. **Phase 3**: Driver app with trip management
4. **Phase 4**: Admin dashboard features
5. **Phase 5**: Vendor portal

## Technology Stack

### Web (Admin Dashboard)
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
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

## Project Structure

```
/
├── src/              # Web admin dashboard
│   ├── components/   # React components
│   ├── pages/        # Admin pages
│   ├── hooks/        # React hooks
│   └── utils/        # Web utilities
├── mobile-apps/      # React Native applications
│   ├── customer/     # Customer mobile app
│   ├── driver/       # Driver mobile app
│   └── vendor/       # Vendor mobile app
├── shared/           # Shared utilities, types, and components
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions and helpers
│   └── services/     # API service classes
├── supabase/         # Database schema and functions
│   └── migrations/   # SQL migration files
└── docs/             # Documentation
```

## Next Steps

1. Set up Supabase connection
2. Run the initial database migration
3. Install mobile app dependencies
4. Implement authentication flows
5. Add map integration and location services
6. Build core ride booking functionality
7. Implement real-time features

For detailed setup instructions, see `/docs/SETUP.md` and `/docs/ARCHITECTURE.md`.