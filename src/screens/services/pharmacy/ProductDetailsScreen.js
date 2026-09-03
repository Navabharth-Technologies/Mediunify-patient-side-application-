import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../../theme/colors';
import pharmacyProducts from '../../../data/pharmacyProducts';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../../../components/ProductCard';

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Medicines':
      return 'medkit';
    case 'Vitamins & Minerals':
      return 'fitness';
    case 'Healthcare Devices':
      return 'pulse';
    case 'First Aid':
      return 'bandage';
    case 'Covid Essentials':
      return 'shield-checkmark';
    case 'Pain Relief':
      return 'flash';
    case 'Skin Care':
      return 'sparkles';
    case 'Baby Care':
      return 'happy';
    case 'Ayurvedic':
      return 'leaf';
    default:
      return 'medical';
  }
};

const ProductDetailsScreen = ({ navigation, route }) => {
  const { productId, product: passedProduct } = route.params || {};
  const { cart, addToCart, cartCount } = useCart();

  const [quantity, setQuantity] = useState(1);

  // Find product from dataset if not passed directly
  const product = useMemo(() => {
    if (passedProduct) return passedProduct;
    return pharmacyProducts.find((p) => p.id === productId) || pharmacyProducts[0];
  }, [passedProduct, productId]);

  // Related products from same category
  const relatedProducts = useMemo(() => {
    return pharmacyProducts
      .filter((p) => p.category === product?.category && p.id !== product?.id)
      .slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.slate} />
          <Text style={styles.notFoundText}>Product not found.</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backHomeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert(
      'Added to Cart! 🛒',
      `${quantity} × ${product.name} added to your basket.`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart'),
        },
      ]
    );
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigation.navigate('Checkout');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Product Details
        </Text>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
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
        {/* PRODUCT VISUAL / ICON HERO */}
        <View style={styles.imageCard}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={getCategoryIcon(product.category)}
              size={80}
              color={colors.primary}
            />
          </View>

          {product.discount && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>{product.discount}</Text>
            </View>
          )}

          {product.inStock && (
            <View style={styles.stockTag}>
              <Ionicons name="checkmark-circle" size={12} color="#00B894" />
              <Text style={styles.stockTagText}>In Stock</Text>
            </View>
          )}
        </View>

        {/* BASIC META */}
        <View style={styles.metaContainer}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>{product.brand}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#FFA000" />
              <Text style={styles.ratingText}>{product.rating || '4.8'}</Text>
              {product.reviewsCount && (
                <Text style={styles.reviewsCount}>
                  ({product.reviewsCount} reviews)
                </Text>
              )}
            </View>
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>
          {product.packSize && (
            <Text style={styles.packSizeText}>{product.packSize}</Text>
          )}

          {/* PRICE ROW */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.mrp && product.mrp > product.price && (
              <Text style={styles.mrp}>₹{product.mrp}</Text>
            )}
            {product.discount && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>{product.discount}</Text>
              </View>
            )}
          </View>

          {/* PRESCRIPTION WARNING (IF RX) */}
          {product.requiresPrescription && (
            <View style={styles.rxWarningCard}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.coral}
              />
              <View style={styles.rxWarningInfo}>
                <Text style={styles.rxWarningTitle}>Prescription Required</Text>
                <Text style={styles.rxWarningDesc}>
                  A valid doctor's prescription is mandatory to dispense this medicine.
                  You can upload during checkout.
                </Text>
              </View>
            </View>
          )}

          {/* QUANTITY PICKER ROW */}
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Select Quantity:</Text>
            <View style={styles.qtyPicker}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* HIGHLIGHTS & MEDICINE SPECS */}
          <Text style={styles.sectionHeading}>Product Overview</Text>
          <Text style={styles.descText}>{product.description}</Text>

          {product.activeIngredients && (
            <View style={styles.infoBlock}>
              <View style={styles.infoBlockHeader}>
                <Ionicons name="flask-outline" size={16} color={colors.primary} />
                <Text style={styles.infoBlockTitle}>Active Ingredients</Text>
              </View>
              <Text style={styles.infoBlockContent}>{product.activeIngredients}</Text>
            </View>
          )}

          {product.uses && (
            <View style={styles.infoBlock}>
              <View style={styles.infoBlockHeader}>
                <Ionicons name="bandage-outline" size={16} color={colors.primary} />
                <Text style={styles.infoBlockTitle}>Key Uses</Text>
              </View>
              <Text style={styles.infoBlockContent}>{product.uses}</Text>
            </View>
          )}

          {product.dosage && (
            <View style={styles.infoBlock}>
              <View style={styles.infoBlockHeader}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.infoBlockTitle}>Dosage & Administration</Text>
              </View>
              <Text style={styles.infoBlockContent}>{product.dosage}</Text>
            </View>
          )}

          {/* DELIVERY PROMISE BANNER */}
          <View style={styles.deliveryPromise}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.deliveryPromiseText}>
              100% Genuine Medicine • Stored at optimal temperature • Express Delivery
            </Text>
          </View>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionHeading}>Similar Healthcare Items</Text>
              <View style={styles.relatedGrid}>
                {relatedProducts.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    navigation={navigation}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomPriceLabel}>Total ({quantity} item{quantity > 1 ? 's' : ''})</Text>
          <Text style={styles.bottomPriceValue}>₹{product.price * quantity}</Text>
        </View>

        <View style={styles.bottomBtnGroup}>
          <TouchableOpacity
            style={styles.addCartBtn}
            activeOpacity={0.85}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={18} color={colors.primary} />
            <Text style={styles.addCartText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyNowBtn}
            activeOpacity={0.85}
            onPress={handleBuyNow}
          >
            <Ionicons name="flash" size={16} color={colors.white} />
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingBottom: 20,
  },
  imageCard: {
    height: 220,
    backgroundColor: '#E8F7F4',
    margin: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D4EFE8',
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  discountTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountTagText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  stockTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockTagText: {
    color: '#00B894',
    fontSize: 10,
    fontWeight: '800',
  },
  metaContainer: {
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#946C00',
  },
  reviewsCount: {
    fontSize: 10,
    color: colors.slate,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.secondary,
    lineHeight: 28,
  },
  packSizeText: {
    fontSize: 12,
    color: colors.slate,
    marginTop: 4,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    gap: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.secondary,
  },
  mrp: {
    fontSize: 15,
    color: colors.slate,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#E8F8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountPillText: {
    color: '#00B894',
    fontSize: 11,
    fontWeight: '900',
  },
  rxWarningCard: {
    marginTop: 16,
    backgroundColor: '#FFF2EC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  rxWarningInfo: {
    flex: 1,
  },
  rxWarningTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.coral,
  },
  rxWarningDesc: {
    fontSize: 11,
    color: '#7C3418',
    marginTop: 3,
    lineHeight: 16,
  },
  qtySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  qtyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
    minWidth: 20,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    color: colors.slate,
    lineHeight: 20,
  },
  infoBlock: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  infoBlockContent: {
    fontSize: 12,
    color: colors.slate,
    lineHeight: 18,
  },
  deliveryPromise: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FAF7',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  deliveryPromiseText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  relatedSection: {
    marginTop: 24,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 10,
  },
  backHomeBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backHomeText: {
    color: colors.white,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bottomPriceWrap: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: colors.slate,
    fontWeight: '700',
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.secondary,
  },
  bottomBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCartBtn: {
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#B3EFE6',
  },
  addCartText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  buyNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyNowText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
});

export default ProductDetailsScreen;