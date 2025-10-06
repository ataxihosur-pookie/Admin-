# Setup Guide

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Expo CLI**: Install globally with `npm install -g @expo/cli`
3. **Mobile Development**: 
   - iOS: Xcode (Mac only)
   - Android: Android Studio
   - Or use Expo Go app for testing

## Initial Setup

### 1. Supabase Configuration

1. Click "Connect to Supabase" in the top right of this interface
2. Copy your project URL and anon key
3. The environment variables will be automatically configured

### 2. Database Setup

Run the database migration to create all necessary tables:
```sql
-- The migration file is already created in supabase/migrations/
-- It will be applied when you connect to Supabase
```

### 3. Admin Dashboard (Web)

The admin dashboard is ready to run:
```bash
npm run dev:admin
```

Access at `http://localhost:3000` with admin credentials.

### 4. Mobile Apps Setup

For each mobile app, you'll need to:

#### Customer App
```bash
cd mobile-apps/customer
npm install
npm start
```

#### Driver App
```bash
cd mobile-apps/driver
npm install
npm start
```

#### Vendor Portal
```bash
cd mobile-apps/vendor
npm install
npm start
```

## Environment Variables

Each mobile app needs its own environment configuration:

### Customer App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Driver App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Vendor Portal (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

### Web Admin Dashboard
- Open `http://localhost:3000`
- Use admin credentials to log in
- Verify dashboard loads with statistics

### Mobile Apps
- Use Expo Go app to scan QR code
- Test on iOS Simulator or Android Emulator
- Verify authentication and navigation

## Development Tips

1. **Hot Reload**: All apps support hot reload for faster development
2. **Shared Code**: Utilities and types are in the `/shared` directory
3. **Database Changes**: Always create new migration files
4. **Testing**: Use Expo Go for quick testing on real devices

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Ensure environment variables are set correctly
2. **Metro Bundler**: Clear cache with `npx expo start --clear`
3. **Dependencies**: Run `npm install` in each app directory
4. **Ports**: Ensure ports 3000 (admin) and 8081 (expo) are available

### Getting Help

- Check the console for error messages
- Verify Supabase connection in the dashboard
- Ensure all dependencies are installed
- Check that the database migration has run successfully