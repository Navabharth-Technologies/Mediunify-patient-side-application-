import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const DoctorCard = ({
  doctor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >

      <View style={styles.topRow}>

        {doctor.image ? (
          <Image
            source={{ uri: doctor.image }}
            style={styles.doctorImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="person-outline"
              size={32}
              color="#2E7D32"
            />
          </View>
        )}

        <View style={styles.doctorInfo}>

          <Text style={styles.doctorName}>
            {doctor.name}
          </Text>

          <Text style={styles.specialization}>
            {doctor.specialization}
          </Text>

          <View style={styles.experienceRow}>

            <Ionicons
              name="briefcase-outline"
              size={14}
              color="#78909C"
            />

            <Text style={styles.experience}>
              {doctor.experience} experience
            </Text>

          </View>

        </View>

      </View>


      <View style={styles.divider} />


      <View style={styles.bottomRow}>

        <View style={styles.locationContainer}>

          <Ionicons
            name="location-outline"
            size={16}
            color="#78909C"
          />

          <Text style={styles.location}>
            {doctor.location}
          </Text>

        </View>

        <Text style={styles.fee}>
          ₹{doctor.fee}
        </Text>

      </View>


      <View style={styles.availabilityRow}>

        <View style={styles.availableContainer}>

          <View style={styles.availableDot} />

          <Text style={styles.availableText}>
            Available
          </Text>

        </View>

        <Text style={styles.viewProfile}>
          View Profile
        </Text>

        <Ionicons
          name="chevron-forward"
          size={17}
          color="#2E7D32"
        />

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

  topRow: {
    flexDirection: 'row',
  },

  doctorImage: {
    width: 75,
    height: 75,
    borderRadius: 18,
  },

  imagePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  doctorInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 4,
  },

  specialization: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 7,
  },

  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  experience: {
    fontSize: 12,
    color: '#78909C',
    marginLeft: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#ECEFF1',
    marginVertical: 14,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  location: {
    fontSize: 12,
    color: '#607D8B',
    marginLeft: 5,
  },

  fee: {
    fontSize: 15,
    fontWeight: '800',
    color: '#263238',
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  availableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#43A047',
    marginRight: 6,
  },

  availableText: {
    fontSize: 12,
    color: '#43A047',
    fontWeight: '600',
  },

  viewProfile: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
    marginRight: 4,
  },

});

export default DoctorCard;