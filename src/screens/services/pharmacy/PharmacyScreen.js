import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../../utils/locationHelper';

import colors from '../../../theme/colors';
import pharmacyStores, {
  POPULAR_LOCALITIES,
  calculateDistanceKm,
} from '../../../data/pharmacyStores';
import { useCart } from '../../../context/CartContext';

const FILTER_TAGS = [
  { id: 'all', label: 'All Shops', icon: 'storefront-outline' },
  { id: 'express', label: '⚡ Express (<20 mins)', icon: 'flash-outline' },
  { id: '24x7', label: '🕒 24x7 Open', icon: 'time-outline' },
  { id: 'top_rated', label: '⭐ Top Rated (4.8+)', icon: 'star-outline' },
  { id: 'offers', label: '🏷️ Best Discounts', icon: 'pricetag-outline' },
  { id: 'generic', label: '🏛️ Jan Aushadhi (Govt.)', icon: 'medkit-outline' },
];

const PharmacyScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const {
    pharmacyCart,
    pharmacyCartCount,
    pharmacyFinalTotal,
    selectedAddress,
    updateAddress,
    setSelectedPharmacyStore,
  } = useCart();

  const [search, setSearch] = useState(route?.params?.query || route?.params?.search || '');

  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearch(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearch(route.params.search);
    }
  }, [route?.params?.query, route?.params?.search]);

  const [selectedLocality, setSelectedLocality] = useState(
    POPULAR_LOCALITIES[0]
  );
  const [selectedFilterTag, setSelectedFilterTag] = useState('all');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);

  // Sync with saved location if available
  useEffect(() => {
    (async () => {
      try {
        const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed.locality || parsed.area) {
            const locName = parsed.locality || parsed.area;
            const matched = POPULAR_LOCALITIES.find(
              (l) =>
                locName.toLowerCase().includes(l.name.toLowerCase()) ||
                l.name.toLowerCase().includes(locName.toLowerCase())
            );
            if (matched) {
              setSelectedLocality(matched);
            }
          }
        }
      } catch (e) {
        // Fallback to default
      }
    })();
  }, []);

  // Calculate stores with live dynamic distances from active locality
  const storesWithDistance = useMemo(() => {
    const userLat = selectedLocality.latitude;
    const userLon = selectedLocality.longitude;

    return pharmacyStores.map((store) => {
      const dist = calculateDistanceKm(
        userLat,
        userLon,
        store.latitude,
        store.longitude
      );
      return {
        ...store,
        distanceKm: dist,
      };
    });
  }, [selectedLocality]);

  // Filtered stores list based on search and filter tags
  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    return storesWithDistance
      .filter((store) => {
        const matchSearch =
          !q ||
          store.name.toLowerCase().includes(q) ||
          store.locality.toLowerCase().includes(q) ||
          store.address.toLowerCase().includes(q) ||
          store.tagline.toLowerCase().includes(q) ||
          (store.tags && store.tags.some((t) => t.toLowerCase().includes(q)));

        let matchTag = true;
        if (selectedFilterTag === 'express') {
          matchTag = store.deliveryTime.includes('15') || store.deliveryTime.includes('20');
        } else if (selectedFilterTag === '24x7') {
          matchTag = store.is24x7 === true;
        } else if (selectedFilterTag === 'top_rated') {
          matchTag = store.rating >= 4.8;
        } else if (selectedFilterTag === 'offers') {
          matchTag = store.discountOffer && store.discountOffer.includes('%');
        } else if (selectedFilterTag === 'generic') {
          matchTag =
            store.id.includes('janaushadhi') ||
            store.name.toLowerCase().includes('jan aushadhi') ||
            store.tags.includes('Generic Alternatives');
        }

        return matchSearch && matchTag;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm); // Closest stores first!
  }, [storesWithDistance, search, selectedFilterTag]);

  // Handle GPS location auto-detect
  const detectCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        showAlert(
          'Location Permission',
          'Please allow location access to auto-detect nearby medical shops.'
        );
        setLocationLoading(false);
        return;
      }

      const position = await getCurrentPositionWebSafe({
        accuracy: Location.Accuracy.Balanced,
      });

      const addresses = await reverseGeocodeWebSafe({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const item = addresses[0];
        const newAddress = {
          name: selectedAddress?.name || 'User',
          phone: selectedAddress?.phone || '9876543210',
          addressLine: `${item.name || item.street || 'Current Location'}, ${item.subregion || item.district || 'Mysore'}`,
          city: item.city || item.subregion || 'Mysore',
          state: item.region || 'Karnataka',
          pincode: item.postalCode || '570001',
          tag: 'GPS Location',
        };
        updateAddress(newAddress);

        // Find nearest locality
        let closest = POPULAR_LOCALITIES[0];
        let minD = 9999;
        POPULAR_LOCALITIES.forEach((loc) => {
          const d = calculateDistanceKm(
            position.coords.latitude,
            position.coords.longitude,
            loc.latitude,
            loc.longitude
          );
          if (d < minD) {
            minD = d;
            closest = loc;
          }
        });
        setSelectedLocality(closest);
        setShowLocationModal(false);
        showAlert(
          'Location Updated 📍',
          `Serving from nearest medical shops in ${closest.name}, Mysore.`
        );
      }
    } catch (e) {
      showAlert('Location Error', 'Unable to detect GPS. Please pick a locality manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Upload prescription action
  const handleUploadPrescription = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Please allow photo gallery access to upload prescription.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPrescriptionUploaded(true);
        showAlert(
          'Prescription Uploaded! 📄',
          'Now select your preferred medical shop below to prepare and deliver your medicines.'
        );
      }
    } catch (error) {
      setPrescriptionUploaded(true);
      showAlert('Prescription Attached', 'Prescription ready. Choose a medical shop to proceed.');
    }
  };

  const handleSelectStore = (store) => {
    setSelectedPharmacyStore(store);
    navigation.navigate('PharmacyStoreDetail', { store });
  };

  const handleCallShop = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    } else {
      showAlert('Contact Shop', 'Shop phone: +91 821 2548901');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER (MOBILE ONLY) */}
      {!isDesktopWeb && (
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
              {selectedLocality.name}, Mysore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart', { initialTab: 'pharmacy' })}
          >
            <Ionicons name="cart-outline" size={24} color={colors.secondary} />
            {pharmacyCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {pharmacyCartCount > 99 ? '99+' : pharmacyCartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}



      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          pharmacyCartCount > 0 && { paddingBottom: 100 },
        ]}
      >
        {/* HERO DELIVERY PROMISE BANNER */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="flash" size={13} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>15-30 MIN DELIVERY</Text>
              </View>
              <Text style={styles.heroSubBadge}>100% Genuine Medicines</Text>
            </View>

            <Text style={styles.heroTitle}>
              Nearby Verified Medical Shops & Chemists
            </Text>
            <Text style={styles.heroSubtitle}>
              Select your trusted neighborhood chemist below to order medicines, health essentials, and generic alternatives.
            </Text>
          </View>
        </View>

        {/* SEARCH BAR (MOBILE ONLY - HIDES DUPLICATE SEARCH ON WEB) */}
        {!isDesktopWeb && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search medical shops by name or locality..."
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
        )}

        {/* LOCALITY SELECTOR CHIPS */}
        <View style={styles.localitySectionHeader}>
          <View style={styles.localityTitleRow}>
            <Ionicons name="compass-outline" size={16} color={colors.primary} />
            <Text style={styles.localitySectionTitle}>Select Locality in Mysore</Text>
          </View>
          <TouchableOpacity
            style={styles.liveMapBtn}
            onPress={() => navigation.navigate('PharmacyLocation')}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={13} color={colors.primary} />
            <Text style={styles.liveMapBtnText}>Live Map</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.localityScroll}
        >
          {POPULAR_LOCALITIES.map((loc) => {
            const isSelected = selectedLocality.id === loc.id;
            return (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.localityChip,
                  isSelected && styles.localityChipActive,
                ]}
                onPress={() => setSelectedLocality(loc)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isSelected ? 'location' : 'location-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.localityChipText,
                    isSelected && styles.localityChipTextActive,
                  ]}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* UPLOAD PRESCRIPTION CARD */}
        <View style={styles.rxCard}>
          <View style={styles.rxLeft}>
            <View style={styles.rxIconWrap}>
              <Ionicons
                name={prescriptionUploaded ? 'checkmark-circle' : 'document-text'}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rxTitle}>
                {prescriptionUploaded ? 'Prescription Attached ✓' : 'Have a Doctor Prescription?'}
              </Text>
              <Text style={styles.rxSubtitle}>
                {prescriptionUploaded
                  ? 'Select any medical shop below to place order'
                  : 'Upload Rx & your chosen chemist will dispense'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.rxBtn, prescriptionUploaded && styles.rxBtnDone]}
            onPress={handleUploadPrescription}
            activeOpacity={0.8}
          >
            <Text style={[styles.rxBtnText, prescriptionUploaded && styles.rxBtnDoneText]}>
              {prescriptionUploaded ? 'Change Rx' : 'Upload Rx'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FILTER TAGS */}
        {Platform.OS === 'web' ? (
          <View style={styles.filterTagsWrap}>
            {FILTER_TAGS.map((tag) => {
              const isSelected = selectedFilterTag === tag.id;
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.filterTag,
                    isSelected && styles.filterTagActive,
                  ]}
                  onPress={() => setSelectedFilterTag(tag.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterTagText,
                      isSelected && styles.filterTagTextActive,
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTagsScroll}
          >
            {FILTER_TAGS.map((tag) => {
              const isSelected = selectedFilterTag === tag.id;
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.filterTag,
                    isSelected && styles.filterTagActive,
                  ]}
                  onPress={() => setSelectedFilterTag(tag.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterTagText,
                      isSelected && styles.filterTagTextActive,
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* MEDICAL SHOPS LIST HEADER */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            Medical Shops Near {selectedLocality.name} ({filteredStores.length})
          </Text>
          <Text style={styles.listHeaderSub}>Sorted by Distance</Text>
        </View>

        {/* MEDICAL SHOPS CARDS */}
        {filteredStores.length === 0 ? (
          <View style={styles.noStoresBox}>
            <Ionicons name="business-outline" size={48} color={colors.slate} />
            <Text style={styles.noStoresTitle}>No Medical Shops Found</Text>
            <Text style={styles.noStoresSub}>
              Try changing the search keywords or selecting another locality.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearch('');
                setSelectedFilterTag('all');
              }}
            >
              <Text style={styles.resetFilterBtnText}>Show All Shops</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredStores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              onPress={() => handleSelectStore(store)}
              activeOpacity={0.9}
            >
              <View style={styles.storeCardTop}>
                <Image
                  source={{ uri: store.image }}
                  style={styles.storeImage}
                  resizeMode="cover"
                />
                <View style={styles.storeTopInfo}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FFFFFF" />
                      <Text style={styles.ratingText}>{store.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.storeTagline} numberOfLines={2}>
                    {store.tagline}
                  </Text>

                  <View style={styles.storeDistanceRow}>
                    <Ionicons name="navigate" size={12} color={colors.primary} />
                    <Text style={styles.storeDistanceText}>
                      {store.distanceKm} km away • {store.locality}
                    </Text>
                  </View>

                  <View style={styles.deliveryBadgeRow}>
                    <View style={styles.deliveryTimeBadge}>
                      <Ionicons name="bicycle" size={12} color="#059669" />
                      <Text style={styles.deliveryTimeText}>{store.deliveryTime}</Text>
                    </View>
                    {store.is24x7 && (
                      <View style={styles.open247Badge}>
                        <Text style={styles.open247Text}>24x7 Open</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* STORE ADDRESS & DRUG LICENSE */}
              <View style={styles.storeAddressRow}>
                <Ionicons name="location-outline" size={14} color={colors.slate} />
                <Text style={styles.storeAddressText} numberOfLines={1}>
                  {store.address}
                </Text>
              </View>

              {/* DISCOUNT OFFER STRIP */}
              {store.discountOffer && (
                <View style={styles.storeOfferStrip}>
                  <Ionicons name="pricetag" size={13} color="#DC2626" />
                  <Text style={styles.storeOfferText} numberOfLines={1}>
                    {store.discountOffer}
                  </Text>
                </View>
              )}

              {/* CARD ACTION FOOTER */}
              <View style={styles.storeCardFooter}>
                <TouchableOpacity
                  style={styles.storeCallBtn}
                  onPress={() => handleCallShop(store.phone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.storeCallText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.orderFromShopBtn}
                  onPress={() => handleSelectStore(store)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.orderFromShopText}>
                    Order from this Medical Shop
                  </Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FLOATING CART SUMMARY BAR */}
      {pharmacyCartCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.floatingCartInner}>
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartCountCircle}>
                <Ionicons name="cart" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.floatingCartCount}>
                  {pharmacyCartCount} {pharmacyCartCount === 1 ? 'Item' : 'Items'} in Cart
                </Text>
                <Text style={styles.floatingCartShop}>
                  Total: ₹{pharmacyFinalTotal}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.floatingCartButton}
              onPress={() => navigation.navigate('Cart', { initialTab: 'pharmacy' })}
              activeOpacity={0.88}
            >
              <Text style={styles.floatingCartBtnText}>
                View Cart & Checkout
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* LOCATION SELECTOR MODAL */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Locality</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* GPS AUTO-DETECT */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={detectCurrentLocation}
              disabled={locationLoading}
              activeOpacity={0.8}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="locate" size={20} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.gpsBtnTitle}>Use Current GPS Location</Text>
                    <Text style={styles.gpsBtnSub}>
                      Auto-detect nearest medical shops around you
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* LIVE MAP PICKER */}
            <TouchableOpacity
              style={styles.mapModalBtn}
              onPress={() => {
                setShowLocationModal(false);
                navigation.navigate('PharmacyLocation');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="map" size={20} color="#059669" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.mapModalBtnTitle}>Pick on Interactive Live Map 🗺️</Text>
                <Text style={styles.mapModalBtnSub}>
                  Drag pinpoint on real-time map with live GPS address
                </Text>
              </View>
            </TouchableOpacity>

            {/* POPULAR LOCALITIES LIST */}
            <Text style={styles.modalSubheading}>Popular Localities in Mysore</Text>
            <ScrollView
              style={{ maxHeight: 260 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {POPULAR_LOCALITIES.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.localityModalItem,
                    selectedLocality.id === loc.id && styles.localityModalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedLocality(loc);
                    setShowLocationModal(false);
                  }}
                >
                  <Ionicons
                    name="location"
                    size={18}
                    color={selectedLocality.id === loc.id ? colors.primary : colors.slate}
                  />
                  <Text
                    style={[
                      styles.localityModalText,
                      selectedLocality.id === loc.id && styles.localityModalTextActive,
                    ]}
                  >
                    {loc.name}, Mysore
                  </Text>
                  {selectedLocality.id === loc.id && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 2,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  heroBanner: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  heroBannerContent: {},
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  heroSubBadge: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 17,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.secondary,
  },
  localitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  localityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localitySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
  },
  liveMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  liveMapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  localityScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  localityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  localityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  localityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  localityChipTextActive: {
    color: '#FFFFFF',
  },
  rxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rxIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  rxSubtitle: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
  rxBtn: {
    backgroundColor: colors.primary,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxBtnDone: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rxBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rxBtnDoneText: {
    color: '#059669',
  },
  filterTagsScroll: {
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  filterTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  filterTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterTagActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  filterTagTextActive: {
    color: '#FFFFFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  listHeaderSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  storeCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  storeTopInfo: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    gap: 2,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  storeTagline: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 3,
    fontWeight: '500',
  },
  storeDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  storeDistanceText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  deliveryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  deliveryTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  deliveryTimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  open247Badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  open247Text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  storeAddressText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  storeOfferStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    gap: 5,
  },
  storeOfferText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
  storeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  storeCallBtn: {
    height: 38,
    maxWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 5,
  },
  storeCallText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  orderFromShopBtn: {
    height: 38,
    maxWidth: 280,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  orderFromShopText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noStoresBox: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 16,
  },
  noStoresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 10,
  },
  noStoresSub: {
    fontSize: 12,
    color: colors.slate,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  resetFilterBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingCartInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cartCountCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  floatingCartShop: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  floatingCartButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  floatingCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.secondary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  gpsBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  gpsBtnSub: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
  mapModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  mapModalBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  mapModalBtnSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalSubheading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 8,
  },
  localityModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  localityModalItemActive: {
    backgroundColor: '#EFF6FF',
  },
  localityModalText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
    flex: 1,
  },
  localityModalTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  webBreadcrumbWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  webBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webBreadcrumbLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0071DC',
  },
  webBreadcrumbCurrent: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  webBreadcrumbQuery: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
});

export default PharmacyScreen;