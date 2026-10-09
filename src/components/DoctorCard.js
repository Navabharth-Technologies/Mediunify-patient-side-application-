import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OptimizedImage from './common/OptimizedImage';
import { useTheme } from '../context/ThemeContext';

const DoctorCard = ({
  doctor,
  onPress,
}) => {
  const { t, isIndic } = useTheme();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        {doctor.image ? (
          <OptimizedImage
            source={{ uri: doctor.image }}
            style={styles.doctorImage}
            fallbackIcon="person-outline"
            fallbackColor="#007D69"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="person-outline"
              size={32}
              color="#007D69"
            />
          </View>
        )}

        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>
            {doctor.name}
          </Text>

          <Text style={[styles.specialization, isIndic && { lineHeight: 18 }]}>
            {t(doctor.specialization, doctor.specialization)}
          </Text>

          <View style={styles.experienceRow}>
            <Ionicons
              name="briefcase-outline"
              size={14}
              color="#78909C"
            />
            <Text style={[styles.experience, isIndic && { lineHeight: 16 }]}>
              {doctor.experience} {t('common.experience', 'experience')}
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
          <Text style={[styles.location, isIndic && { lineHeight: 16 }]}>
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
          <Text style={[styles.availableText, isIndic && { lineHeight: 16 }]}>
            {t('common.available', 'Available')}
          </Text>
        </View>

        <Text style={[styles.viewProfile, isIndic && { lineHeight: 16 }]}>
          {t('common.view_details', 'View Profile')}
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
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
  },
  specialization: {
    fontSize: 14,
    color: '#007D69',
    marginTop: 4,
    fontWeight: '700',
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  experience: {
    fontSize: 12,
    color: '#78909C',
    marginLeft: 5,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEFF1',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#546E7A',
    marginLeft: 5,
    fontWeight: '600',
  },
  fee: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  availableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    color: '#2E7D32',
  },
  viewProfile: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
});

export default DoctorCard;