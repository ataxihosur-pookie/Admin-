import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import RideRequestScreen from './src/screens/RideRequestScreen';
import NavigationScreen from './src/screens/NavigationScreen';
import EarningsScreen from './src/screens/EarningsScreen';
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
                backgroundColor: '#059669',
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
              options={{ title: 'Driver Dashboard' }}
            />
            <Stack.Screen 
              name="RideRequest" 
              component={RideRequestScreen}
              options={{ title: 'Ride Request' }}
            />
            <Stack.Screen 
              name="Navigation" 
              component={NavigationScreen}
              options={{ title: 'Navigate to Customer' }}
            />
            <Stack.Screen 
              name="Earnings" 
              component={EarningsScreen}
              options={{ title: 'Earnings' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}