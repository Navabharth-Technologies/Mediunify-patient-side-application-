import React, { useState, useEffect } from 'react';
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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../../utils/alert';
import { useCart } from '../../../context/CartContext';
import pharmacyProducts from '../../../data/pharmacyProducts';
import WebFooter from '../../../components/web/WebFooter';

// CURATED TOP DEALS (Matching Sanofi top deals in reference image)
const TOP_DEALS = [
  {
    id: 'deal-1',
    name: 'Depura 60000 IU Vitamin D3 Oral Solution',
    packSize: 'Bottle of 5 ml oral solution',
    price: 100,
    mrp: 116.87,
    discount: '14% off',
    rating: 4.4,
    reviews: '2648',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    brand: 'Sanofi',
    category: 'Vitamins & Minerals',
  },
  {
    id: 'deal-2',
    name: 'Enterogermina Probiotic Supplement | For Gut Health',
    packSize: 'Strip of 4 capsules',
    price: 172,
    mrp: 201.9,
    discount: '15% off',
    rating: 4.6,
    reviews: '1820',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300',
    brand: 'Sanofi',
    category: 'Digestive Care',
  },
  {
    id: 'deal-3',
    name: 'Lactacyd Feminine Hygiene Wash',
    packSize: 'Bottle of 100 ml gentle wash',
    price: 327,
    mrp: 329,
    discount: '7% off',
    rating: 4.7,
    reviews: '721',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
    brand: 'Sanofi',
    category: 'Personal Care',
  },
  {
    id: 'deal-4',
    name: 'Combiflam Pain Relief Cream',
    packSize: 'Tube of 30 gm cream',
    price: 121,
    mrp: 131.25,
    discount: '8% off',
    rating: 4.5,
    reviews: '3410',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=300',
    brand: 'Sanofi',
    category: 'Pain Relief',
  },
  {
    id: 'deal-5',
    name: 'Buscogast Hyoscine Butylbromide Tablets',
    packSize: 'Strip of 10 tablets',
    price: 43.5,
    mrp: 45.78,
    discount: '5% off',
    rating: 4.3,
    reviews: '237',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300',
    brand: 'Sanofi',
    category: 'Stomach Care',
  },
];

// LAST MINUTE BUYS
const LAST_MINUTE_BUYS = [
  {
    id: 'quick-1',
    name: 'Vicks Vaporub 25ml Relief Balm',
    packSize: 'Jar of 25 ml',
    price: 85,
    mrp: 95,
    discount: '11% off',
    rating: 4.8,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    brand: 'Procter & Gamble',
    category: 'Cold & Cough',
  },
  {
    id: 'quick-2',
    name: 'Hansaplast Waterproof Bandages (Pack of 20)',
    packSize: 'Box of 20 strips',
    price: 65,
    mrp: 75,
    discount: '13% off',
    rating: 4.7,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300',
    brand: 'Hansaplast',
    category: 'First Aid',
  },
  {
    id: 'quick-3',
    name: 'Dettol Instant Hand Sanitizer 50ml',
    packSize: 'Bottle of 50 ml',
    price: 25,
    mrp: 30,
    discount: '17% off',
    rating: 4.9,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300',
    brand: 'Reckitt',
    category: 'Hygiene',
  },
  {
    id: 'quick-4',
    name: 'Dolo 650mg Paracetamol Tablets',
    packSize: 'Strip of 15 tablets',
    price: 31,
    mrp: 34.5,
    discount: '10% off',
    rating: 4.9,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    brand: 'Micro Labs',
    category: 'Medicines',
  },
];

// DEFAULT MOCKUP ITEMS (Matches the user's uploaded screenshot)
const DEFAULT_MOCKUP_ITEMS = [
  {
    id: 'mock-1',
    name: 'Tetmosol Medicated Soap with 5% Monosulfiram for Skin Infections',
    packSize: 'Packet of 100 gm soap',
    price: 97,
    mrp: 105.7,
    discount: '8% off',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=300',
    brand: 'Tetmosol',
    category: 'Skin Care',
  },
  {
    id: 'mock-2',
    name: 'Brilante Intense Brightening Serum | For Dark Spots | Paraben & Allergen-Free',
    packSize: 'Bottle of 50 ml serum',
    price: 669,
    mrp: 769,
    discount: '13% off',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300',
    brand: 'Brilante',
    category: 'Skin Care',
  },
];

const CartScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const {
    pharmacyCart,
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    pharmacySubtotal,
    pharmacyMrpTotal,
    pharmacySavings,
    pharmacyDiscountAmount,
    pharmacyDeliveryFee,
    pharmacyPackagingFee,
    pharmacyFinalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    selectedAddress,
    updateAddress,
  } = useCart();

  const [localDemoItems, setLocalDemoItems] = useState(DEFAULT_MOCKUP_ITEMS);

  // Active items in pharmacy cart
  const items = (pharmacyCart && pharmacyCart.length > 0) ? pharmacyCart : localDemoItems;
  const itemsCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleIncrease = (item) => {
    if (pharmacyCart && pharmacyCart.some((i) => i.id === item.id)) {
      increaseQuantity(item.id, 'pharmacy');
    } else {
      setLocalDemoItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, quantity: (it.quantity || 1) + 1 } : it))
      );
    }
  };

  const handleDecrease = (item) => {
    if (pharmacyCart && pharmacyCart.some((i) => i.id === item.id)) {
      decreaseQuantity(item.id, 'pharmacy');
    } else {
      setLocalDemoItems((prev) =>
        prev
          .map((it) => (it.id === item.id ? { ...it, quantity: (it.quantity || 1) - 1 } : it))
          .filter((it) => it.quantity > 0)
      );
    }
  };

  const handleAddDealToCart = (deal) => {
    if (addToCart) {
      addToCart({
        id: deal.id,
        name: deal.name,
        price: deal.price,
        mrp: deal.mrp,
        discount: deal.discount,
        image: deal.image,
        packSize: deal.packSize,
        category: deal.category,
        brand: deal.brand,
      }, 1, 'pharmacy');
    } else {
      setLocalDemoItems((prev) => [
        ...prev,
        {
          id: deal.id,
          name: deal.name,
          price: deal.price,
          mrp: deal.mrp,
          discount: deal.discount,
          quantity: 1,
          image: deal.image,
          packSize: deal.packSize,
          category: deal.category,
          brand: deal.brand,
        },
      ]);
    }
    showAlert('Added to Cart! 🛒', `${deal.name} has been added to your cart.`);
  };

  // Care Plan state
  const [hasCarePlan, setHasCarePlan] = useState(false);

  // Organ vital package checkup upsell state
  const [includeHealthPackage, setIncludeHealthPackage] = useState(false);
  const healthPackageFee = 649;

  // Coupon modal state
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);

  // Address edit modal state
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempAddress, setTempAddress] = useState(selectedAddress?.addressLine || 'Gurgaon');

  const handleApplyPromo = (code) => {
    const promo = code || couponInput.trim().toUpperCase();
    if (!promo) {
      setCouponMessage({ success: false, text: 'Please enter a valid coupon code.' });
      return;
    }
    const res = applyCoupon ? applyCoupon(promo) : { success: true, coupon: { code: promo, discount: 50 } };
    if (res && res.success) {
      setCouponMessage({ success: true, text: `🎉 ${res.coupon?.code || promo} applied!` });
      setTimeout(() => setCouponModalVisible(false), 1200);
    } else {
      setCouponMessage({ success: false, text: 'Invalid promo code. Try MEDI20 or HEALTH50.' });
    }
  };

  const handleAddMembership = () => {
    setHasCarePlan(true);
    showAlert('Care Plan Added! 🛡️', 'You have unlocked extra ₹92 savings on this order.');
  };

  const handleToggleHealthPackage = () => {
    setIncludeHealthPackage(!includeHealthPackage);
  };

  // Exact calculations
  const calculatedSubtotal = pharmacySubtotal > 0
    ? pharmacySubtotal
    : items.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);

  const calculatedMrpTotal = pharmacyMrpTotal > 0
    ? pharmacyMrpTotal
    : items.reduce((sum, it) => sum + ((parseFloat(it.mrp) || (it.price * 1.15)) * (it.quantity || 1)), 0);

  const calculatedSavings = pharmacySavings > 0
    ? pharmacySavings
    : Math.max(0, calculatedMrpTotal - calculatedSubtotal);

  const carePlanSavings = hasCarePlan ? 92 : 0;
  const carePlanCost = hasCarePlan ? 165 : 0;
  const totalHandlingCharges = 12;
  const totalDiscount = calculatedSavings + (pharmacyDiscountAmount || 0) + carePlanSavings;
  const netPayable = Math.max(
    0,
    calculatedSubtotal +
      totalHandlingCharges +
      (includeHealthPackage ? healthPackageFee : 0) +
      carePlanCost -
      carePlanSavings -
      (pharmacyDiscountAmount || 0)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* BREADCRUMB ROW */}
        <View style={styles.breadcrumbWrap}>
          <View style={styles.breadcrumbInner}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
            <TouchableOpacity onPress={() => navigation.navigate('Pharmacy')} activeOpacity={0.7}>
              <Text style={styles.breadcrumbLink}>Pharmacy</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
            <Text style={styles.breadcrumbActive}>Shopping Cart</Text>
          </View>
        </View>

        {/* MAIN 2-COLUMN DESKTOP LAYOUT */}
        <View style={styles.mainLayoutWrapper}>
          {/* ============================================================
              LEFT COLUMN: CART ITEMS & DEALS SECTIONS
          ============================================================ */}
          <View style={styles.leftColumn}>
            {/* 1. CART ITEMS SECTION */}
            <View style={styles.cartItemsCard}>
              <View style={styles.cartHeaderRow}>
                <Text style={styles.cartHeaderTitle}>
                  {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''} added` : '0 items added'}
                </Text>
              </View>

              <Text style={styles.prescriptionNote}>Items not requiring prescription</Text>

              {items.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartSub}>Add medicines, healthcare devices, and wellness products.</Text>
                  <TouchableOpacity
                    style={styles.browseProductsBtn}
                    onPress={() => navigation.navigate('Pharmacy')}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.browseProductsBtnText}>Browse Medicines</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.itemsListWrap}>
                  {items.map((item, index) => {
                    const price = item.price || 97;
                    const mrp = item.mrp || (price * 1.15).toFixed(1);
                    const qty = item.quantity || 1;
                    const discountText = item.discount || '8% off';

                    return (
                      <View key={item.id || index} style={styles.itemRowContainer}>
                        {/* Product Thumbnail */}
                        <View style={styles.itemImageWrap}>
                          <Image
                            source={{
                              uri: item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
                            }}
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        </View>

                        {/* Product Name & Subtitle */}
                        <View style={styles.itemDetailsCol}>
                          <Text style={styles.itemNameText} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text style={styles.itemSubtitleText}>
                            {item.packSize || item.category || 'Packet of 100 gm soap'}
                          </Text>
                        </View>

                        {/* Price & Quantity Selector */}
                        <View style={styles.itemActionsCol}>
                          <View style={styles.itemPriceRow}>
                            <Text style={styles.itemPriceVal}>₹{price}</Text>
                            <Text style={styles.itemMrpVal}>₹{mrp}</Text>
                            <Text style={styles.itemDiscountVal}>{discountText}</Text>
                          </View>

                          {/* Red Quantity Selector Box */}
                          <View style={styles.qtySelectorBox}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => handleDecrease(item)}
                              activeOpacity={0.7}
                            >
                              {(item.quantity || 1) > 1 ? (
                                <Text style={styles.qtyMinusText}>−</Text>
                              ) : (
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              )}
                            </TouchableOpacity>

                            <Text style={styles.qtyValueText}>{item.quantity || 1}</Text>

                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => handleIncrease(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.qtyPlusText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 2. TOP DEALS SECTION (Matching "Sanofi top deals") */}
            <View style={styles.dealsSectionCard}>
              <View style={styles.dealsHeaderRow}>
                <Text style={styles.dealsSectionTitle}>Sanofi top deals</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dealsScrollContainer}
              >
                {TOP_DEALS.map((deal) => (
                  <View key={deal.id} style={styles.dealCard}>
                    <View style={styles.dealImageWrap}>
                      <Image source={{ uri: deal.image }} style={styles.dealImage} resizeMode="contain" />
                    </View>

                    <Text style={styles.dealNameText} numberOfLines={2}>
                      {deal.name}
                    </Text>
                    <Text style={styles.dealPackSize} numberOfLines={1}>
                      {deal.packSize}
                    </Text>

                    {/* Rating */}
                    <View style={styles.dealRatingRow}>
                      <View style={styles.starRatingBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.starRatingText}>{deal.rating}</Text>
                      </View>
                      <Text style={styles.reviewsCountText}>({deal.reviews})</Text>
                    </View>

                    <Text style={styles.dealEtaText}>{deal.eta}</Text>

                    {/* Price & Discount */}
                    <View style={styles.dealPriceRow}>
                      <Text style={styles.dealPriceText}>₹{deal.price}</Text>
                      <Text style={styles.dealMrpText}>₹{deal.mrp}</Text>
                      <Text style={styles.dealDiscountText}>{deal.discount}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleAddDealToCart(deal)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addToCartBtnText}>Add to cart</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 3. LAST MINUTE BUYS SECTION */}
            <View style={styles.dealsSectionCard}>
              <View style={styles.dealsHeaderRow}>
                <Text style={styles.dealsSectionTitle}>Last minute buys</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dealsScrollContainer}
              >
                {LAST_MINUTE_BUYS.map((buy) => (
                  <View key={buy.id} style={styles.dealCard}>
                    <View style={styles.dealImageWrap}>
                      <Image source={{ uri: buy.image }} style={styles.dealImage} resizeMode="contain" />
                    </View>

                    <Text style={styles.dealNameText} numberOfLines={2}>
                      {buy.name}
                    </Text>
                    <Text style={styles.dealPackSize} numberOfLines={1}>
                      {buy.packSize}
                    </Text>

                    <View style={styles.dealRatingRow}>
                      <View style={styles.starRatingBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.starRatingText}>{buy.rating}</Text>
                      </View>
                    </View>

                    <Text style={styles.dealEtaText}>{buy.eta}</Text>

                    <View style={styles.dealPriceRow}>
                      <Text style={styles.dealPriceText}>₹{buy.price}</Text>
                      <Text style={styles.dealMrpText}>₹{buy.mrp}</Text>
                      <Text style={styles.dealDiscountText}>{buy.discount}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleAddDealToCart(buy)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addToCartBtnText}>Add to cart</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* ============================================================
              RIGHT COLUMN: CARE PLAN, COUPON, VITAL UPSELL, BILL SUMMARY
          ============================================================ */}
          <View style={styles.rightColumn}>
            {/* 1. CARE PLAN / VIP MEMBERSHIP CARD */}
            <View style={styles.carePlanCard}>
              <View style={styles.carePlanBadge}>
                <Text style={styles.carePlanBadgeText}>Care Plan</Text>
              </View>

              <Text style={styles.carePlanHeading}>You can save extra ₹92 on this order</Text>
              <Text style={styles.carePlanSub}>Become a careplan member</Text>
              <Text style={styles.carePlanPriceText}>
                3 months membership for only <Text style={{ fontWeight: '800', color: '#0F172A' }}>₹165</Text>{' '}
                <Text style={styles.carePlanMrp}>₹549</Text> <Text style={styles.carePlanDiscount}>70% off</Text>
              </Text>

              <View style={styles.carePlanActionsRow}>
                <TouchableOpacity
                  style={styles.knowMoreBtn}
                  onPress={() => showAlert('Care Plan Benefits', 'Enjoy extra discounts on all orders, zero delivery fees, and priority health support.')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.knowMoreText}>Know more</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addMembershipBtn, hasCarePlan && { backgroundColor: '#10B981' }]}
                  onPress={handleAddMembership}
                  activeOpacity={0.88}
                >
                  <Text style={styles.addMembershipBtnText}>
                    {hasCarePlan ? '✓ Added' : 'Add membership'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. APPLY COUPON CARD */}
            <TouchableOpacity
              style={styles.couponCard}
              onPress={() => setCouponModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.couponCardLeft}>
                <View style={styles.couponIconBox}>
                  <Ionicons name="pricetag" size={16} color="#475569" />
                </View>
                <Text style={styles.couponCardText}>
                  {appliedCoupon ? `Applied: ${appliedCoupon.code} (-₹${appliedCoupon.discount})` : 'Apply coupon'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* 3. HEALTH CHECKUP UPSELL ("Check the health of your vital organs") */}
            <View style={styles.vitalOrgansCard}>
              <View style={styles.vitalHeaderRow}>
                <Text style={styles.vitalHeaderTitle}>Check the health of your vital organs</Text>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              </View>

              <TouchableOpacity
                style={styles.vitalCheckboxRow}
                onPress={handleToggleHealthPackage}
                activeOpacity={0.85}
              >
                <View style={[styles.customCheckbox, includeHealthPackage && styles.customCheckboxChecked]}>
                  {includeHealthPackage && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.vitalPackageTitle}>
                  Book Good Health Silver Package for just ₹649
                </Text>
              </TouchableOpacity>

              <Text style={styles.vitalPackageDesc}>
                Get the tests done easily from your home. This package will help you in identifying potential disorders and deficiencies at an early stage.
              </Text>
              <Text style={styles.vitalPackageSubText}>Pay later on home sample collection</Text>
            </View>

            {/* 4. BILL SUMMARY CARD */}
            <View style={styles.billSummaryCard}>
              <Text style={styles.billSummaryTitle}>Bill summary</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item total (MRP)</Text>
                <Text style={styles.billValue}>₹{calculatedMrpTotal.toFixed(1)}</Text>
              </View>

              <View style={styles.billRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.billLabel}>Handling charges</Text>
                  <Ionicons name="help-circle-outline" size={13} color="#94A3B8" />
                </View>
                <Text style={styles.billValue}>₹{totalHandlingCharges}</Text>
              </View>

              {totalDiscount > 0 && (
                <View style={styles.billRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.billLabel}>Total discount</Text>
                    <Ionicons name="help-circle-outline" size={13} color="#94A3B8" />
                  </View>
                  <Text style={[styles.billValue, { color: '#16A34A', fontWeight: '700' }]}>
                    -₹{totalDiscount.toFixed(1)}
                  </Text>
                </View>
              )}

              {includeHealthPackage && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Good Health Package</Text>
                  <Text style={styles.billValue}>₹{healthPackageFee}</Text>
                </View>
              )}

              {hasCarePlan && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Care Plan Membership (3 Mo)</Text>
                  <Text style={styles.billValue}>₹165</Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Shipping fee</Text>
                <Text style={styles.billValue}>FREE</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billTotalRow}>
                <Text style={styles.toPayLabel}>To be paid</Text>
                <Text style={styles.toPayVal}>₹{netPayable.toFixed(0)}</Text>
              </View>
            </View>

            {/* 5. DELIVERING TO CARD */}
            <View style={styles.deliveringToCard}>
              <View style={styles.deliveringLeft}>
                <Ionicons name="home-outline" size={18} color="#1E3A8A" />
                <View>
                  <Text style={styles.deliveringLabel}>Delivering to</Text>
                  <Text style={styles.deliveringAddress} numberOfLines={1}>
                    {tempAddress || 'Kuvempunagar, Mysore'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addAddressLink}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* 6. PRIMARY CONTINUE / CHECKOUT BUTTON */}
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => navigation.navigate('Checkout')}
              activeOpacity={0.88}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WEB FOOTER */}
        <View style={{ width: '100%', marginTop: 50 }}>
          <WebFooter navigation={navigation} />
        </View>
      </ScrollView>

      {/* ============================================================
          APPLY COUPON MODAL
      ============================================================ */}
      <Modal
        visible={couponModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCouponModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply Promo Code</Text>
              <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Enter promo code (e.g. MEDI20)"
                placeholderTextColor="#94A3B8"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => handleApplyPromo()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Quick chips */}
            <View style={styles.promoChipsRow}>
              {['MEDI20', 'HEALTH50', 'FLAT100'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.promoChip}
                  onPress={() => handleApplyPromo(chip)}
                >
                  <Text style={styles.promoChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {couponMessage && (
              <Text
                style={[
                  styles.couponMessageText,
                  { color: couponMessage.success ? '#16A34A' : '#DC2626' },
                ]}
              >
                {couponMessage.text}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          CHANGE ADDRESS MODAL
      ============================================================ */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAddressModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalTextInput, { height: 70, textAlignVertical: 'top', marginTop: 10 }]}
              placeholder="Enter complete house address & locality"
              placeholderTextColor="#94A3B8"
              value={tempAddress}
              onChangeText={setTempAddress}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalApplyBtn, { width: '100%', marginTop: 14, height: 44 }]}
              onPress={() => {
                if (updateAddress) {
                  updateAddress({ addressLine: tempAddress });
                }
                setAddressModalVisible(false);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalApplyBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  // BREADCRUMB
  breadcrumbWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  breadcrumbInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // MAIN LAYOUT WRAPPER (2-Column Desktop Grid)
  mainLayoutWrapper: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
  },

  // LEFT COLUMN
  leftColumn: {
    flex: 1.4,
    gap: 28,
  },

  // CART ITEMS CARD
  cartItemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cartHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  prescriptionNote: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },

  // Empty Cart
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCartSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 12,
  },
  browseProductsBtn: {
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseProductsBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Items List Rows
  itemsListWrap: {
    gap: 16,
  },
  itemRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  itemImageWrap: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetailsCol: {
    flex: 1,
    gap: 4,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 19,
  },
  itemSubtitleText: {
    fontSize: 12,
    color: '#64748B',
  },
  itemActionsCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemPriceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemMrpVal: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  itemDiscountVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },

  // Red Quantity Selector Box (Matching Reference Image)
  qtySelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    borderRadius: 6,
    height: 32,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyMinusText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '800',
  },
  qtyPlusText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '800',
  },
  qtyValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    paddingHorizontal: 6,
  },

  // DEALS SECTIONS (Sanofi Top Deals & Last Minute Buys)
  dealsSectionCard: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
  },
  dealsHeaderRow: {
    marginBottom: 14,
  },
  dealsSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
  },
  dealsScrollContainer: {
    gap: 14,
    paddingRight: 20,
    paddingBottom: 6,
  },
  dealCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  dealImageWrap: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  dealNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    height: 32,
    marginBottom: 2,
  },
  dealPackSize: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 6,
  },
  dealRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  starRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16A34A',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  starRatingText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewsCountText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  dealEtaText: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 6,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  dealPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  dealMrpText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  dealDiscountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  addToCartBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addToCartBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#EF4444',
  },

  // ============================================================
  // RIGHT COLUMN (STICKY SIDEBAR)
  // ============================================================
  rightColumn: {
    width: 380,
    gap: 16,
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: Platform.OS === 'web' ? 20 : 0,
  },

  // 1. CARE PLAN CARD
  carePlanCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 16,
    gap: 6,
  },
  carePlanBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  carePlanBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  carePlanHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  carePlanSub: {
    fontSize: 12,
    color: '#64748B',
  },
  carePlanPriceText: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  carePlanMrp: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  carePlanDiscount: {
    color: '#16A34A',
    fontWeight: '700',
  },
  carePlanActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  knowMoreBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  knowMoreText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  addMembershipBtn: {
    flex: 1.2,
    backgroundColor: '#FF5252',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembershipBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 2. APPLY COUPON CARD
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  couponCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // 3. VITAL ORGANS UPSELL CARD
  vitalOrgansCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  vitalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  vitalCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  customCheckboxChecked: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  vitalPackageTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
  },
  vitalPackageDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  vitalPackageSubText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },

  // 4. BILL SUMMARY CARD
  billSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 18,
    gap: 10,
  },
  billSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  toPayLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  toPayVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },

  // 5. DELIVERING TO CARD
  deliveringToCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deliveringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  deliveringLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  deliveringAddress: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 220,
  },
  addAddressLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5252',
  },

  // 6. PRIMARY CONTINUE BUTTON
  continueBtn: {
    backgroundColor: '#FF5252',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modalTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  modalApplyBtn: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  promoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  promoChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  couponMessageText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default CartScreenWeb;
