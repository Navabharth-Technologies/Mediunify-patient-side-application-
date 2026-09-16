import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FertilityServiceCard = ({ treatment, onPress, onBook }) => {
  if (!treatment) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(treatment)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: treatment.image }} style={styles.bannerImage} />

      <View style={styles.contentWrap}>
        <View style={styles.topBadgeRow}>
          <View style={[styles.badgePill, { backgroundColor: treatment.badgeColor || '#E11D48' }]}>
            <Text style={styles.badgeText}>{treatment.badge}</Text>
          </View>
          <View style={styles.durationTag}>
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={styles.durationText}>{treatment.duration}</Text>
          </View>
        </View>

        <Text style={styles.title}>{treatment.title}</Text>
        <Text style={styles.subtitle}>{treatment.subtitle}</Text>

        <View style={styles.inclusionsList}>
          {treatment.inclusions.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.inclusionItem}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.inclusionText} numberOfLines={1}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>₹{treatment.price.toLocaleString('en-IN')}</Text>
              {treatment.originalPrice && (
                <Text style={styles.origPrice}>₹{treatment.originalPrice.toLocaleString('en-IN')}</Text>
              )}
            </View>
            {treatment.emiStartsAt && (
              <Text style={styles.emiText}>{treatment.emiStartsAt}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onBook ? onBook(treatment) : onPress && onPress(treatment)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>Explore & Book</Text>
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
  },
  contentWrap: {
    padding: 16,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    letterSpacing: 0.3,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  inclusionsList: {
    gap: 6,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inclusionText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  origPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  emiText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FertilityServiceCard;
