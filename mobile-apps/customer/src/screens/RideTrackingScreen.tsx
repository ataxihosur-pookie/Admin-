import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const RideTrackingScreen = ({ navigation, route }: any) => {
  const { pickup, destination, vehicleType, estimatedFare } = route.params;
  const [rideStatus, setRideStatus] = useState<'searching' | 'accepted' | 'arriving' | 'in_progress' | 'completed'>('searching');
  const [driverInfo, setDriverInfo] = useState({
    name: 'Rajesh Kumar',
    rating: 4.8,
    vehicle: 'KA 01 AB 1234',
    phone: '+91 98765 43210'
  });
  const [estimatedArrival, setEstimatedArrival] = useState('3 min');

  useEffect(() => {
    // Simulate ride status progression
    const statusProgression = ['searching', 'accepted', 'arriving', 'in_progress', 'completed'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < statusProgression.length - 1) {
        currentIndex++;
        setRideStatus(statusProgression[currentIndex] as any);
      } else {
        clearInterval(interval);
      }
    }, 5000); // Change status every 5 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'searching':
        return {
          title: 'Finding your driver...',
          subtitle: 'We\'re matching you with the best available driver',
          color: '#f59e0b',
          icon: 'search'
        };
      case 'accepted':
        return {
          title: 'Driver found!',
          subtitle: `${driverInfo.name} is coming to pick you up`,
          color: '#059669',
          icon: 'checkmark-circle'
        };
      case 'arriving':
        return {
          title: 'Driver is arriving',
          subtitle: `Estimated arrival: ${estimatedArrival}`,
          color: '#2563eb',
          icon: 'car'
        };
      case 'in_progress':
        return {
          title: 'On the way',
          subtitle: 'Enjoy your ride to the destination',
          color: '#7c3aed',
          icon: 'navigate'
        };
      case 'completed':
        return {
          title: 'Trip completed',
          subtitle: 'Thank you for riding with us!',
          color: '#059669',
          icon: 'checkmark-circle'
        };
      default:
        return {
          title: 'Processing...',
          subtitle: 'Please wait',
          color: '#6b7280',
          icon: 'time'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleCallDriver = () => {
    Alert.alert('Call Driver', `Calling ${driverInfo.name}...`);
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color="#9ca3af" />
          <Text style={styles.mapText}>Live Map View</Text>
          <Text style={styles.mapSubtext}>Real-time tracking will be shown here</Text>
        </View>
      </View>

      {/* Ride Info Card */}
      <View style={styles.rideCard}>
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon as any} size={24} color="white" />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} style={{ backgroundColor: '#059669' }} />
            <Text style={styles.locationText} numberOfLines={1}>{pickup}</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} style={{ backgroundColor: '#dc2626' }} />
            <Text style={styles.locationText} numberOfLines={1}>{destination}</Text>
          </View>
        </View>

        {/* Driver Info (when driver is assigned) */}
        {(rideStatus === 'accepted' || rideStatus === 'arriving' || rideStatus === 'in_progress') && (
          <View style={styles.driverInfo}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color="#2563eb" />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverInfo.name}</Text>
                <View style={styles.driverMeta}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.driverRating}>{driverInfo.rating}</Text>
                  <Text style={styles.driverVehicle}>• {driverInfo.vehicle}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={handleCallDriver}
              >
                <Ionicons name="call" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fare Information */}
        <View style={styles.fareInfo}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Vehicle Type</Text>
            <Text style={styles.fareValue}>{vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareValue}>₹{estimatedFare}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {rideStatus === 'searching' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRide}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
          
          {rideStatus === 'completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.completeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mapContainer: {
    height: height * 0.5,
    backgroundColor: '#e5e7eb',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  rideCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  tripDetails: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  driverInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  driverRating: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 2,
  },
  driverVehicle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareInfo: {
    padding: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButtons: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideTrackingScreen;