// App configuration
export const APP_CONFIG = {
  name: 'TaxiApp',
  version: '1.0.0',
  supportEmail: 'support@taxiapp.com',
  supportPhone: '+91-800-TAXI-APP'
};

// Ride status configurations
export const RIDE_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const RIDE_STATUS_LABELS = {
  [RIDE_STATUS.REQUESTED]: 'Looking for driver',
  [RIDE_STATUS.ACCEPTED]: 'Driver assigned',
  [RIDE_STATUS.IN_PROGRESS]: 'On the way',
  [RIDE_STATUS.COMPLETED]: 'Trip completed',
  [RIDE_STATUS.CANCELLED]: 'Trip cancelled'
};

// Driver status configurations
export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
  SUSPENDED: 'suspended'
} as const;

export const DRIVER_STATUS_LABELS = {
  [DRIVER_STATUS.OFFLINE]: 'Offline',
  [DRIVER_STATUS.ONLINE]: 'Available',
  [DRIVER_STATUS.BUSY]: 'On Trip',
  [DRIVER_STATUS.SUSPENDED]: 'Suspended'
};

// Vehicle types
export const VEHICLE_TYPES = {
  HATCHBACK: 'hatchback',
  HATCHBACK_AC: 'hatchback_ac',
  SEDAN: 'sedan',
  SEDAN_AC: 'sedan_ac',
  SUV: 'suv',
  SUV_AC: 'suv_ac'
} as const;

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.HATCHBACK]: 'Hatchback',
  [VEHICLE_TYPES.HATCHBACK_AC]: 'Hatchback AC',
  [VEHICLE_TYPES.SEDAN]: 'Sedan',
  [VEHICLE_TYPES.SEDAN_AC]: 'Sedan AC',
  [VEHICLE_TYPES.SUV]: 'SUV',
  [VEHICLE_TYPES.SUV_AC]: 'SUV AC'
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet'
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CARD]: 'Credit/Debit Card',
  [PAYMENT_METHODS.WALLET]: 'Digital Wallet'
};

// Fare calculation constants
export const FARE_CONFIG = {
  baseFare: 50, // Base fare in INR
  perKmRate: 12, // Rate per kilometer
  perMinuteRate: 2, // Rate per minute
  minimumFare: 50, // Minimum fare
  cancellationFee: 25, // Cancellation fee after driver acceptance
  platformFee: 5 // Platform fee percentage
};

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: { latitude: 12.9716, longitude: 77.5946 }, // Bangalore
  defaultZoom: 13,
  maxZoom: 18,
  minZoom: 10
};

// App theme colors
export const COLORS = {
  admin: {
    primary: '#dc2626',
    secondary: '#fca5a5',
    background: '#fef2f2'
  },
  customer: {
    primary: '#2563eb',
    secondary: '#93c5fd',
    background: '#eff6ff'
  },
  driver: {
    primary: '#059669',
    secondary: '#6ee7b7',
    background: '#ecfdf5'
  },
  vendor: {
    primary: '#7c3aed',
    secondary: '#c4b5fd',
    background: '#f5f3ff'
  }
};