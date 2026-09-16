import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  active: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Active' },
  in_progress: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', label: 'In Progress' },
  completed: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: 'Completed' },
  pending: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Pending' },
  scheduled: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', label: 'Scheduled' },
  urgent: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', label: 'Action Required' },
  verified: { bg: '#F0FDF4', text: '#059669', border: '#86EFAC', label: 'Verified' },
};

const StatusBadge = ({ status = 'pending', label, size = 'medium' }) => {
  const normalizedKey = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const config = STATUS_CONFIG[normalizedKey] || {
    bg: '#F1F5F9',
    text: '#475569',
    border: '#CBD5E1',
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
