import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const AppointmentCard = ({
  appointment,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >

      <View style={styles.header}>

        <View style={styles.doctorIcon}>
          <Ionicons
            name="person-outline"
            size={25}
            color="#2E7D32"
          />
        </View>

        <View style={styles.doctorInfo}>

          <Text style={styles.doctorName}>
            {appointment.doctorName}
          </Text>

          <Text style={styles.specialization}>
            {appointment.specialization}
          </Text>

        </View>

        <View style={styles.statusContainer}>

          <Text style={styles.status}>
            {appointment.status}
          </Text>

        </View>

      </View>


      <View style={styles.details}>

        <View style={styles.detailRow}>

          <Ionicons
            name="calendar-outline"
            size={18}
            color="#607D8B"
          />

          <Text style={styles.detailText}>
            {appointment.date}
          </Text>

        </View>


        <View style={styles.detailRow}>

          <Ionicons
            name="time-outline"
            size={18}
            color="#607D8B"
          />

          <Text style={styles.detailText}>
            {appointment.time}
          </Text>

        </View>


        <View style={styles.detailRow}>

          <Ionicons
            name="location-outline"
            size={18}
            color="#607D8B"
          />

          <Text style={styles.detailText}>
            {appointment.location}
          </Text>

        </View>

      </View>

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  doctorIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },

  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#263238',
  },

  specialization: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 4,
  },

  statusContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  status: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },

  details: {
    marginTop: 15,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  detailText: {
    fontSize: 12,
    color: '#607D8B',
    marginLeft: 8,
  },

});

export default AppointmentCard;