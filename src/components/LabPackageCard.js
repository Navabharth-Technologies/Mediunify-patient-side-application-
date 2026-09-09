import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const LabPackageCard = ({
  packageData,
  navigation,
}) => {
  const handleBookPackage = () => {
    navigation.navigate('LabBooking', {
      selectedTests: [packageData],
      source: 'home_package',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={handleBookPackage}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: packageData.background || '#E8F8F5',
            },
          ]}
        >
          <Ionicons
            name={packageData.icon || 'fitness-outline'}
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={styles.brandContainer}>
          <Text style={styles.brand}>UNNATHI</Text>
          <Text style={styles.labs}>LABS</Text>
        </View>
      </View>

      {/* HOME COLLECTION BADGE */}
      <View style={styles.homeBadge}>
        <Ionicons name="home" size={10} color="#059669" />
        <Text style={styles.homeBadgeText}>Home Collection</Text>
      </View>

      {/* PACKAGE TITLE */}
      <Text style={styles.title} numberOfLines={1}>
        {packageData.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {packageData.subtitle}
      </Text>

      {/* TESTS COUNT */}
      <View style={styles.testsRow}>
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={colors.success}
        />
        <Text style={styles.tests}>
          {packageData.tests} Included
        </Text>
      </View>

      {/* PRICE ROW */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>
          {packageData.priceStr || `₹${packageData.price}`}
        </Text>
        <Text style={styles.oldPrice}>
          {packageData.oldPrice}
        </Text>
        <View style={styles.discountBox}>
          <Text style={styles.discount}>
            {packageData.discount}
          </Text>
        </View>
      </View>

      {/* BOOK BUTTON */}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={handleBookPackage}
      >
        <Text style={styles.buttonText}>Book Package</Text>
        <Ionicons
          name="arrow-forward"
          size={14}
          color={colors.white}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 230,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brand: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: colors.secondary,
  },

  labs: {
    marginLeft: 3,
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 6,
    gap: 3,
  },
  homeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },

  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate,
    marginTop: 1,
  },

  testsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },

  tests: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 6,
  },

  price: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
  },

  oldPrice: {
    fontSize: 11,
    color: colors.slate,
    textDecorationLine: 'line-through',
  },

  discountBox: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E7F8EF',
  },

  discount: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.success,
  },

  button: {
    height: 38,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default LabPackageCard;