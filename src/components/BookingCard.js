import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const BookingCard = ({ booking }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.type}>{booking.type}</Text>

      <Text style={styles.title}>
        {booking.title}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.date}>{booking.date}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.time}>{booking.time}</Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.status}>
          {booking.status}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  type: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },

  date: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 13,
  },

  time: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
  },

  statusBox: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  status: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default BookingCard;