import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationCard = ({ notification, onMarkRead, onPress }) => {
  if (!notification) return null;

  return (
    <TouchableOpacity
      style={[styles.card, notification.unread && styles.cardUnread]}
      onPress={() => onPress && onPress(notification)}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${notification.color || '#E11D48'}15` },
        ]}
      >
        <Ionicons
          name={notification.icon || 'notifications-outline'}
          size={18}
          color={notification.color || '#E11D48'}
        />
      </View>

      <View style={styles.contentCol}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          {notification.unread && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.timeText}>{notification.timestamp}</Text>
      </View>

      {onMarkRead && notification.unread && (
        <TouchableOpacity
          style={styles.markBtn}
          onPress={() => onMarkRead(notification.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="checkmark-done" size={16} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  cardUnread: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E11D48',
  },
  message: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
    lineHeight: 17,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
  markBtn: {
    paddingTop: 4,
  },
});

export default NotificationCard;
