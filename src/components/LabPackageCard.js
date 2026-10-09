import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const LabPackageCard = ({
  packageData,
  navigation,
}) => {
  const { t, isIndic } = useTheme();

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
        <Text style={[styles.homeBadgeText, isIndic && { lineHeight: 14 }]}>
          {t('lab.home_sample_pickup', 'Home Collection')}
        </Text>
      </View>

      {/* PACKAGE TITLE */}
      <Text style={[styles.title, isIndic && { lineHeight: 20 }]} numberOfLines={1}>
        {packageData.title}
      </Text>
      <Text style={[styles.subtitle, isIndic && { lineHeight: 16 }]} numberOfLines={1}>
        {packageData.subtitle}
      </Text>

      {/* TESTS COUNT */}
      <View style={styles.testsRow}>
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={colors.success}
        />
        <Text style={[styles.tests, isIndic && { lineHeight: 16 }]}>
          {packageData.tests} {t('lab.test_includes', 'Included')}
        </Text>
      </View>

      {/* PRICE ROW */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>
          {packageData.priceStr || `₹${packageData.price}`}
        </Text>
        {packageData.oldPrice && (
          <Text style={styles.oldPrice}>
            {packageData.oldPrice}
          </Text>
        )}
        {packageData.discount && (
          <View style={styles.discountBox}>
            <Text style={styles.discount}>
              {packageData.discount}
            </Text>
          </View>
        )}
      </View>

      {/* BOOK BUTTON */}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={handleBookPackage}
      >
        <Text style={[styles.buttonText, isIndic && { lineHeight: 18 }]}>
          {t('common.book_now', 'Book Package')}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={14}
          color={colors.white}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: 260,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  labs: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00B894',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  homeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  testsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tests: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  oldPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  discountBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  discount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  button: {
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default LabPackageCard;