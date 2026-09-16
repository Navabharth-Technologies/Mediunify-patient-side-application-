import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Alert,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
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

const PharmacyStoreDetailScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const {
    pharmacyCart,
    pharmacyCartCount,
    pharmacyFinalTotal,
    selectedPharmacyStore,
    setSelectedPharmacyStore,
  } = useCart();

  const store = route?.params?.store || selectedPharmacyStore || {
    id: 'store-apollo-kuvempu',
    name: 'Apollo Pharmacy - Kuvempunagar',
    locality: 'Kuvempunagar',
    address: '#45, 8th Cross, Complex Road, Kuvempunagar, Mysore - 570023',
    deliveryTime: '15-25 mins',
    rating: 4.9,
    reviewsCount: 1450,
  };

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const handleCallShop = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone.replace(/[^0-9+]/g, '')}`);
    } else {
      showAlert('Contact Shop', 'Shop phone: +91 821 2548901');
    }
  };

  const handleUploadPrescription = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Please allow gallery access to upload your prescription.');
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
          `Your prescription has been assigned to ${store.name}. The registered pharmacist will verify the order upon checkout.`
        );
      }
    } catch (error) {
      setPrescriptionUploaded(true);
      showAlert('Prescription Attached', `Prescription attached for ${store.name}.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={[styles.header, isDesktopWeb && styles.headerDesktop]}>
        <View style={[styles.headerInner, isDesktopWeb && styles.desktopMaxWidth]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {store.name}
            </Text>
            <View style={styles.headerSubRow}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {store.locality} • {store.deliveryTime || '15-25 mins'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopMaxWidth,
          pharmacyCartCount > 0 && { paddingBottom: 100 },
        ]}
      >
        {/* STORE BANNER CARD */}
        <View style={styles.storeCard}>
          <Image
            source={{ uri: store.image }}
            style={styles.storeImage}
            resizeMode="cover"
          />

          <View style={styles.storeDetails}>
            <View style={styles.storeHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeTagline}>{store.tagline}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFFFFF" />
                <Text style={styles.ratingText}>{store.rating}</Text>
              </View>
            </View>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color={colors.slate} />
              <Text style={styles.addressText} numberOfLines={2}>
                {store.address}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="bicycle" size={14} color="#FF5252" />
                <Text style={styles.metaBadgeText}>{store.deliveryTime || '20-30 mins'}</Text>
              </View>

              {store.is24x7 ? (
                <View style={[styles.metaBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="time" size={14} color="#2563EB" />
                  <Text style={[styles.metaBadgeText, { color: '#2563EB' }]}>24x7 Open</Text>
                </View>
              ) : (
                <View style={[styles.metaBadge, { backgroundColor: '#FFF0F0' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#FF5252" />
                  <Text style={[styles.metaBadgeText, { color: '#FF5252' }]}>Open Now</Text>
                </View>
              )}

              <View style={[styles.metaBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#D97706" />
                <Text style={[styles.metaBadgeText, { color: '#D97706' }]}>Verified Chemist</Text>
              </View>
            </View>

            {/* PHARMACIST & LICENSE INFO */}
            <View style={styles.licenseBox}>
              <Ionicons name="medical" size={15} color={colors.primary} />
              <Text style={styles.licenseText} numberOfLines={1}>
                {store.pharmacistName || 'Registered Pharmacist on Duty'} • Lic: {store.licenseNumber || 'KA-MYS-DRUG'}
              </Text>
            </View>

            {/* ACTION BUTTONS (CALL & PRESCRIPTION) */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.callShopBtn}
                onPress={handleCallShop}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color={colors.primary} />
                <Text style={styles.callShopText}>Call Chemist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rxUploadBtn, prescriptionUploaded && styles.rxUploadedBtn]}
                onPress={handleUploadPrescription}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={prescriptionUploaded ? 'checkmark-circle' : 'document-text'}
                  size={16}
                  color={prescriptionUploaded ? '#FF5252' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.rxUploadText,
                    prescriptionUploaded && { color: '#FF5252' },
                  ]}
                >
                  {prescriptionUploaded ? 'Rx Attached ✓' : 'Upload Rx to Shop'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PROMO DISCOUNT STRIP */}
        {store.discountOffer && (
          <View style={styles.offerStrip}>
            <Ionicons name="pricetag" size={16} color="#DC2626" />
            <Text style={styles.offerStripText}>{store.discountOffer}</Text>
          </View>
        )}

        {/* SEARCH MEDICINES IN THIS SHOP */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search medicines in ${store.name.split('-')[0].trim()}...`}
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

        {/* CATEGORIES HORIZONTAL LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <Text style={styles.productCountLabel}>
            {filteredProducts.length} Items Available
          </Text>
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.categoriesWrap}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.primary}
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
          </View>
        ) : (
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
                  onPress={() => setSelectedCategory(cat.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.primary}
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
        )}

        {/* MEDICINES & PRODUCTS GRID */}
        <View style={styles.productsGrid}>
          {filteredProducts.length === 0 ? (
            <View style={styles.noProductsWrap}>
              <Ionicons name="search-outline" size={48} color={colors.slate} />
              <Text style={styles.noProductsTitle}>No Medicines Found</Text>
              <Text style={styles.noProductsSub}>
                Try searching with generic names like Paracetamol, Vitamin C, or Multivitamins.
              </Text>
              <TouchableOpacity
                style={styles.resetSearchBtn}
                onPress={() => {
                  setSearch('');
                  setSelectedCategory('All');
                }}
              >
                <Text style={styles.resetSearchText}>View All Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                store={store}
                onPress={() =>
                  navigation.navigate('ProductDetails', {
                    productId: prod.id,
                    product: prod,
                    store: store,
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FLOATING BOTTOM CART BAR */}
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
                <Text style={styles.floatingCartShop} numberOfLines={1}>
                  Fulfilling from {store.name.split('-')[0].trim()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.floatingCartButton}
              onPress={() => navigation.navigate('Cart', { initialTab: 'pharmacy' })}
              activeOpacity={0.88}
            >
              <Text style={styles.floatingCartBtnText}>
                View Cart • ₹{pharmacyFinalTotal}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerDesktop: {
    paddingHorizontal: 0,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.slate,
    marginLeft: 4,
    fontWeight: '500',
  },
  headerRightPlaceholder: {
    width: 38,
    height: 38,
  },
  desktopMaxWidth: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  desktopFloatingCart: {
    maxWidth: 800,
    alignSelf: 'center',
    bottom: 24,
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({

      web: { boxShadow: '0px 3px 16px rgba(0,0,0,0.06)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 3 },

        shadowOpacity: 0.06,

        shadowRadius: 8,

        elevation: 3,

      },

    }),
  },
  storeImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#E2E8F0',
  },
  storeDetails: {
    padding: 16,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
  },
  storeTagline: {
    fontSize: 12,
    color: colors.slate,
    marginTop: 3,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    gap: 3,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5252',
  },
  licenseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  licenseText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  callShopBtn: {
    height: 40,
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  callShopText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  rxUploadBtn: {
    height: 40,
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
  rxUploadedBtn: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFBDBD',
  },
  rxUploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  offerStripText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  productCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
    columnGap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  noProductsWrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProductsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 12,
  },
  noProductsSub: {
    fontSize: 13,
    color: colors.slate,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  resetSearchBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetSearchText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
    ...Platform.select({

      web: { boxShadow: '0px -4px 20px rgba(0,0,0,0.1)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: -4 },

        shadowOpacity: 0.1,

        shadowRadius: 10,

        elevation: 8,

      },

    }),
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
    color: '#FF5252',
    fontWeight: '700',
  },
  floatingCartButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    borderRadius: 10,
    gap: 6,
  },
  floatingCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PharmacyStoreDetailScreen;
