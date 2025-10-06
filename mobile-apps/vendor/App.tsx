import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import FleetManagementScreen from './src/screens/FleetManagementScreen';
import DriverManagementScreen from './src/screens/DriverManagementScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
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
                backgroundColor: '#7c3aed',
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
              options={{ title: 'Vendor Portal' }}
            />
            <Stack.Screen 
              name="FleetManagement" 
              component={FleetManagementScreen}
              options={{ title: 'Fleet Management' }}
            />
            <Stack.Screen 
              name="DriverManagement" 
              component={DriverManagementScreen}
              options={{ title: 'Driver Management' }}
            />
            <Stack.Screen 
              name="Analytics" 
              component={AnalyticsScreen}
              options={{ title: 'Analytics' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}