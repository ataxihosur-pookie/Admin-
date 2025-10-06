# Deployment Guide

## Architecture Overview

This taxi application uses a **hybrid deployment strategy**:

1. **Admin Backend + Dashboard** (This Project)
   - Web application for platform management
   - Supabase backend with database and edge functions
   - Deployed as a single web application

2. **Mobile Applications** (Separate Projects)
   - Customer App (React Native)
   - Driver App (React Native) 
   - Vendor Portal (React Native)
   - Each deployed independently to app stores

## Current Project: Admin Backend

### What's Included
- ✅ Complete Supabase database schema
- ✅ Admin web dashboard
- ✅ Edge functions for business logic
- ✅ Shared API services and utilities
- ✅ Real-time subscriptions
- ✅ Authentication and authorization

### Deployment Steps
1. **Connect to Supabase** (click button in top right)
2. **Run database migration** (automatic when connected)
3. **Deploy admin dashboard** to web hosting
4. **Configure environment variables** for production

## Mobile Apps: Separate Projects

### Customer App Project
```bash
# Create new Bolt project for customer app
# Copy shared utilities and types
# Connect to same Supabase backend
# Deploy to App Store/Play Store
```

### Driver App Project
```bash
# Create new Bolt project for driver app
# Copy shared utilities and types
# Connect to same Supabase backend
# Deploy to App Store/Play Store
```

### Vendor Portal Project
```bash
# Create new Bolt project for vendor portal
# Copy shared utilities and types
# Connect to same Supabase backend
# Deploy to App Store/Play Store
```

## Shared Backend Connection

All apps connect to the same Supabase project:

### Environment Variables (Same for All Apps)
```env
# Web Admin (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Mobile Apps (.env)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### API Endpoints (Available to All Apps)
- **Database**: Direct Supabase REST API
- **Real-time**: Supabase Realtime channels
- **Edge Functions**: Custom business logic
- **Authentication**: Supabase Auth

## Development Workflow

### Phase 1: Backend Setup (Current Project)
1. ✅ Database schema and migrations
2. ✅ Admin dashboard for management
3. ✅ Edge functions for business logic
4. ✅ API documentation and services

### Phase 2: Customer App (New Project)
1. Create dedicated React Native project
2. Implement ride booking flow
3. Add real-time tracking
4. Integrate payment processing

### Phase 3: Driver App (New Project)
1. Create dedicated React Native project
2. Implement trip acceptance flow
3. Add navigation and tracking
4. Build earnings dashboard

### Phase 4: Vendor Portal (New Project)
1. Create dedicated React Native project
2. Implement fleet management
3. Add driver onboarding
4. Build analytics dashboard

## Benefits of This Architecture

### Single Backend
- ✅ Consistent data across all apps
- ✅ Real-time synchronization
- ✅ Centralized user management
- ✅ Unified analytics and reporting

### Separate App Deployments
- ✅ Independent release cycles
- ✅ App store optimization
- ✅ Team-specific development
- ✅ Platform-specific features

### Shared Utilities
- ✅ Consistent API calls
- ✅ Shared business logic
- ✅ Type safety across platforms
- ✅ Reduced development time

## Next Steps

1. **Complete backend setup** in this project
2. **Create customer app** in new Bolt project
3. **Copy shared utilities** to customer app
4. **Test end-to-end flow** between admin and customer
5. **Repeat for driver and vendor apps**