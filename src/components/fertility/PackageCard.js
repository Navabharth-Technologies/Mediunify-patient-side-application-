import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PackageCard = ({ pkg, onPress, onCalculateEmi }) => {
  if (!pkg) return null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.badgePill, { backgroundColor: pkg.badgeColor || '#E11D48' }]}>
          <Text style={styles.badgeText}>{pkg.badge}</Text>
        </View>
        <Text style={styles.durationText}>{pkg.duration}</Text>
      </View>

      <Text style={styles.title}>{pkg.title}</Text>
      <Text style={styles.subtitle}>{pkg.subtitle}</Text>

      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{pkg.price.toLocaleString('en-IN')}</Text>
          {pkg.originalPrice && (
            <Text style={styles.origPrice}>₹{pkg.originalPrice.toLocaleString('en-IN')}</Text>
          )}
          {pkg.discount && <Text style={styles.discountBadge}>{pkg.discount}</Text>}
        </View>

        {pkg.emiStartsAt && (
          <View style={styles.emiBanner}>
            <Ionicons name="card-outline" size={14} color="#059669" />
            <Text style={styles.emiText}>{pkg.emiStartsAt}</Text>
          </View>
        )}
      </View>

      <View style={styles.inclusionsBox}>
        <Text style={styles.inclusionsTitle}>Package Inclusions:</Text>
        {pkg.inclusions.map((item, index) => (
          <View key={index} style={styles.incItem}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.incText}>{item}</Text>
          </View>
        ))}
      </View>

      {pkg.recommendedFor && (
        <View style={styles.recommendedBox}>
          <Text style={styles.recLabel}>Clinically Recommended For:</Text>
          <Text style={styles.recText}>{pkg.recommendedFor}</Text>
        </View>
      )}

      <View style={styles.btnRow}>
        {onCalculateEmi && pkg.emiAvailable && (
          <TouchableOpacity
            style={styles.emiBtn}
            onPress={() => onCalculateEmi(pkg)}
            activeOpacity={0.8}
          >
            <Text style={styles.emiBtnText}>0% EMI Calculator</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => onPress && onPress(pkg)}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Select Package</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  priceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  origPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  emiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  inclusionsBox: {
    marginBottom: 12,
    gap: 6,
  },
  inclusionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  incItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  incText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  recommendedBox: {
    backgroundColor: '#FFF1F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#E11D48',
  },
  recLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9F1239',
  },
  recText: {
    fontSize: 11,
    color: '#4C0519',
    marginTop: 2,
    lineHeight: 15,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emiBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bookBtn: {
    flex: 1.2,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default PackageCard;
