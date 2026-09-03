import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import colors from '../../../theme/colors';
import pharmacyProducts from '../../../data/pharmacyProducts';
import ProductCard from '../../../components/ProductCard';
import { useCart } from '../../../context/CartContext';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: 'meds', name: 'Medicines', icon: 'medkit-outline' },
  { id: 'vitamins', name: 'Vitamins & Minerals', icon: 'fitness-outline' },
  { id: 'devices', name: 'Healthcare Devices', icon: 'pulse-outline' },
  { id: 'firstaid', name: 'First Aid', icon: 'bandage-outline' },
  { id: 'pain', name: 'Pain Relief', icon: 'flash-outline' },
  { id: 'covid', name: 'Covid Essentials', icon: 'shield-checkmark-outline' },
  { id: 'skincare', name: 'Skin Care', icon: 'sparkles-outline' },
  { id: 'baby', name: 'Baby Care', icon: 'happy-outline' },
  { id: 'ayurveda', name: 'Ayurvedic', icon: 'leaf-outline' },
];

const QUICK_LOCATIONS = [
  { id: '1', title: 'Home', address: 'No. 24, 5th Cross, Kuvempunagar, Mysore 570023' },
  { id: '2', title: 'Work', address: 'Tech Park, Hebbal Industrial Area, Mysore 570016' },
  { id: '3', title: 'Parents', address: '12th Main, Vijayanagar 2nd Stage, Mysore 570017' },
  { id: '4', title: 'Bangalore Hub', address: 'Indiranagar 100ft Road, Bangalore 560038' },
];

const PharmacyScreen = ({ navigation }) => {
  const { cartCount, cartTotal, selectedAddress, updateAddress } = useCart();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pharmacyProducts.filter((product) => {
      const matchCat =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.uses && product.uses.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  // GPS Location detection
  const detectCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location access to auto-detect your delivery address.'
        );
        setLocationLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const item = addresses[0];
        const newAddress = {
          name: selectedAddress.name || 'User',
          phone: selectedAddress.phone || '9876543210',
          addressLine: `${item.name || item.street || 'Current Location'}, ${item.subregion || item.district || ''}`,
          city: item.city || item.subregion || 'Mysore',
          state: item.region || 'Karnataka',
          pincode: item.postalCode || '570001',
          tag: 'Current Location',
        };
        updateAddress(newAddress);
        setShowLocationModal(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to detect location. Please select manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Prescription upload action
  const handleUploadPrescription = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow gallery access to upload your prescription.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPrescriptionUploaded(true);
        Alert.alert(
          'Prescription Uploaded! 📄',
          'Our pharmacist will review your prescription and verify your medicine order.'
        );
      }
    } catch (error) {
      Alert.alert('Upload Simulated', 'Prescription selected successfully for your order.');
      setPrescriptionUploaded(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.locationContainer}
          activeOpacity={0.7}
          onPress={() => setShowLocationModal(true)}
        >
          <View style={styles.locationHeaderRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locationHeaderLabel}>Deliver to</Text>
            <Ionicons name="chevron-down" size={13} color={colors.slate} />
          </View>
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedAddress.addressLine || 'Select Delivery Address'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color={colors.secondary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines, vitamins, brands..."
            placeholderTextColor={colors.slate}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.slate} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* UPLOAD PRESCRIPTION BANNER */}
        <View style={styles.rxBanner}>
          <View style={styles.rxBannerLeft}>
            <View style={styles.rxIconWrap}>
              <Ionicons
                name={prescriptionUploaded ? 'checkmark-circle' : 'document-text'}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.rxInfo}>
              <Text style={styles.rxTitle}>
                {prescriptionUploaded ? 'Prescription Attached' : 'Order with Prescription'}
              </Text>
              <Text style={styles.rxSub}>
                {prescriptionUploaded
                  ? 'Pharmacist will verify during checkout'
                  : 'Upload prescription & let pharmacist guide you'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.rxUploadBtn, prescriptionUploaded && styles.rxUploadedBtn]}
            onPress={handleUploadPrescription}
            activeOpacity={0.8}
          >
            <Ionicons
              name={prescriptionUploaded ? 'checkmark' : 'cloud-upload-outline'}
              size={15}
              color={prescriptionUploaded ? colors.primary : colors.white}
            />
            <Text
              style={[
                styles.rxUploadText,
                prescriptionUploaded && styles.rxUploadedText,
              ]}
            >
              {prescriptionUploaded ? 'Change' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PROMO OFFER CAROUSEL BANNER */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>FLASH DEAL</Text>
            </View>
            <Text style={styles.promoHeading}>Flat 20% OFF</Text>
            <Text style={styles.promoDesc}>Use coupon code: UNNATHI20</Text>
            <Text style={styles.promoSub}>⚡ Express 30-45 mins delivery to your doorstep</Text>
          </View>
          <View style={styles.promoIconBg}>
            <Ionicons name="gift" size={46} color="#00B894" />
          </View>
        </View>

        {/* CATEGORIES HORIZONTAL SCROLL */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                activeOpacity={0.75}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isSelected ? colors.white : colors.secondary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* PRODUCTS GRID HEADER */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Popular Medicines & Health' : selectedCategory}
          </Text>
          <Text style={styles.productCount}>{filteredProducts.length} items</Text>
        </View>

        {/* PRODUCTS LIST GRID */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.slate} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              Try searching with another medicine or brand name.
            </Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                navigation={navigation}
              />
            ))}
          </View>
        )}

        {/* EXTRA PADDING FOR FLOATING BOTTOM CART BAR */}
        <View style={{ height: cartCount > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* FLOATING BOTTOM CART BAR */}
      {cartCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.cartBarInfo}>
            <View style={styles.cartCountPill}>
              <Ionicons name="cart" size={14} color={colors.white} />
              <Text style={styles.cartCountPillText}>{cartCount} items</Text>
            </View>
            <Text style={styles.cartBarTotal}>₹{cartTotal}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewCartBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.viewCartBtnText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* LOCATION SELECTOR MODAL */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* GPS DETECT BUTTON */}
            <TouchableOpacity
              style={styles.gpsBtn}
              activeOpacity={0.8}
              onPress={detectCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="navigate" size={18} color={colors.primary} />
              )}
              <Text style={styles.gpsBtnText}>
                {locationLoading
                  ? 'Detecting current GPS location...'
                  : 'Use current location'}
              </Text>
            </TouchableOpacity>

            <View style={styles.savedLocationsTitleWrap}>
              <Text style={styles.savedLocationsTitle}>Saved Addresses</Text>
            </View>

            {QUICK_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.locationItem}
                activeOpacity={0.7}
                onPress={() => {
                  updateAddress({
                    name: selectedAddress.name || 'User',
                    phone: selectedAddress.phone || '9876543210',
                    addressLine: loc.address,
                    city: loc.address.includes('Bangalore') ? 'Bangalore' : 'Mysore',
                    state: 'Karnataka',
                    pincode: loc.address.match(/\d{6}/)?.[0] || '570001',
                    tag: loc.title,
                  });
                  setShowLocationModal(false);
                }}
              >
                <View style={styles.locIconWrap}>
                  <Ionicons
                    name={
                      loc.title === 'Home'
                        ? 'home-outline'
                        : loc.title === 'Work'
                        ? 'briefcase-outline'
                        : 'location-outline'
                    }
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.locDetails}>
                  <Text style={styles.locTitle}>{loc.title}</Text>
                  <Text style={styles.locAddress} numberOfLines={2}>
                    {loc.address}
                  </Text>
                </View>
                {selectedAddress.addressLine === loc.address && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContainer: {
    flex: 1,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 1,
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E53935',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  rxBanner: {
    marginTop: 14,
    backgroundColor: '#EBF8F5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C2EDE2',
  },
  rxBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  rxIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxInfo: {
    flex: 1,
  },
  rxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  rxSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
    lineHeight: 14,
  },
  rxUploadBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rxUploadedBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rxUploadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  rxUploadedText: {
    color: colors.primary,
  },
  promoCard: {
    marginTop: 14,
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoBadge: {
    backgroundColor: '#00B894',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
  promoHeading: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '900',
  },
  promoDesc: {
    color: '#A5F3FC',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  promoSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 5,
  },
  promoIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
  },
  productCount: {
    fontSize: 12,
    color: colors.slate,
    fontWeight: '700',
  },
  categoriesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  categoryPillTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate,
    textAlign: 'center',
    marginTop: 4,
  },
  floatingCartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.secondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cartBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  cartCountPillText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  cartBarTotal: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
  },
  viewCartBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F8F4',
    padding: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C0EFE5',
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  savedLocationsTitleWrap: {
    marginBottom: 10,
  },
  savedLocationsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate,
    textTransform: 'uppercase',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F6',
    gap: 12,
  },
  locIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locDetails: {
    flex: 1,
  },
  locTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  locAddress: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
});

export default PharmacyScreen;