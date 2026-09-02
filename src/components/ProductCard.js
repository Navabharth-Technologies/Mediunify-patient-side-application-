import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import colors from '../theme/colors';

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

const ProductCard = ({ product, navigation }) => {
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();

  const cartItem = (cart || []).find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() =>
        navigation.navigate('ProductDetails', {
          product,
          productId: product.id,
        })
      }
    >
      {/* PRODUCT ICON / IMAGE CONTAINER */}
      <View style={styles.imageContainer}>
        <Ionicons
          name={getCategoryIcon(product.category)}
          size={42}
          color={colors.primary}
        />

        {/* DISCOUNT BADGE */}
        {product.discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}</Text>
          </View>
        ) : null}

        {/* PRESCRIPTION REQUIRED BADGE */}
        {product.requiresPrescription ? (
          <View style={styles.rxBadge}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        ) : null}
      </View>

      {/* RATING & BRAND */}
      <View style={styles.metaRow}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        {product.rating ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFA000" />
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
        ) : null}
      </View>

      {/* PRODUCT NAME */}
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>

      {/* PACK SIZE */}
      {product.packSize ? (
        <Text style={styles.packSize} numberOfLines={1}>
          {product.packSize}
        </Text>
      ) : null}

      {/* PRICE ROW */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{product.price}</Text>
        {product.mrp && product.mrp > product.price ? (
          <Text style={styles.mrp}>₹{product.mrp}</Text>
        ) : null}
      </View>

      {/* ADD TO CART / QUANTITY SELECTOR */}
      {quantity === 0 ? (
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
        >
          <Ionicons name="cart-outline" size={15} color={colors.white} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.qtyBtn}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              decreaseQuantity(product.id);
            }}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>

          <Text style={styles.qtyText}>{quantity}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              increaseQuantity(product.id);
            }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
  },
  imageContainer: {
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F0FAF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E8F8F2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#00A382',
    fontSize: 9,
    fontWeight: '800',
  },
  rxBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF0EA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD3C4',
  },
  rxText: {
    color: colors.coral,
    fontSize: 9,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brand: {
    fontSize: 10,
    color: colors.slate,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#946C00',
  },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 17,
    minHeight: 34,
  },
  packSize: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 8,
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
  mrp: {
    fontSize: 11,
    color: colors.slate,
    textDecorationLine: 'line-through',
  },
  addButton: {
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  quantityContainer: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F7F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
  },
});

export default ProductCard;