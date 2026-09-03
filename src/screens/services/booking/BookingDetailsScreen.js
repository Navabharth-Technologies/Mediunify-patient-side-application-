import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const BookingDetailsScreen = ({ navigation, route }) => {

  const appointment =
    route?.params?.appointment;

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>
          Appointment information unavailable.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#263238"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Appointment Details
          </Text>

          <View style={styles.space} />

        </View>

        <View style={styles.successCard}>

          <Ionicons
            name="checkmark-circle"
            size={55}
            color="#2E7D32"
          />

          <Text style={styles.confirmed}>
            Appointment Confirmed
          </Text>

          <Text style={styles.confirmedSubtitle}>
            Your appointment has been successfully booked.
          </Text>

        </View>

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Doctor
          </Text>

          <Text style={styles.doctorName}>
            {appointment.doctor.name}
          </Text>

          <Text style={styles.specialty}>
            {appointment.doctor.specialty}
          </Text>

        </View>

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Appointment Information
          </Text>

          <View style={styles.row}>

            <Ionicons
              name="calendar-outline"
              size={22}
              color="#1976D2"
            />

            <View>
              <Text style={styles.label}>
                Date
              </Text>

              <Text style={styles.value}>
                {appointment.day}, {appointment.date}
              </Text>
            </View>

          </View>

          <View style={styles.row}>

            <Ionicons
              name="time-outline"
              size={22}
              color="#1976D2"
            />

            <View>
              <Text style={styles.label}>
                Time
              </Text>

              <Text style={styles.value}>
                {appointment.time}
              </Text>
            </View>

          </View>

          <View style={styles.row}>

            <Ionicons
              name="videocam-outline"
              size={22}
              color="#1976D2"
            />

            <View>
              <Text style={styles.label}>
                Consultation
              </Text>

              <Text style={styles.value}>
                {appointment.type}
              </Text>
            </View>

          </View>

          <View style={styles.row}>

            <Ionicons
              name="cash-outline"
              size={22}
              color="#1976D2"
            />

            <View>
              <Text style={styles.label}>
                Consultation Fee
              </Text>

              <Text style={styles.value}>
                ₹{appointment.doctor.fee || 500}
              </Text>
            </View>

          </View>

        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() =>
            navigation.navigate('Home')
          }
        >
          <Text style={styles.homeButtonText}>
            Back to Home
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  header: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#263238',
  },

  space: {
    width: 44,
  },

  successCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
  },

  confirmed: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 10,
  },

  confirmedSubtitle: {
    fontSize: 12,
    color: '#558B5A',
    textAlign: 'center',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 15,
  },

  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
  },

  specialty: {
    color: '#1976D2',
    fontSize: 13,
    marginTop: 5,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  label: {
    fontSize: 11,
    color: '#78909C',
    marginLeft: 13,
    marginBottom: 3,
  },

  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263238',
    marginLeft: 13,
  },

  homeButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

});

export default BookingDetailsScreen;