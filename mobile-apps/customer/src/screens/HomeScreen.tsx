import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const quickBookingOptions = [
    { id: 1, title: 'Sedan', subtitle: '4 seats • AC', price: '₹12/km', icon: 'car' },
    { id: 2, title: 'Auto', subtitle: '3 seats • Open', price: '₹8/km', icon: 'bicycle' },
    { id: 3, title: 'Bike', subtitle: '1 seat • Fast', price: '₹6/km', icon: 'bicycle' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.subtitle}>Where would you like to go?</Text>
      </View>

      {/* Quick Booking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Booking</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickBookingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.quickBookCard}
              onPress={() => navigation.navigate('BookRide', { vehicleType: option.title.toLowerCase() })}
            >
              <Ionicons name={option.icon as any} size={32} color="#2563eb" />
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
              <Text style={styles.cardPrice}>{option.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('BookRide')}
        >
          <Ionicons name="location" size={24} color="white" />
          <Text style={styles.mainButtonText}>Book a Ride Now</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Rides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        <View style={styles.recentRideCard}>
          <View style={styles.rideInfo}>
            <Text style={styles.rideDestination}>MG Road Metro Station</Text>
            <Text style={styles.rideDate}>Yesterday, 6:30 PM</Text>
            <Text style={styles.rideFare}>₹180</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="time" size={20} color="#2563eb" />
            <Text style={styles.actionText}>Schedule Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="receipt" size={20} color="#2563eb" />
            <Text style={styles.actionText}>Ride History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={20} color="#2563eb" />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
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
  quickBookCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: width * 0.4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 4,
  },
  mainButton: {
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
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  recentRideCard: {
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
  rideInfo: {
    flex: 1,
  },
  rideDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rideDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  rideFare: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default HomeScreen;