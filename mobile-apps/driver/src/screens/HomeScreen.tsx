import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { locationService } from '../services/locationService';

const HomeScreen = ({ navigation }: any) => {
  const { driver, updateDriverStatus, user } = useAuth();
  const [isOnline, setIsOnline] = useState(driver?.status === 'online');
  const [todayEarnings] = useState(1250);
  const [todayRides] = useState(8);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);

  // Update online status when driver status changes
  useEffect(() => {
    if (driver) {
      setIsOnline(driver.status === 'online');
    }
  }, [driver?.status]);

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      
      if (newStatus) {
        // Going online - check location permissions first
        setLocationStatus('Checking location permissions...');
        const currentLocation = await locationService.getCurrentLocation();
        if (!currentLocation) {
          Alert.alert(
            'Location Required',
            'Location access is required to go online. Please enable location permissions.',
            [{ text: 'OK' }]
          );
          setLocationStatus('Location permission denied');
          return;
        }
        
        setLocationStatus('Starting location tracking...');
        await updateDriverStatus('online');
        setLocationStatus('✅ Location tracking active - sending updates every 10 seconds');
      } else {
        // Going offline
        setLocationStatus('Stopping location tracking...');
        await updateDriverStatus('offline');
        setLocationStatus('🔴 Location tracking stopped');
      }
      
      setIsOnline(newStatus);
      
    } catch (error) {
      console.error('❌ Error toggling online status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
      setLocationStatus(`❌ Error: ${error.message}`);
    }
  };

  // Monitor location tracking status and count updates
  useEffect(() => {
    const interval = setInterval(() => {
      const status = locationService.getTrackingStatus();
      if (status.isTracking) {
        setLocationUpdateCount(prev => prev + 1);
        setLocationStatus(`📍 Tracking active - Update #${locationUpdateCount + 1} (User: ${status.userId?.slice(-6)})`);
      } else {
        setLocationStatus('📍 Not tracking');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [locationUpdateCount]);

  // Force send location for testing
  const forceSendLocation = async () => {
    try {
      setLocationStatus('🧪 Force sending current location...');
      const success = await locationService.forceSendLocation();
      if (success) {
        setLocationStatus('✅ Location sent successfully!');
        setLocationUpdateCount(prev => prev + 1);
      } else {
        setLocationStatus('❌ Failed to send location');
      }
    } catch (error) {
      console.error('❌ Error force sending location:', error);
      setLocationStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={[styles.statusHeader, isOnline ? styles.onlineHeader : styles.offlineHeader]}>
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            {isOnline ? 'You are Online' : 'You are Offline'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isOnline ? 'Ready to accept rides' : 'Go online to start earning'}
          </Text>
          {locationStatus && (
            <Text style={styles.locationStatus}>
              {locationStatus}
            </Text>
          )}
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleOnlineStatus}
          trackColor={{ false: '#f3f4f6', true: '#10b981' }}
          thumbColor={isOnline ? '#ffffff' : '#9ca3af'}
        />
      </View>

      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        
        {/* Location Tracking Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>📍 Location Tracking Status</Text>
          <Text style={styles.debugText}>Status: {locationStatus}</Text>
          <Text style={styles.debugText}>Updates sent: {locationUpdateCount}</Text>
          <Text style={styles.debugText}>Driver ID: {driver?.id || 'Not logged in'}</Text>
          <Text style={styles.debugText}>User ID: {user?.id || 'Not logged in'}</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={forceSendLocation}
          >
            <Text style={styles.testButtonText}>🧪 Test Send Location</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#059669" />
            <Text style={styles.statValue}>₹{todayEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color="#2563eb" />
            <Text style={styles.statValue}>{todayRides}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="analytics" size={32} color="#059669" />
            <Text style={styles.actionTitle}>Earnings</Text>
            <Text style={styles.actionSubtitle}>View detailed reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="time" size={32} color="#2563eb" />
            <Text style={styles.actionTitle}>Trip History</Text>
            <Text style={styles.actionSubtitle}>Past rides</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="car-sport" size={32} color="#7c3aed" />
            <Text style={styles.actionTitle}>Vehicle</Text>
            <Text style={styles.actionSubtitle}>Manage details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="help-circle" size={32} color="#f59e0b" />
            <Text style={styles.actionTitle}>Support</Text>
            <Text style={styles.actionSubtitle}>Get help</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Trip to MG Road</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
            <Text style={styles.activityEarning}>₹180</Text>
          </View>
          <View style={styles.activityStatus}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
          </View>
        </View>
      </View>

      {/* Go Online Button */}
      {!isOnline && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.goOnlineButton}
            onPress={toggleOnlineStatus}
          >
            <Ionicons name="power" size={24} color="white" />
            <Text style={styles.goOnlineText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineHeader: {
    backgroundColor: '#059669',
  },
  offlineHeader: {
    backgroundColor: '#6b7280',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  locationStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  debugContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  activityEarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  activityStatus: {
    marginLeft: 16,
  },
  goOnlineButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  goOnlineText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;