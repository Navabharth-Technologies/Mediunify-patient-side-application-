import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const EmptyState = ({
  icon = 'folder-open-outline',
  title = 'No records found',
  subtitle = 'There is currently no information available in this section.',
  actionLabel,
  onAction,
}) => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={36} color="#E11D48" />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
    {actionLabel && onAction && (
      <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.85}>
        <Text style={styles.actionBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const LoadingState = ({ message = 'Loading fertility information...' }) => (
  <View style={styles.container}>
    <View style={[styles.iconCircle, { backgroundColor: '#FFF1F2' }]}>
      <Ionicons name="sync-outline" size={32} color="#E11D48" />
    </View>
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We could not complete your request. Please try again.',
  onRetry,
}) => (
  <View style={styles.container}>
    <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
      <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.85}>
        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 18,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  actionBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default { EmptyState, LoadingState, ErrorState };
