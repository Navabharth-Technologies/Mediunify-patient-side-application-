import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const HealthRecordCard = ({ title, description, icon }) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E8F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 24,
  },

  content: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
});

export default HealthRecordCard;