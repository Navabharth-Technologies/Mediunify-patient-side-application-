import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

const LabTestCard = ({ test, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>🧪</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{test.name}</Text>
        <Text style={styles.description}>{test.description}</Text>
        <Text style={styles.price}>₹{test.price}</Text>
      </View>
    </TouchableOpacity>
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
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 28,
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  price: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 5,
  },
});

export default LabTestCard;