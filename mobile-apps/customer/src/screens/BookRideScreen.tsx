import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const BookRideScreen = ({ navigation, route }: any) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(route?.params?.vehicleType || 'sedan');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [estimatedFare, setEstimatedFare] = useState(0);

  const vehicleTypes = [
    { 
      id: 'sedan', 
      name: 'Sedan', 
      subtitle: '4 seats • AC • Comfortable', 
      price: 12, 
      icon: 'car',
      estimatedTime: '3-5 min'
    },
    { 
      id: 'auto', 
      name: 'Auto', 
      subtitle: '3 seats • Open • Affordable', 
      price: 8, 
      icon: 'bicycle',
      estimatedTime: '2-4 min'
    },
    { 
      id: 'bike', 
      name: 'Bike', 
      subtitle: '1 seat • Fast • Quick', 
      price: 6, 
      icon: 'bicycle',
      estimatedTime: '1-3 min'
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to book rides');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address[0]) {
        setPickupLocation(`${address[0].street}, ${address[0].city}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateFare = () => {
    const selectedVehicleType = vehicleTypes.find(v => v.id === selectedVehicle);
    if (selectedVehicleType) {
      // Simple fare calculation (in real app, this would be more sophisticated)
      const baseFare = 50;
      const estimatedDistance = 5; // km
      const fare = baseFare + (estimatedDistance * selectedVehicleType.price);
      setEstimatedFare(fare);
    }
  };

  useEffect(() => {
    calculateFare();
  }, [selectedVehicle]);

  const handleBookRide = () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination locations');
      return;
    }

    // Navigate to ride tracking screen
    navigation.navigate('RideTracking', {
      pickup: pickupLocation,
      destination,
      vehicleType: selectedVehicle,
      estimatedFare
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Location Inputs */}
      <View style={styles.section}>
        <View style={styles.locationContainer}>
          <View style={styles.locationDots}>
            <View style={styles.pickupDot} />
            <View style={styles.routeLine} />
            <View style={styles.destinationDot} />
          </View>
          
          <View style={styles.locationInputs}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.locationInput}
                placeholder="Pickup location"
                value={pickupLocation}
                onChangeText={setPickupLocation}
              />
              <TouchableOpacity onPress={getCurrentLocation}>
                <Ionicons name="locate" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.locationInput}
                placeholder="Where to?"
                value={destination}
                onChangeText={setDestination}
              />
              <TouchableOpacity>
                <Ionicons name="search" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Vehicle Type</Text>
        {vehicleTypes.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle === vehicle.id && styles.selectedVehicleCard
            ]}
            onPress={() => setSelectedVehicle(vehicle.id)}
          >
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleHeader}>
                <Ionicons 
                  name={vehicle.icon as any} 
                  size={24} 
                  color={selectedVehicle === vehicle.id ? '#2563eb' : '#6b7280'} 
                />
                <View style={styles.vehicleDetails}>
                  <Text style={[
                    styles.vehicleName,
                    selectedVehicle === vehicle.id && styles.selectedText
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehicleSubtitle}>{vehicle.subtitle}</Text>
                </View>
              </View>
              <View style={styles.vehiclePricing}>
                <Text style={[
                  styles.vehiclePrice,
                  selectedVehicle === vehicle.id && styles.selectedText
                ]}>
                  ₹{vehicle.price}/km
                </Text>
                <Text style={styles.estimatedTime}>{vehicle.estimatedTime}</Text>
              </View>
            </View>
            {selectedVehicle === vehicle.id && (
              <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Fare Estimate */}
      <View style={styles.section}>
        <View style={styles.fareCard}>
          <Text style={styles.fareTitle}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>₹{estimatedFare}</Text>
          <Text style={styles.fareNote}>Final fare may vary based on actual distance and time</Text>
        </View>
      </View>

      {/* Book Ride Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookRide}
        >
          <Ionicons name="car" size={24} color="white" />
          <Text style={styles.bookButtonText}>Book Ride</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  locationContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationDots: {
    position: 'absolute',
    left: 30,
    top: 35,
    alignItems: 'center',
    zIndex: 1,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#d1d5db',
    marginVertical: 4,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  locationInputs: {
    marginLeft: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 16,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedVehicleCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleDetails: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedText: {
    color: '#2563eb',
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  vehiclePricing: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  fareCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  fareNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BookRideScreen;