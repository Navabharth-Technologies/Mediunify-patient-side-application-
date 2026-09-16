import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ClinicCard = ({ clinic, onPress, onCompare, isSelectedForCompare }) => {
  if (!clinic) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(clinic)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: clinic.image }} style={styles.coverImage} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {clinic.name}
            </Text>
            <Text style={styles.tagline} numberOfLines={1}>
              {clinic.tagline}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingNum}>{clinic.rating}</Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color="#64748B" />
          <Text style={styles.addressText} numberOfLines={1}>
            {clinic.address}
          </Text>
        </View>

        <View style={styles.certRow}>
          {clinic.certifications.slice(0, 3).map((cert, index) => (
            <View key={index} style={styles.certPill}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.certText}>{cert}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Success Rate</Text>
            <Text style={[styles.metricVal, { color: '#E11D48' }]}>{clinic.successRate}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>IVF Package</Text>
            <Text style={styles.metricVal}>₹{(clinic.ivfPackagePrice / 1000).toFixed(0)}k</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Specialists</Text>
            <Text style={styles.metricVal}>{clinic.doctorsCount} Docs</Text>
          </View>
        </View>

        {clinic.doctorsList && clinic.doctorsList.length > 0 && (
          <View style={styles.doctorsPreviewBox}>
            <View style={styles.docHeaderRow}>
              <Ionicons name="medical" size={12} color="#0F766E" />
              <Text style={styles.docHeaderTitle}>
                Available Doctors ({clinic.doctorsList.length})
              </Text>
            </View>
            <Text style={styles.docNamesList} numberOfLines={1}>
              {clinic.doctorsList.join(' • ')}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          {onCompare && (
            <TouchableOpacity
              style={[styles.compareBtn, isSelectedForCompare && styles.compareBtnActive]}
              onPress={() => onCompare(clinic)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSelectedForCompare ? 'checkbox' : 'square-outline'}
                size={15}
                color={isSelectedForCompare ? '#E11D48' : '#64748B'}
              />
              <Text
                style={[
                  styles.compareBtnText,
                  isSelectedForCompare && { color: '#E11D48', fontWeight: '700' },
                ]}
              >
                Compare
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.viewDoctorsBtn}
            onPress={() => onPress && onPress(clinic, 'doctors')}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={13} color="#0F766E" />
            <Text style={styles.viewDoctorsText}>
              Doctors ({clinic.doctorsList ? clinic.doctorsList.length : clinic.doctorsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => onPress && onPress(clinic, 'overview')}
            activeOpacity={0.85}
          >
            <Text style={styles.detailsBtnText}>View Centre</Text>
            <Ionicons name="arrow-forward" size={12} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#F8FAFC',
  },
  body: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleWrap: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tagline: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  certRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  doctorsPreviewBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  docHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  docNamesList: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  compareBtnActive: {
    opacity: 1,
  },
  compareBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  viewDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  viewDoctorsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
});

export default ClinicCard;
