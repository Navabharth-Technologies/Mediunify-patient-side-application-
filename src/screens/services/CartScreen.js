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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';

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

const CartScreen = ({ navigation }) => {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    mrpTotal,
    productSavings,
    discountAmount,
    deliveryFee,
    packagingFee,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    selectedAddress,
    updateAddress,
    addOrder,
  } = useCart();

  // User & Delivery Details state
  const [userName, setUserName] = useState(selectedAddress.name || 'Ramesh Kumar');
  const [userPhone, setUserPhone] = useState(selectedAddress.phone || '9876543210');
  const [userAddress, setUserAddress] = useState(
    selectedAddress.addressLine || 'Flat 402, Green Valley Apartments, Kuvempunagar'
  );
  const [userCity, setUserCity] = useState(selectedAddress.city || 'Mysore');
  const [userPincode, setUserPincode] = useState(selectedAddress.pincode || '570023');
  const [addressTag, setAddressTag] = useState(selectedAddress.tag || 'Home');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Sync with CartContext address changes (e.g. after Map selection)
  useEffect(() => {
    if (selectedAddress.addressLine) {
      setUserAddress(selectedAddress.addressLine);
      if (selectedAddress.city) setUserCity(selectedAddress.city);
      if (selectedAddress.pincode) setUserPincode(selectedAddress.pincode);
    }
  }, [selectedAddress]);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);

  // Prescription state
  const [uploadedRx, setUploadedRx] = useState(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isBooking, setIsBooking] = useState(false);

  // Check if prescription required
  const prescriptionItems = cart.filter(
    (item) => item.requiresPrescription || item.category === 'Medicines'
  );
  const isPrescriptionRequired = prescriptionItems.length > 0;

  // Auto-fill GPS address
  const handleGpsAutofill = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow location permission to auto-fill your delivery address.');
        setGpsLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const item = addresses[0];
        const newAddr = `${item.name || item.street || 'Current Location'}, ${item.subregion || item.district || ''}`;
        const newCity = item.city || item.subregion || 'Mysore';
        const newPincode = item.postalCode || '570001';

        setUserAddress(newAddr);
        setUserCity(newCity);
        setUserPincode(newPincode);

        updateAddress({
          name: userName,
          phone: userPhone,
          addressLine: newAddr,
          city: newCity,
          state: item.region || 'Karnataka',
          pincode: newPincode,
          tag: addressTag,
        });

        Alert.alert('GPS Location Detected! 📍', `Address set to: ${newAddr}, ${newCity}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to auto-detect location. Please use the map or type manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Open Interactive Map Location Picker
  const handleOpenMapPicker = () => {
    navigation.navigate('PharmacyLocation', {
      onLocationSelected: (newAddrObj) => {
        if (newAddrObj) {
          setUserAddress(newAddrObj.addressLine);
          setUserCity(newAddrObj.city);
          setUserPincode(newAddrObj.pincode);
        }
      },
    });
  };

  // Prescription Upload: Gallery
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow gallery access to select your prescription.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setUploadedRx({
          uri: result.assets[0].uri,
          name: 'Doctor_Prescription_Photo.jpg',
        });
      }
    } catch (e) {
      setUploadedRx({
        uri: null,
        name: 'Prescription_Dr_Anita_Sharma.pdf',
      });
    }
  };

  // Prescription Upload: Camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setUploadedRx({
          uri: result.assets[0].uri,
          name: 'Camera_Prescription_Snap.jpg',
        });
      }
    } catch (e) {
      setUploadedRx({
        uri: null,
        name: 'Camera_Prescription_Snap.jpg',
      });
    }
  };

  // Coupon handling
  const handleApplyCoupon = (codeToApply) => {
    const code = codeToApply || couponInput;
    if (!code) {
      Alert.alert('Enter Code', 'Please enter a coupon code.');
      return;
    }
    const result = applyCoupon(code);
    setCouponMsg(result);
    if (result.success) {
      setCouponInput('');
    }
  };

  const handleRemoveItem = (item) => {
    Alert.alert('Remove Item', `Remove "${item.name}" from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeFromCart(item.id),
      },
    ]);
  };

  // Main Book & Place Order Action
  const handleBookAndPay = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add medicines to your cart first.');
      return;
    }

    // Validation
    if (!userName.trim()) {
      Alert.alert('Missing Details', 'Please enter your Full Name.');
      return;
    }
    if (!userPhone.trim() || userPhone.trim().length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!userAddress.trim()) {
      Alert.alert('Missing Address', 'Please select location from GPS/Map or type address.');
      return;
    }
    if (!userPincode.trim() || userPincode.trim().length < 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit postal pincode.');
      return;
    }

    // Prescription validation
    if (isPrescriptionRequired && !uploadedRx) {
      Alert.alert(
        'Doctor Prescription Required 📄',
        'Your cart contains tablets / regulated medicines. Please upload a doctor prescription using Camera or Gallery before booking.',
        [
          { text: 'Upload from Gallery', onPress: handlePickFromGallery },
          { text: 'Take Camera Photo', onPress: handleTakePhoto },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setIsBooking(true);

    const fullAddressObj = {
      name: userName.trim(),
      phone: userPhone.trim(),
      addressLine: userAddress.trim(),
      city: userCity.trim(),
      state: 'Karnataka',
      pincode: userPincode.trim(),
      tag: addressTag,
    };

    updateAddress(fullAddressObj);

    const orderId = `UNC${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder = {
      id: orderId,
      date: new Date().toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Confirmed',
      paymentMethod:
        paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : `${paymentMethod} (Paid Online)`,
      paymentStatus: paymentMethod === 'COD' ? 'Pay on Delivery' : 'Paid Online',
      total: finalTotal,
      subtotal,
      deliveryFee,
      discountAmount,
      appliedCoupon: appliedCoupon?.code || null,
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        brand: i.brand,
        price: i.price,
        quantity: i.quantity,
        category: i.category,
      })),
      address: fullAddressObj,
      prescriptionAttached: uploadedRx ? uploadedRx.name : null,
      deliverySlot: 'Express Delivery (30 - 45 mins)',
    };

    setIsBooking(false);

    if (paymentMethod === 'COD') {
      // Complete COD directly
      setIsBooking(true);
      setTimeout(async () => {
        await addOrder(newOrder);
        clearCart();
        setIsBooking(false);
        navigation.replace('OrderSuccess', {
          order: newOrder,
        });
      }, 1000);
    } else {
      // Navigate to dedicated Interactive Payment Page
      navigation.navigate('Payment', {
        amount: finalTotal,
        orderData: newOrder,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>My Cart & Booking</Text>
          <Text style={styles.headerSubtitle}>
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in basket
          </Text>
        </View>

        {cart.length > 0 ? (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={60} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Add medicines or healthcare products to book delivery to your doorstep.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Pharmacy')}
          >
            <Ionicons name="medkit-outline" size={18} color={colors.white} />
            <Text style={styles.browseBtnText}>Browse Pharmacy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. ORDERED ITEMS LIST */}
            <Text style={styles.sectionHeading}>1. Items in Cart ({cart.length})</Text>

            {/* RADIOLOGY SCANS NOTICE IF PRESENT */}
            {cart.some((i) => i.category === 'Radiology') && (
              <View
                style={{
                  backgroundColor: colors.lightTeal,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Ionicons name="scan" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.secondary }}>
                    Radiology Scans in Cart
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>
                    You can schedule an appointment slot and pay your scan bill directly.
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                  onPress={() => {
                    const radItems = cart.filter((i) => i.category === 'Radiology');
                    if (radItems.length > 0) {
                      const firstRad = radItems[0];
                      navigation.navigate('RadiologyBooking', {
                        lab: {
                          id: firstRad.labId,
                          name: firstRad.labName,
                          area: firstRad.labArea,
                          address: firstRad.labAddress,
                          phone: firstRad.labPhone,
                        },
                        selectedTests: radItems,
                      });
                    }
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                    Schedule
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {cart.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemIconCircle}>
                  <Ionicons
                    name={
                      item.category === 'Radiology'
                        ? 'scan'
                        : item.category === 'Medicines'
                        ? 'medkit'
                        : item.category === 'Vitamins & Minerals'
                        ? 'fitness'
                        : 'medical'
                    }
                    size={26}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item)}
                      style={styles.trashBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#E53935" />
                    </TouchableOpacity>
                  </View>

                  {item.category === 'Radiology' ? (
                    <View style={{ marginTop: 2, marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.secondary }}>
                        🏥 {item.labName || 'Diagnostic Lab'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: colors.secondary }}>
                            {item.modalityCode || 'Scan'}
                          </Text>
                        </View>
                        {item.fastingRequired && (
                          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#D97706' }}>
                              Fasting Required
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemBrand}>{item.brand}</Text>
                  )}

                  <View style={styles.itemPriceAndQtyRow}>
                    <Text style={styles.itemPrice}>
                      ₹{item.price * item.quantity}
                    </Text>

                    {item.category === 'Radiology' ? (
                      <TouchableOpacity
                        style={{
                          backgroundColor: colors.secondary,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onPress={() => {
                          navigation.navigate('RadiologyBooking', {
                            lab: {
                              id: item.labId,
                              name: item.labName,
                              area: item.labArea,
                              address: item.labAddress,
                              phone: item.labPhone,
                            },
                            test: item,
                            selectedTests: [item],
                          });
                        }}
                      >
                        <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                          Book Slot
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => decreaseQuantity(item.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyNumber}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => increaseQuantity(item.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={14} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {/* 2. USER DETAILS & LOCATION PICKER (GPS + MAP) */}
            <Text style={styles.sectionHeading}>2. Delivery Location & Customer Details</Text>
            <View style={styles.formCard}>
              {/* DUAL LOCATION ACTIONS: GPS + MAP */}
              <View style={styles.locationActionsRow}>
                {/* AUTO-DETECT GPS */}
                <TouchableOpacity
                  style={styles.gpsActionBtn}
                  activeOpacity={0.8}
                  onPress={handleGpsAutofill}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="navigate" size={18} color={colors.primary} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationActionTitle}>Auto-Detect GPS</Text>
                    <Text style={styles.locationActionSub}>Use current live spot</Text>
                  </View>
                </TouchableOpacity>

                {/* SELECT THROUGH MAP */}
                <TouchableOpacity
                  style={styles.mapActionBtn}
                  activeOpacity={0.8}
                  onPress={handleOpenMapPicker}
                >
                  <Ionicons name="map" size={18} color={colors.white} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapActionTitle}>Select on Map</Text>
                    <Text style={styles.mapActionSub}>Pinpoint & drag pin</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter recipient name"
                  placeholderTextColor={colors.slate}
                  value={userName}
                  onChangeText={setUserName}
                />
              </View>

              <Text style={styles.fieldLabel}>Mobile Phone Number *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.slate}
                  value={userPhone}
                  onChangeText={setUserPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.fieldLabel}>House / Flat No., Street, Area *</Text>
              <View style={[styles.inputContainer, { height: 58 }]}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <TextInput
                  style={[styles.textInput, { height: 52 }]}
                  placeholder="Flat 402, Green Valley Apartments, Kuvempunagar"
                  placeholderTextColor={colors.slate}
                  value={userAddress}
                  onChangeText={setUserAddress}
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Mysore"
                      placeholderTextColor={colors.slate}
                      value={userCity}
                      onChangeText={setUserCity}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Pincode *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="570023"
                      placeholderTextColor={colors.slate}
                      value={userPincode}
                      onChangeText={setUserPincode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Address Tag</Text>
              <View style={styles.tagGroup}>
                {['Home', 'Work', 'Other'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagPill, addressTag === t && styles.tagPillActive]}
                    onPress={() => setAddressTag(t)}
                  >
                    <Text style={[styles.tagText, addressTag === t && styles.tagTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. PRESCRIPTION UPLOAD SECTION (MANDATORY FOR TABLETS) */}
            <Text style={styles.sectionHeading}>
              3. Doctor Prescription {isPrescriptionRequired ? '(Required for Tablets)' : '(Optional)'}
            </Text>
            <View style={[styles.formCard, isPrescriptionRequired && styles.rxHighlightCard]}>
              {isPrescriptionRequired && (
                <View style={styles.rxAlertBanner}>
                  <Ionicons name="alert-circle" size={18} color={colors.coral} />
                  <Text style={styles.rxAlertText}>
                    Your cart contains tablets / medicines ({prescriptionItems.map((p) => p.name).join(', ')}). Please attach a valid prescription.
                  </Text>
                </View>
              )}

              {uploadedRx ? (
                <View style={styles.uploadedRxBox}>
                  <View style={styles.uploadedRxLeft}>
                    {uploadedRx.uri ? (
                      <Image source={{ uri: uploadedRx.uri }} style={styles.rxThumb} />
                    ) : (
                      <Ionicons name="document-text" size={24} color={colors.primary} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rxFileName} numberOfLines={1}>
                        {uploadedRx.name}
                      </Text>
                      <View style={styles.rxVerifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#00B894" />
                        <Text style={styles.rxVerifiedText}>Prescription Attached</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setUploadedRx(null)}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.rxUploadBtnsRow}>
                  <TouchableOpacity
                    style={styles.uploadRxBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.uploadRxBtnText}>Take Camera Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadRxBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <Text style={styles.uploadRxBtnText}>Upload from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 4. PROMO COUPON CODE */}
            <View style={styles.couponCard}>
              <View style={styles.couponTitleRow}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                <Text style={styles.couponTitle}>Apply Promo Code</Text>
              </View>

              {appliedCoupon ? (
                <View style={styles.appliedRow}>
                  <Text style={styles.appliedCode}>{appliedCoupon.code} Applied (Saved ₹{discountAmount})</Text>
                  <TouchableOpacity onPress={removeCoupon}>
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={styles.couponTextInput}
                      placeholder="Enter promo code (e.g. UNNATHI20)"
                      placeholderTextColor={colors.slate}
                      value={couponInput}
                      onChangeText={setCouponInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyCouponBtn}
                      onPress={() => handleApplyCoupon()}
                    >
                      <Text style={styles.applyCouponText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipsRow}>
                    {PROMO_CHIPS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.chip}
                        onPress={() => handleApplyCoupon(c)}
                      >
                        <Text style={styles.chipText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {couponMsg && (
                <Text style={[styles.couponMsg, couponMsg.success ? styles.couponSuccess : styles.couponError]}>
                  {couponMsg.message}
                </Text>
              )}
            </View>

            {/* 5. PAYMENT METHOD SELECTION */}
            <Text style={styles.sectionHeading}>4. Select Payment Method</Text>
            <View style={styles.formCard}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <TouchableOpacity
                    key={pm.id}
                    style={[styles.paymentOption, isSelected && styles.paymentOptionSelected]}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod(pm.id)}
                  >
                    <Ionicons
                      name={pm.icon}
                      size={22}
                      color={isSelected ? colors.primary : colors.secondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentOptionTitle}>{pm.title}</Text>
                      <Text style={styles.paymentOptionSub}>{pm.subtitle}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? colors.primary : colors.slate}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 6. BILL SUMMARY */}
            <View style={styles.billCard}>
              <Text style={styles.billCardTitle}>Bill Summary</Text>

              <View style={styles.billLine}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{subtotal}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.billLine}>
                  <Text style={styles.billLabel}>Coupon Discount</Text>
                  <Text style={styles.billDiscount}>-₹{discountAmount}</Text>
                </View>
              )}

              <View style={styles.billLine}>
                <Text style={styles.billLabel}>Delivery Charges</Text>
                <Text style={deliveryFee === 0 ? styles.freeText : styles.billValue}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </Text>
              </View>

              <View style={styles.billLine}>
                <Text style={styles.billLabel}>Packaging & Safety</Text>
                <Text style={styles.billValue}>₹{packagingFee}</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billTotalRow}>
                <Text style={styles.billTotalLabel}>Grand Total</Text>
                <Text style={styles.billTotalValue}>₹{finalTotal}</Text>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* BOTTOM FIXED ACTION BAR */}
          <View style={styles.bottomBar}>
            <View style={styles.bottomPriceGroup}>
              <Text style={styles.bottomPriceLabel}>Total Payable</Text>
              <Text style={styles.bottomPriceValue}>₹{finalTotal}</Text>
            </View>

            <TouchableOpacity
              style={styles.bookBtn}
              activeOpacity={0.85}
              onPress={handleBookAndPay}
              disabled={isBooking}
            >
              {isBooking ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.bookBtnText}>
                    {paymentMethod === 'COD' ? 'Confirm Booking (COD)' : `Pay ₹${finalTotal} & Book`}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.slate,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 8,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.secondary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.slate,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  browseBtn: {
    marginTop: 22,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  itemIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    flex: 1,
    marginRight: 6,
  },
  trashBtn: {
    padding: 2,
  },
  itemBrand: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 1,
  },
  itemPriceAndQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F8F5',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.secondary,
    minWidth: 16,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  gpsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7F4',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C0EFE5',
  },
  locationActionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
  },
  locationActionSub: {
    fontSize: 9,
    color: colors.slate,
    marginTop: 1,
  },
  mapActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  mapActionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
  },
  mapActionSub: {
    fontSize: 9,
    color: '#D1F4EB',
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate,
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F4F6',
  },
  tagPillActive: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  tagTextActive: {
    color: colors.white,
  },
  rxHighlightCard: {
    borderColor: '#FFD3C4',
    backgroundColor: '#FFFBF9',
  },
  rxAlertBanner: {
    backgroundColor: '#FFF2EC',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD3C4',
  },
  rxAlertText: {
    fontSize: 11,
    color: '#8A3B18',
    flex: 1,
    lineHeight: 15,
    fontWeight: '600',
  },
  uploadedRxBox: {
    backgroundColor: '#F0FAF8',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BEECE1',
  },
  uploadedRxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rxThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  rxFileName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  rxVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rxVerifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A382',
  },
  rxUploadBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadRxBtn: {
    flex: 1,
    backgroundColor: '#F0FAF8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#BEECE1',
    borderStyle: 'dashed',
  },
  uploadRxBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  couponCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.secondary,
    fontWeight: '700',
  },
  applyCouponBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#E6F8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  appliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F8F2',
    padding: 8,
    borderRadius: 8,
  },
  appliedCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00A382',
  },
  removeCouponText: {
    color: '#E53935',
    fontSize: 11,
    fontWeight: '800',
  },
  couponMsg: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  couponSuccess: {
    color: '#00A382',
  },
  couponError: {
    color: '#E53935',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 10,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF8',
  },
  paymentOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  paymentOptionSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 1,
  },
  billCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  billCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 10,
  },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: colors.slate,
  },
  billValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  billDiscount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B894',
  },
  freeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00B894',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 8,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
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
  bottomPriceGroup: {
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
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});

export default CartScreen;