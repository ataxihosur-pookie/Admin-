import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import BookRideScreen from './src/screens/BookRideScreen';
import RideTrackingScreen from './src/screens/RideTrackingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Book a Ride' }}
            />
            <Stack.Screen 
              name="BookRide" 
              component={BookRideScreen}
              options={{ title: 'Book Your Ride' }}
            />
            <Stack.Screen 
              name="RideTracking" 
              component={RideTrackingScreen}
              options={{ title: 'Track Your Ride' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}