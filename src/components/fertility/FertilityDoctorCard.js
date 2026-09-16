import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FertilityDoctorCard = ({ doctor, onPress, onBook }) => {
  if (!doctor) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(doctor)}
      activeOpacity={0.9}
    >
      <View style={styles.topRow}>
        <Image source={{ uri: doctor.image }} style={styles.avatar} />
        <View style={styles.infoCol}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{doctor.rating}</Text>
            <Text style={styles.reviewsText}>({doctor.reviewsCount})</Text>
          </View>
          <Text style={styles.docName} numberOfLines={1}>
            {doctor.name}
          </Text>
          <Text style={styles.specialtyText} numberOfLines={1}>
            {doctor.specialty}
          </Text>
          <Text style={styles.qualificationText} numberOfLines={1}>
            {doctor.qualification}
          </Text>
        </View>
      </View>

      <View style={styles.clinicRow}>
        <Ionicons name="business-outline" size={14} color="#64748B" />
        <Text style={styles.clinicText} numberOfLines={1}>
          {doctor.clinicName} • {doctor.city}
        </Text>
      </View>

      <View style={styles.successPillRow}>
        <View style={styles.successPill}>
          <Ionicons name="ribbon-outline" size={12} color="#E11D48" />
          <Text style={styles.successText}>{doctor.successRate}</Text>
        </View>
        <View style={styles.expPill}>
          <Text style={styles.expText}>{doctor.experienceYears}+ Yrs Exp</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>₹{doctor.fee}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => onBook ? onBook(doctor) : onPress && onPress(doctor)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>Book Consult</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  infoCol: {
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewsText: {
    fontSize: 11,
    color: '#64748B',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  specialtyText: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
    marginTop: 1,
  },
  qualificationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  clinicText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  successPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },
  expPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  expText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feeLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  bookBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FertilityDoctorCard;
