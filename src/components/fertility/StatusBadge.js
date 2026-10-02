import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  active: { bg: '#E6F8F5', text: '#00B894', border: '#B2EBF2', label: 'Active' },
  in_progress: { bg: '#EFF6FF', text: '#1E3A8A', border: '#BFDBFE', label: 'In Progress' },
  completed: { bg: '#F2FAF0', text: '#7BC96F', border: '#C6F6D5', label: 'Completed' },
  pending: { bg: '#EFF6FF', text: '#1E3A8A', border: '#BFDBFE', label: 'Pending' },
  scheduled: { bg: '#E0F7FA', text: '#00C2CB', border: '#B2EBF2', label: 'Scheduled' },
  urgent: { bg: '#FFF2ED', text: '#FF7F50', border: '#FFD7C7', label: 'Action Required' },
  verified: { bg: '#F2FAF0', text: '#7BC96F', border: '#C6F6D5', label: 'Verified' },
};

const StatusBadge = ({ status = 'pending', label, size = 'medium' }) => {
  const normalizedKey = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const config = STATUS_CONFIG[normalizedKey] || {
    bg: '#F8FAFC',
    text: '#64748B',
    border: '#E2E8F0',
    label: label || status,
  };

  const displayText = label || config.label;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        isSmall && styles.badgeSmall,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }, isSmall && styles.textSmall]}>
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 10,
  },
});

export default StatusBadge;
