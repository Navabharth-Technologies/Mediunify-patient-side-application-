import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';

const PROMO_CHIPS = ['UNNATHI20', 'HEALTH50', 'FIRSTFREE'];

const PAYMENT_METHODS = [
  {
    id: 'COD',
    title: 'Cash on Delivery (COD)',
    subtitle: 'Pay cash or scan QR at your doorstep',
    icon: 'cash-outline',
  },
  {
    id: 'UPI',
    title: 'UPI / Online Pay',
    subtitle: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'CARD',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, MasterCard, RuPay',
    icon: 'card-outline',
  },
];

const LAB_SAMPLE_SLOTS = [
  'Today, 07:30 AM - 09:00 AM (Fasting)',
  'Today, 10:30 AM - 12:00 PM',
  'Tomorrow, 07:30 AM - 09:00 AM (Fasting)',
  'Tomorrow, 10:30 AM - 12:00 PM',
  'Tomorrow, 04:30 PM - 06:00 PM',
];

const CartScreen = ({ navigation, route }) => {
  const {
    pharmacyCart,
    labCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    pharmacyCartCount,
    pharmacySubtotal,
    pharmacyMrpTotal,
    pharmacySavings,
    pharmacyDiscountAmount,
    pharmacyDeliveryFee,
    pharmacyPackagingFee,
    pharmacyFinalTotal,
    labCartCount,
    labSubtotal,
    labMrpTotal,
    labSavings,
    labDiscountAmount,
    labSampleFee,
    labFinalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    selectedAddress,
    updateAddress,
    addOrder,
  } = useCart();

  // Active Cart Tab: 'pharmacy' vs 'lab'
  const [activeTab, setActiveTab] = useState(
    route?.params?.initialTab ||
      (labCartCount > 0 && pharmacyCartCount === 0 ? 'lab' : 'pharmacy')
  );

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route?.params?.initialTab);
    }
  }, [route?.params?.initialTab]);

  // Delivery / Patient Details state
  const [userName, setUserName] = useState(selectedAddress.name || 'Ramesh Kumar');
  const [userPhone, setUserPhone] = useState(selectedAddress.phone || '9876543210');
  const [userAddress, setUserAddress] = useState(
    selectedAddress.addressLine || 'Flat 402, Green Valley Apartments, Kuvempunagar'
  );
  const [userCity, setUserCity] = useState(selectedAddress.city || 'Mysore');
  const [userPincode, setUserPincode] = useState(selectedAddress.pincode || '570023');
  const [addressTag, setAddressTag] = useState(selectedAddress.tag || 'Home');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Lab Specific State
  const [labVisitType, setLabVisitType] = useState('HOME_COLLECTION'); // HOME_COLLECTION vs LAB_VISIT
  const [selectedLabSlot, setSelectedLabSlot] = useState(LAB_SAMPLE_SLOTS[0]);
  const [patientAge, setPatientAge] = useState('32');
  // Check if cart has radiology scans (must be done in hospital)
  const hasRadiologyScans = labCart.some(
    (item) =>
      item.category === 'Radiology' ||
      item.category === 'Diagnostic Scan' ||
      item.modality ||
      item.modalityCode ||
      item.itemType === 'diagnostic' ||
      (item.categoryLabel &&
        !item.categoryLabel.toLowerCase().includes('blood') &&
        !item.categoryLabel.toLowerCase().includes('urine')) ||
      item.name?.toLowerCase().includes('mri') ||
      item.name?.toLowerCase().includes('ct scan') ||
      item.name?.toLowerCase().includes('x-ray') ||
      item.name?.toLowerCase().includes('ultrasound') ||
      item.name?.toLowerCase().includes('mammogram') ||
      item.name?.toLowerCase().includes('scan') ||
      item.name?.toLowerCase().includes('ecg') ||
      item.name?.toLowerCase().includes('echo')
  );

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);

  // Prescription state
  const [uploadedRx, setUploadedRx] = useState(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isBooking, setIsBooking] = useState(false);

  // Check if pharmacy prescription required
  const prescriptionItems = pharmacyCart.filter(
    (item) => item.requiresPrescription || item.category === 'Medicines'
  );

  // Pick prescription photo
  const pickPrescription = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required to upload prescription.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadedRx(result.assets[0].uri);
        Alert.alert('Prescription Uploaded', 'Doctor prescription attached successfully!');
      }
    } catch (e) {
      console.log('Error picking image:', e);
    }
  };

  // Get GPS Location
  const handleUseCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to fetch address.');
        setGpsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        const fullAddr = `${geocode.name ? `${geocode.name}, ` : ''}${geocode.street ? `${geocode.street}, ` : ''}${geocode.district || geocode.subregion || ''}`;
        setUserAddress(fullAddr || 'Near Current Location');
        if (geocode.city) setUserCity(geocode.city);
        if (geocode.postalCode) setUserPincode(geocode.postalCode);

        updateAddress({
          name: userName,
          phone: userPhone,
          addressLine: fullAddr,
          city: geocode.city || userCity,
          pincode: geocode.postalCode || userPincode,
          state: geocode.region || 'Karnataka',
          tag: addressTag,
        });

        Alert.alert('Location Fetched', 'Your address has been updated from GPS.');
      }
      setGpsLoading(false);
    } catch (e) {
      setGpsLoading(false);
      Alert.alert('Location Error', 'Could not detect location. Please enter manually.');
    }
  };

  // Apply Coupon Handler
  const handleApplyCoupon = (codeToApply) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) {
      setCouponMsg({ text: 'Please enter a valid coupon code.', success: false });
      return;
    }
    const res = applyCoupon(code);
    setCouponMsg({ text: res.message, success: res.success });
    if (res.success) setCouponInput('');
  };

  // ==========================================
  // PLACE PHARMACY ORDER
  // ==========================================
  const handlePlacePharmacyOrder = async () => {
    if (pharmacyCart.length === 0) {
      Alert.alert('Empty Cart', 'Your Pharmacy cart is empty. Please add medicines first.');
      return;
    }

    if (!userAddress.trim() || userAddress.length < 5) {
      Alert.alert('Address Incomplete', 'Please enter a complete delivery address.');
      return;
    }

    if (!userPhone.trim() || userPhone.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (prescriptionItems.length > 0 && !uploadedRx) {
      Alert.alert(
        'Doctor Prescription Required',
        'Your cart contains prescription drugs. Please attach a valid prescription before placing the order.'
      );
      return;
    }

    setIsBooking(true);

    setTimeout(async () => {
      const orderId = `UNC${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const dateString = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const newOrder = {
        id: orderId,
        date: dateString,
        status: 'Confirmed',
        paymentMethod:
          paymentMethod === 'COD'
            ? 'Cash on Delivery'
            : paymentMethod === 'UPI'
            ? 'UPI / Online'
            : 'Credit/Debit Card',
        paymentStatus: paymentMethod === 'COD' ? 'Pending on Delivery' : 'Paid Online',
        total: pharmacyFinalTotal,
        subtotal: pharmacySubtotal,
        deliveryFee: pharmacyDeliveryFee,
        packagingFee: pharmacyPackagingFee,
        discount: pharmacyDiscountAmount,
        items: [...pharmacyCart],
        prescriptionAttached: !!uploadedRx,
        address: {
          name: userName,
          phone: userPhone,
          addressLine: userAddress,
          city: userCity,
          pincode: userPincode,
          tag: addressTag,
        },
        deliverySlot: 'Express Delivery (30-45 mins)',
      };

      await addOrder(newOrder);
      clearCart('pharmacy');
      setIsBooking(false);

      navigation.navigate('OrderSuccess', { order: newOrder });
    }, 1200);
  };

  // ==========================================
  // PLACE LAB TESTS ORDER
  // ==========================================
  const handlePlaceLabOrder = async () => {
    if (labCart.length === 0) {
      Alert.alert('Empty Cart', 'Your Lab cart is empty. Please add diagnostic tests first.');
      return;
    }

    if (!userPhone.trim() || userPhone.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid mobile number for lab report SMS.');
      return;
    }

    setIsBooking(true);

    setTimeout(async () => {
      const bookingId = `LAB-${Math.floor(10000 + Math.random() * 90000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;
      const now = new Date();
      const dateString = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

      const labBooking = {
        id: bookingId,
        tokenNumber,
        type: 'Radiology',
        tests: [...labCart],
        lab: {
          name: labCart[0]?.labName || 'Unnathi Diagnostic & Imaging Center',
          area: 'Mysore',
          address: 'No. 24, Diagnostic Complex, Kuvempunagar, Mysore',
        },
        appointmentDate: dateString,
        appointmentSlot: selectedLabSlot,
        status: 'Confirmed',
        visitType: labVisitType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Center Visit',
        patient: {
          name: userName,
          age: patientAge,
          gender: patientGender,
          phone: userPhone,
        },
        payment: {
          paidAmount: labFinalTotal,
          paymentStatus: 'Paid Online',
          method: paymentMethod,
        },
      };

      // Save to @radiologyBookings
      try {
        const stored = await AsyncStorage.getItem('@radiologyBookings');
        const existing = stored ? JSON.parse(stored) : [];
        await AsyncStorage.setItem('@radiologyBookings', JSON.stringify([labBooking, ...existing]));
      } catch (e) {
        console.log('Error saving lab booking:', e);
      }

      clearCart('lab');
      setIsBooking(false);

      Alert.alert(
        'Lab Tests Booked Successfully! 🎉',
        `Your diagnostic test order ${bookingId} has been confirmed for ${selectedLabSlot}.\n\nToken: ${tokenNumber}`,
        [
          {
            text: 'View Bookings',
            onPress: () => navigation.navigate('Bookings'),
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    }, 1200);
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

        <Text style={styles.headerTitle}>My Health Cart</Text>

        <TouchableOpacity
          style={styles.clearCartHeaderBtn}
          onPress={() => {
            Alert.alert(
              'Clear Cart?',
              `Are you sure you want to empty your ${activeTab === 'pharmacy' ? 'Pharmacy' : 'Lab Tests'} cart?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => clearCart(activeTab),
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* ==========================================
          TOP SEGMENT SWITCHER: PHARMACY VS LAB CART
      ========================================== */}
      <View style={styles.cartTabsContainer}>
        {/* PHARMACY TAB */}
        <TouchableOpacity
          style={[styles.cartTab, activeTab === 'pharmacy' && styles.cartTabActive]}
          onPress={() => setActiveTab('pharmacy')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="medkit"
            size={18}
            color={activeTab === 'pharmacy' ? colors.primary : '#64748B'}
          />
          <Text
            style={[
              styles.cartTabText,
              activeTab === 'pharmacy' && styles.cartTabTextActive,
            ]}
          >
            Pharmacy Cart
          </Text>
          {pharmacyCartCount > 0 && (
            <View
              style={[
                styles.cartTabBadge,
                activeTab === 'pharmacy' && styles.cartTabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.cartTabBadgeText,
                  activeTab === 'pharmacy' && styles.cartTabBadgeTextActive,
                ]}
              >
                {pharmacyCartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* LAB TESTS TAB */}
        <TouchableOpacity
          style={[styles.cartTab, activeTab === 'lab' && styles.cartTabActive]}
          onPress={() => setActiveTab('lab')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="flask"
            size={18}
            color={activeTab === 'lab' ? colors.primary : '#64748B'}
          />
          <Text
            style={[
              styles.cartTabText,
              activeTab === 'lab' && styles.cartTabTextActive,
            ]}
          >
            Lab Tests Cart
          </Text>
          {labCartCount > 0 && (
            <View
              style={[
                styles.cartTabBadge,
                activeTab === 'lab' && styles.cartTabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.cartTabBadgeText,
                  activeTab === 'lab' && styles.cartTabBadgeTextActive,
                ]}
              >
                {labCartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ==========================================
            TAB 1: PHARMACY CART
        ========================================== */}
        {activeTab === 'pharmacy' && (
          <>
            {pharmacyCart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="cart-outline" size={48} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Your Pharmacy Cart is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Order genuine medicines, vitamins, and healthcare essentials delivered to your doorstep.
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('Pharmacy')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="medkit" size={18} color="#FFFFFF" />
                  <Text style={styles.browseButtonText}>Browse Medicines</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* ITEMS LIST */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>
                    Medicines & Products ({pharmacyCartCount})
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Pharmacy')}>
                    <Text style={styles.addMoreLink}>+ Add More</Text>
                  </TouchableOpacity>
                </View>

                {pharmacyCart.map((item) => (
                  <View key={item.id} style={styles.cartItemCard}>
                    <Image
                      source={{
                        uri:
                          item.image ||
                          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
                      }}
                      style={styles.itemImage}
                    />

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemCategory}>{item.dosage || item.category || 'Medicine'}</Text>

                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                        {item.mrp && Number(item.mrp) > Number(item.price) && (
                          <Text style={styles.itemMrp}>₹{item.mrp}</Text>
                        )}
                      </View>
                    </View>

                    {/* QUANTITY CONTROLS */}
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => decreaseQuantity(item.id, 'pharmacy')}
                      >
                        <Ionicons name="remove" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => increaseQuantity(item.id, 'pharmacy')}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* PRESCRIPTION UPLOAD (IF REQUIRED) */}
                {prescriptionItems.length > 0 && (
                  <View style={styles.rxCard}>
                    <View style={styles.rxHeaderRow}>
                      <Ionicons name="document-text" size={20} color="#0284C7" />
                      <Text style={styles.rxTitle}>Prescription Required</Text>
                    </View>
                    <Text style={styles.rxSubtitle}>
                      {prescriptionItems.length} {prescriptionItems.length === 1 ? 'medicine requires' : 'medicines require'} a doctor prescription.
                    </Text>

                    <TouchableOpacity
                      style={styles.rxUploadBtn}
                      onPress={pickPrescription}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={uploadedRx ? 'checkmark-circle' : 'cloud-upload-outline'}
                        size={20}
                        color={uploadedRx ? '#10B981' : colors.primary}
                      />
                      <Text
                        style={[
                          styles.rxUploadBtnText,
                          uploadedRx && { color: '#059669', fontWeight: '800' },
                        ]}
                      >
                        {uploadedRx ? 'Prescription Attached ✓' : 'Upload Doctor Prescription'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* DELIVERY ADDRESS */}
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <Text style={styles.cardTitle}>Delivery Address</Text>
                    <TouchableOpacity
                      style={styles.gpsButton}
                      onPress={handleUseCurrentLocation}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Ionicons name="locate" size={14} color={colors.primary} />
                          <Text style={styles.gpsButtonText}>Use GPS</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Full Address (Flat, Street, Area)"
                    value={userAddress}
                    onChangeText={setUserAddress}
                  />

                  <View style={styles.rowInputs}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="City"
                      value={userCity}
                      onChangeText={setUserCity}
                    />
                    <TextInput
                      style={[styles.input, { width: 110 }]}
                      placeholder="Pincode"
                      value={userPincode}
                      onChangeText={setUserPincode}
                      keyboardType="numeric"
                    />
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number (for delivery SMS)"
                    value={userPhone}
                    onChangeText={setUserPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* COUPON CODE */}
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="pricetag" size={18} color={colors.primary} />
                    <Text style={styles.cardTitle}>Apply Promo Code</Text>
                  </View>

                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="Enter code (e.g. UNNATHI20)"
                      placeholderTextColor="#94A3B8"
                      value={couponInput}
                      onChangeText={setCouponInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => handleApplyCoupon()}
                    >
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>

                  {/* CHIPS */}
                  <View style={styles.couponChipsRow}>
                    {PROMO_CHIPS.map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        style={styles.couponChip}
                        onPress={() => handleApplyCoupon(chip)}
                      >
                        <Text style={styles.couponChipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {couponMsg && (
                    <Text
                      style={[
                        styles.couponMsg,
                        { color: couponMsg.success ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {couponMsg.text}
                    </Text>
                  )}
                </View>

                {/* PAYMENT METHOD */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Select Payment Method</Text>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.paymentOption,
                          isSelected && styles.paymentOptionSelected,
                        ]}
                        onPress={() => setPaymentMethod(method.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={method.icon}
                          size={22}
                          color={isSelected ? colors.primary : '#64748B'}
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text
                            style={[
                              styles.paymentTitle,
                              isSelected && { color: colors.primary, fontWeight: '800' },
                            ]}
                          >
                            {method.title}
                          </Text>
                          <Text style={styles.paymentSub}>{method.subtitle}</Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={isSelected ? colors.primary : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* BILL SUMMARY */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Pharmacy Bill Summary</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Items Total (MRP)</Text>
                    <Text style={styles.billValue}>₹{pharmacyMrpTotal}</Text>
                  </View>
                  {pharmacySavings > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: '#059669' }]}>Product Discount</Text>
                      <Text style={[styles.billValue, { color: '#059669' }]}>- ₹{pharmacySavings}</Text>
                    </View>
                  )}
                  {pharmacyDiscountAmount > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: '#059669' }]}>Coupon Discount</Text>
                      <Text style={[styles.billValue, { color: '#059669' }]}>- ₹{pharmacyDiscountAmount}</Text>
                    </View>
                  )}
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Express Delivery Fee</Text>
                    <Text style={styles.billValue}>
                      {pharmacyDeliveryFee === 0 ? 'FREE' : `₹${pharmacyDeliveryFee}`}
                    </Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Packaging & Handling</Text>
                    <Text style={styles.billValue}>₹{pharmacyPackagingFee}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.billRowTotal}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{pharmacyFinalTotal}</Text>
                  </View>
                </View>

                {/* PLACE ORDER BUTTON */}
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={handlePlacePharmacyOrder}
                  disabled={isBooking}
                  activeOpacity={0.88}
                >
                  {isBooking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.checkoutButtonText}>
                        Place Pharmacy Order • ₹{pharmacyFinalTotal}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ==========================================
            TAB 2: LAB & DIAGNOSTIC TESTS CART
        ========================================== */}
        {activeTab === 'lab' && (
          <>
            {labCart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="flask-outline" size={48} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Your Lab Tests Cart is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Book certified blood tests, health packages, and radiology scans with 100% accurate reports.
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('RadiologyLabs')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="flask" size={18} color="#FFFFFF" />
                  <Text style={styles.browseButtonText}>Browse Lab Tests & Scans</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* LAB ITEMS LIST */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>
                    Selected Tests & Scans ({labCartCount})
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('RadiologyLabs')}>
                    <Text style={styles.addMoreLink}>+ Add Tests</Text>
                  </TouchableOpacity>
                </View>

                {labCart.map((item) => (
                  <View key={item.id} style={styles.cartItemCard}>
                    <View style={styles.labIconBox}>
                      <Ionicons name="flask" size={24} color={colors.primary} />
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemCategory}>
                        {item.categoryLabel || item.category || 'Diagnostic Scan'} • {item.labName || 'Diagnostic Lab'}
                      </Text>

                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                        {item.mrp && Number(item.mrp) > Number(item.price) && (
                          <Text style={styles.itemMrp}>₹{item.mrp}</Text>
                        )}
                      </View>
                    </View>

                    {/* REMOVE TEST BUTTON */}
                    <TouchableOpacity
                      style={styles.removeTestBtn}
                      onPress={() => removeFromCart(item.id, 'lab')}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* VISIT CHOICE: HOSPITAL VISIT (MANDATORY FOR RADIOLOGY) VS HOME SAMPLE */}
                {hasRadiologyScans ? (
                  <View style={styles.hospitalNoticeCard}>
                    <View style={styles.hospitalNoticeHeader}>
                      <View style={styles.hospitalNoticeIconCircle}>
                        <Ionicons name="business" size={22} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.hospitalNoticeTitle}>
                          Hospital / Center Visit Mandatory
                        </Text>
                        <Text style={styles.hospitalNoticeSubtitle}>
                          Radiology & imaging scans (MRI, CT, X-Ray, Ultrasound) require heavy hospital machinery and must be conducted on-site at the diagnostic hospital.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.hospitalCenterBadge}>
                      <Ionicons name="location" size={16} color="#0284C7" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.hospitalCenterName}>
                          {labCart[0]?.labName || 'Unnathi Diagnostic & Imaging Center'}
                        </Text>
                        <Text style={styles.hospitalCenterArea}>
                          {labCart[0]?.labArea || 'Kuvempunagar, Mysore'} • On-site Appointment
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sample Collection Preference</Text>
                    <View style={styles.visitTypeRow}>
                      <TouchableOpacity
                        style={[
                          styles.visitTypeCard,
                          labVisitType === 'HOME_COLLECTION' && styles.visitTypeCardActive,
                        ]}
                        onPress={() => setLabVisitType('HOME_COLLECTION')}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="home"
                          size={20}
                          color={labVisitType === 'HOME_COLLECTION' ? '#FFFFFF' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.visitTypeTitle,
                            labVisitType === 'HOME_COLLECTION' && styles.visitTypeTitleActive,
                          ]}
                        >
                          Home Collection
                        </Text>
                        <Text
                          style={[
                            styles.visitTypeSubtitle,
                            labVisitType === 'HOME_COLLECTION' && styles.visitTypeSubtitleActive,
                          ]}
                        >
                          Phlebotomist at doorstep (FREE)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.visitTypeCard,
                          labVisitType === 'LAB_VISIT' && styles.visitTypeCardActive,
                        ]}
                        onPress={() => setLabVisitType('LAB_VISIT')}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="business"
                          size={20}
                          color={labVisitType === 'LAB_VISIT' ? '#FFFFFF' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.visitTypeTitle,
                            labVisitType === 'LAB_VISIT' && styles.visitTypeTitleActive,
                          ]}
                        >
                          Visit Diagnostic Lab
                        </Text>
                        <Text
                          style={[
                            styles.visitTypeSubtitle,
                            labVisitType === 'LAB_VISIT' && styles.visitTypeSubtitleActive,
                          ]}
                        >
                          Direct fast-track visit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* SAMPLE DATE & SLOT */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Select Preferred Date & Slot</Text>
                  <View style={styles.slotGrid}>
                    {LAB_SAMPLE_SLOTS.map((slot, index) => {
                      const isSelected = selectedLabSlot === slot;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.labSlotOption,
                            isSelected && styles.labSlotOptionActive,
                          ]}
                          onPress={() => setSelectedLabSlot(slot)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={isSelected ? colors.primary : '#64748B'}
                          />
                          <Text
                            style={[
                              styles.labSlotText,
                              isSelected && styles.labSlotTextActive,
                            ]}
                          >
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* PATIENT INFO */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Patient Details for Lab Report</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Patient Full Name"
                    value={userName}
                    onChangeText={setUserName}
                  />

                  <View style={styles.rowInputs}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Age (Yrs)"
                      value={patientAge}
                      onChangeText={setPatientAge}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Gender (Male/Female)"
                      value={patientGender}
                      onChangeText={setPatientGender}
                    />
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number (for WhatsApp/SMS Report)"
                    value={userPhone}
                    onChangeText={setUserPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* LAB BILL SUMMARY */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Lab Tests Bill Summary</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Tests Total (MRP)</Text>
                    <Text style={styles.billValue}>₹{labMrpTotal}</Text>
                  </View>
                  {labSavings > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: '#059669' }]}>Lab Package Discount</Text>
                      <Text style={[styles.billValue, { color: '#059669' }]}>- ₹{labSavings}</Text>
                    </View>
                  )}
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Sample Collection Fee</Text>
                    <Text style={[styles.billValue, { color: '#059669', fontWeight: '800' }]}>
                      FREE
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.billRowTotal}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{labFinalTotal}</Text>
                  </View>
                </View>

                {/* BOOK LAB TESTS BUTTON */}
                <TouchableOpacity
                  style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
                  onPress={handlePlaceLabOrder}
                  disabled={isBooking}
                  activeOpacity={0.88}
                >
                  {isBooking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.checkoutButtonText}>
                        Book Lab Tests & Scans • ₹{labFinalTotal}
                      </Text>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  clearCartHeaderBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==========================================
  // CART TABS
  // ==========================================
  cartTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  cartTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  cartTabActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  cartTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  cartTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  cartTabBadge: {
    backgroundColor: '#94A3B8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cartTabBadgeActive: {
    backgroundColor: colors.primary,
  },
  cartTabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cartTabBadgeTextActive: {
    color: '#FFFFFF',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  addMoreLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // ITEM CARDS
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemImage: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  labIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  itemMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    minWidth: 16,
    textAlign: 'center',
  },
  removeTestBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CARD CONTAINERS
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  gpsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },

  // RX CARD
  rxCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  rxSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginVertical: 6,
  },
  rxUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 4,
  },
  rxUploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // COUPONS
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  couponChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  couponChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  couponChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  couponMsg: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  // PAYMENT
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  paymentOptionSelected: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // LAB VISIT CHOICES
  visitTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visitTypeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    textAlign: 'center',
  },
  visitTypeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  visitTypeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
    textAlign: 'center',
  },
  visitTypeTitleActive: {
    color: '#FFFFFF',
  },
  visitTypeSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  visitTypeSubtitleActive: {
    color: '#E0F2FE',
  },

  // HOSPITAL NOTICE FOR RADIOLOGY
  hospitalNoticeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    marginBottom: 12,
  },
  hospitalNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  hospitalNoticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  hospitalNoticeSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 16,
  },
  hospitalCenterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  hospitalCenterName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  hospitalCenterArea: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },

  slotGrid: {
    gap: 6,
  },
  labSlotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  labSlotOptionActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  labSlotText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  labSlotTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // BILL ROWS
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },

  // CHECKOUT BTN
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // EMPTY BOX
  emptyCartBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default CartScreen;