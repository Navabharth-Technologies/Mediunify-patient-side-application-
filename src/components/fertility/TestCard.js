import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TestCard = ({ test, onPress, onBook }) => {
  if (!test) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(test)}
      activeOpacity={0.9}
    >
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{test.category}</Text>
        </View>
        <View style={styles.targetBadge}>
          <Ionicons
            name={test.targetGender === 'Male' ? 'male' : test.targetGender === 'Female' ? 'female' : 'people'}
            size={12}
            color="#64748B"
          />
          <Text style={styles.targetText}>{test.targetGender}</Text>
        </View>
      </View>

      <Text style={styles.title}>{test.name}</Text>
      <Text style={styles.desc} numberOfLines={2}>
        {test.description}
      </Text>

      <View style={styles.specGrid}>
        <View style={styles.specItem}>
          <Ionicons name="time-outline" size={13} color="#059669" />
          <Text style={styles.specVal}>{test.tat}</Text>
        </View>
        <View style={styles.specItem}>
          <Ionicons name="flask-outline" size={13} color="#7C3AED" />
          <Text style={styles.specVal} numberOfLines={1}>
            {test.sampleType}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.priceCol}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{test.price.toLocaleString('en-IN')}</Text>
            {test.mrp && <Text style={styles.mrp}>₹{test.mrp.toLocaleString('en-IN')}</Text>}
          </View>
          {test.discount && <Text style={styles.discountTag}>{test.discount}</Text>}
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => onBook ? onBook(test) : onPress && onPress(test)}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Book Test</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  specGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 6,
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
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
  priceCol: {
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  mrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bookBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default TestCard;
