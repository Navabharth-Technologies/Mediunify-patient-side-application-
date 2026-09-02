import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

const MedicineCard = ({ medicine, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageBox}>
        <Text style={styles.icon}>💊</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.type}>{medicine.type}</Text>
        <Text style={styles.price}>₹{medicine.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  imageBox: {
    width: 65,
    height: 65,
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 30,
  },

  info: {
    marginLeft: 14,
    justifyContent: 'center',
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  type: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  price: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 5,
  },
});

export default MedicineCard;