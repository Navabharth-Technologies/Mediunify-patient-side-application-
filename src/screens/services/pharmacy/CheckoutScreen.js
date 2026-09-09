import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../../utils/locationHelper';

import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';

const DELIVERY_SLOTS = [
  {
    id: 'express',
    title: '⚡ Express Delivery',
    time: '30 - 45 mins',
    desc: 'Instant delivery from nearest MediUnify partner pharmacy',
    fee: 'FREE',
  },
  {
    id: 'evening',
    title: '🕒 Today Evening Slot',
    time: '06:00 PM - 08:00 PM',
    desc: 'Scheduled evening home delivery',
    fee: 'FREE',
  },
  {
    id: 'tomorrow',
    title: '☀️ Tomorrow Morning Slot',
    time: '08:00 AM - 10:00 AM',
    desc: 'Scheduled early morning delivery',
    fee: 'FREE',
  },
];

const PAYMENT_CATEGORIES = [
  {
    id: 'COD',
    name: 'Cash on Delivery (COD)',
    desc: 'Pay via Cash or UPI QR upon delivery at your doorstep',
    icon: 'cash-outline',
    subOptions: ['Cash on Delivery (Pay upon arrival)'],
  },
  {
    id: 'UPI',
    name: 'UPI (Instant Online Pay)',
    desc: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: 'phone-portrait-outline',
    subOptions: ['Google Pay', 'PhonePe', 'Paytm UPI', 'Enter UPI ID'],
  },
  {
    id: 'CARD',
    name: 'Credit / Debit Card',
    desc: 'Visa, MasterCard, RuPay, Maestro',
    icon: 'card-outline',
    subOptions: ['HDFC Bank Card •••• 4219', 'ICICI Coral Card •••• 8831', 'Add New Card'],
  },
  {
    id: 'NETBANKING',
    name: 'Net Banking',
    desc: 'All major Indian banks supported',
    icon: 'business-outline',
    subOptions: ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'],
  },
];

const SAMPLE_PRESCRIPTIONS = [
  {
    id: 'rx-1',
    doctor: 'Dr. Anita Sharma (MBBS, MD)',
    hospital: 'MediUnify Multi-Speciality Clinic',
    date: '28 Aug 2026',
    meds: 'Amoxicillin 625mg, Paracetamol 500mg',
  },
  {
    id: 'rx-2',
    doctor: 'Dr. Rajesh Verma (Consultant Physician)',
    hospital: 'City Health Center',
    date: '15 Aug 2026',
    meds: 'Multivitamin, Pain Relief Gel, Vitamin C',
  },
];

const CheckoutScreen = ({ navigation }) => {
  const {
    cart,
    subtotal,
    deliveryFee,
    packagingFee,
    discountAmount,
    finalTotal,
    appliedCoupon,
    selectedAddress,
    updateAddress,
    addOrder,
    clearCart,
  } = useCart();

  // Basic Details States
  const [name, setName] = useState(selectedAddress.name || 'Ramesh Kumar');
  const [phone, setPhone] = useState(selectedAddress.phone || '9876543210');
  const [addressLine, setAddressLine] = useState(
    selectedAddress.addressLine || 'Flat 402, Green Valley Apartments, Kuvempunagar'
  );
  const [city, setCity] = useState(selectedAddress.city || 'Mysore');
  const [state, setState] = useState(selectedAddress.state || 'Karnataka');
  const [pincode, setPincode] = useState(selectedAddress.pincode || '570023');
  const [tag, setTag] = useState(selectedAddress.tag || 'Home');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Prescription States
  const [uploadedPrescription, setUploadedPrescription] = useState(null);
  const [showSampleRxModal, setShowSampleRxModal] = useState(false);

  // Delivery & Payment States
  const [selectedSlot, setSelectedSlot] = useState('express');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedSubOption, setSelectedSubOption] = useState('Cash on Delivery (Pay upon arrival)');
  const [customUpi, setCustomUpi] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Check if any item in cart requires a prescription or is a medicine tablet
  const prescriptionItems = cart.filter(
    (item) => item.requiresPrescription || item.category === 'Medicines'
  );
  const isPrescriptionRequired = prescriptionItems.length > 0;

  // Auto-fill GPS address
  const handleGpsAutofill = async () => {
    try {
      setGpsLoading(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        showAlert('Permission Needed', 'Please allow location permission to auto-fill address.');
        setGpsLoading(false);
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
        const newAddrLine = `${item.name || item.street || 'Current Spot'}, ${item.subregion || ''}`;
        const newCity = item.city || item.subregion || 'Mysore';
        const newState = item.region || 'Karnataka';
        const newPincode = item.postalCode || '570001';

        setAddressLine(newAddrLine);
        setCity(newCity);
        setState(newState);
        setPincode(newPincode);

        updateAddress({
          name,
          phone,
          addressLine: newAddrLine,
          city: newCity,
          state: newState,
          pincode: newPincode,
          tag,
        });

        showAlert('Address Detected! 📍', 'Your delivery address has been filled from GPS.');
      }
    } catch (e) {
      showAlert('Error', 'Unable to auto-detect location. Please type manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Prescription Upload: Gallery
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Please allow gallery access to select your prescription.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setUploadedPrescription({
          uri: result.assets[0].uri,
          name: 'Doctor_Prescription_Photo.jpg',
          type: 'Gallery Upload',
          date: 'Just now',
          verified: true,
        });
      }
    } catch (e) {
      // Fallback simulated upload
      setUploadedPrescription({
        uri: null,
        name: 'Prescription_Document_Dr_Sharma.pdf',
        type: 'Medical Document',
        date: 'Just now',
        verified: true,
      });
    }
  };

  // Prescription Upload: Camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Please allow camera access to take a photo of your prescription.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setUploadedPrescription({
          uri: result.assets[0].uri,
          name: 'Camera_Prescription_Snap.jpg',
          type: 'Camera Photo',
          date: 'Just now',
          verified: true,
        });
      }
    } catch (e) {
      setUploadedPrescription({
        uri: null,
        name: 'Camera_Prescription_Snap.jpg',
        type: 'Camera Photo',
        date: 'Just now',
        verified: true,
      });
    }
  };

  // Select Sample E-Prescription
  const handleSelectSampleRx = (rx) => {
    setUploadedPrescription({
      uri: null,
      name: `${rx.doctor} - E-Prescription`,
      type: 'Verified Hospital Record',
      date: rx.date,
      verified: true,
      doctor: rx.doctor,
      hospital: rx.hospital,
    });
    setShowSampleRxModal(false);
  };

  // Place Order Handler with full validation
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showAlert('Empty Cart', 'Your cart has no items to checkout.');
      return;
    }

    // 1. Basic Details Validation
    if (!name.trim()) {
      showAlert('Missing Details', 'Please enter recipient name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      showAlert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!addressLine.trim()) {
      showAlert('Missing Address', 'Please enter flat/house number and street address.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 6) {
      showAlert('Invalid Pincode', 'Please enter a valid 6-digit postal pincode.');
      return;
    }

    // 2. Prescription Validation (Required if tablets/prescription items are in cart)
    if (isPrescriptionRequired && !uploadedPrescription) {
      showAlert(
        'Prescription Required 📄',
        'Your cart contains prescription medicines/tablets. Please upload a doctor prescription or choose an e-prescription before payment.',
        [
          { text: 'Upload from Gallery', onPress: handlePickFromGallery },
          { text: 'Take Camera Photo', onPress: handleTakePhoto },
          { text: 'Choose E-Prescription', onPress: () => setShowSampleRxModal(true) },
        ]
      );
      return;
    }

    // Update global address in background
    const finalAddressObj = {
      name: name.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      tag,
    };
    updateAddress(finalAddressObj);

    setIsPlacingOrder(true);

    const orderId = `UNC${Math.floor(10000 + Math.random() * 90000)}`;
    const slotObj = DELIVERY_SLOTS.find((s) => s.id === selectedSlot);

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
        paymentMethod === 'COD'
          ? 'Cash on Delivery (COD)'
          : `${paymentMethod} (${selectedSubOption})`,
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
      address: finalAddressObj,
      prescriptionAttached: uploadedPrescription ? uploadedPrescription.name : null,
      deliverySlot: `${slotObj?.title} (${slotObj?.time})`,
    };

    if (paymentMethod === 'COD') {
      // Simulate COD confirmation
      setTimeout(async () => {
        await addOrder(newOrder);
        clearCart();
        setIsPlacingOrder(false);

        navigation.replace('OrderSuccess', {
          order: newOrder,
        });
      }, 1000);
    } else {
      setIsPlacingOrder(false);
      navigation.navigate('Payment', {
        amount: finalTotal,
        orderData: newOrder,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Booking & Checkout</Text>
          <Text style={styles.headerSubtitle}>Details • Prescription • Payment</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            STEP 1: PATIENT & DELIVERY BASIC DETAILS
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 1</Text>
            </View>
            <Text style={styles.cardTitle}>Patient & Delivery Details</Text>
          </View>

          {/* GPS QUICK DETECT */}
          <TouchableOpacity
            style={styles.gpsDetectBtn}
            onPress={handleGpsAutofill}
            disabled={gpsLoading}
            activeOpacity={0.8}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="navigate" size={16} color={colors.primary} />
            )}
            <Text style={styles.gpsDetectText}>
              {gpsLoading ? 'Detecting GPS...' : 'Auto-fill Address from Current Location'}
            </Text>
          </TouchableOpacity>

          {/* FULL NAME */}
          <Text style={styles.inputLabel}>Full Name *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={colors.slate}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* MOBILE PHONE */}
          <Text style={styles.inputLabel}>Phone / Mobile Number *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <TextInput
              style={styles.inputField}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.slate}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* ADDRESS LINE */}
          <Text style={styles.inputLabel}>House / Flat No. & Street / Area *</Text>
          <View style={[styles.inputWrap, { height: 64 }]}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <TextInput
              style={[styles.inputField, { height: 56 }]}
              placeholder="Flat 402, Green Valley Apartments, 5th Cross, Kuvempunagar"
              placeholderTextColor={colors.slate}
              value={addressLine}
              onChangeText={setAddressLine}
              multiline
            />
          </View>

          {/* CITY & PINCODE */}
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>City *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputField}
                  placeholder="Mysore"
                  placeholderTextColor={colors.slate}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Pincode *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputField}
                  placeholder="570023"
                  placeholderTextColor={colors.slate}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>
          </View>

          {/* ADDRESS TAG */}
          <Text style={styles.inputLabel}>Address Type</Text>
          <View style={styles.tagGroup}>
            {['Home', 'Work', 'Other'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tagPill, tag === t && styles.tagPillActive]}
                onPress={() => setTag(t)}
              >
                <Ionicons
                  name={
                    t === 'Home'
                      ? 'home-outline'
                      : t === 'Work'
                      ? 'briefcase-outline'
                      : 'location-outline'
                  }
                  size={14}
                  color={tag === t ? colors.white : colors.secondary}
                />
                <Text style={[styles.tagText, tag === t && styles.tagTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ==================================================
            STEP 2: PRESCRIPTION UPLOAD (MANDATORY FOR TABLETS)
        ================================================== */}
        <View
          style={[
            styles.sectionCard,
            isPrescriptionRequired && styles.rxRequiredCardBorder,
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.stepBadge,
                isPrescriptionRequired && styles.rxStepBadge,
              ]}
            >
              <Text style={styles.stepBadgeText}>STEP 2</Text>
            </View>
            <Text style={styles.cardTitle}>
              {isPrescriptionRequired
                ? "Doctor's Prescription (Required for Tablets)"
                : "Attach Prescription (Optional)"}
            </Text>
          </View>

          {/* WARNING NOTICE IF TABLETS PRESENT */}
          {isPrescriptionRequired && (
            <View style={styles.rxNoticeBox}>
              <Ionicons name="alert-circle" size={20} color={colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rxNoticeTitle}>
                  Prescription Mandatory for Medicine Order
                </Text>
                <Text style={styles.rxNoticeDesc}>
                  Your cart contains tablets / regulated medicines (
                  {prescriptionItems.map((p) => p.name).join(', ')}). A valid doctor prescription
                  is required as per government regulations.
                </Text>
              </View>
            </View>
          )}

          {/* UPLOADED PRESCRIPTION PREVIEW */}
          {uploadedPrescription ? (
            <View style={styles.uploadedRxCard}>
              <View style={styles.uploadedRxLeft}>
                <View style={styles.uploadedRxIconWrap}>
                  {uploadedPrescription.uri ? (
                    <Image
                      source={{ uri: uploadedPrescription.uri }}
                      style={styles.rxThumbnail}
                    />
                  ) : (
                    <Ionicons
                      name="document-text"
                      size={26}
                      color={colors.primary}
                    />
                  )}
                </View>
                <View style={styles.uploadedRxDetails}>
                  <Text style={styles.uploadedRxName} numberOfLines={1}>
                    {uploadedPrescription.name}
                  </Text>
                  <Text style={styles.uploadedRxSub}>
                    {uploadedPrescription.type} • {uploadedPrescription.date}
                  </Text>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="checkmark-circle" size={12} color="#00B894" />
                    <Text style={styles.verifiedTagText}>
                      Ready for Pharmacist Review
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeRxBtn}
                onPress={() => setUploadedPrescription(null)}
              >
                <Ionicons name="trash-outline" size={18} color="#E53935" />
              </TouchableOpacity>
            </View>
          ) : (
            /* UPLOAD ACTION BUTTONS */
            <View style={styles.uploadActionGrid}>
              <TouchableOpacity
                style={styles.uploadBtn}
                activeOpacity={0.8}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={styles.uploadBtnTitle}>Take Camera Photo</Text>
                <Text style={styles.uploadBtnSub}>Click prescription photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadBtn}
                activeOpacity={0.8}
                onPress={handlePickFromGallery}
              >
                <Ionicons name="image-outline" size={22} color={colors.primary} />
                <Text style={styles.uploadBtnTitle}>Upload from Gallery</Text>
                <Text style={styles.uploadBtnSub}>Select image / document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadBtnWide}
                activeOpacity={0.8}
                onPress={() => setShowSampleRxModal(true)}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={20}
                  color={colors.secondary}
                />
                <Text style={styles.uploadBtnWideText}>
                  Choose from Saved / E-Prescriptions
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ==================================================
            STEP 3: DELIVERY SLOT
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 3</Text>
            </View>
            <Text style={styles.cardTitle}>Choose Delivery Slot</Text>
          </View>

          {DELIVERY_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedSlot(slot.id)}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isSelected ? colors.primary : colors.slate}
                />
                <View style={styles.slotInfo}>
                  <View style={styles.slotRow}>
                    <Text style={styles.slotTitle}>{slot.title}</Text>
                    <Text style={styles.slotFee}>{slot.fee}</Text>
                  </View>
                  <Text style={styles.slotTime}>{slot.time}</Text>
                  <Text style={styles.slotDesc}>{slot.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ==================================================
            STEP 4: PAYMENT SELECTION (COD & ONLINE)
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 4</Text>
            </View>
            <Text style={styles.cardTitle}>Choose Payment Method</Text>
          </View>

          {PAYMENT_CATEGORIES.map((cat) => {
            const isSelected = paymentMethod === cat.id;
            return (
              <View key={cat.id} style={styles.paymentBox}>
                <TouchableOpacity
                  style={[styles.paymentHeader, isSelected && styles.paymentHeaderActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setPaymentMethod(cat.id);
                    setSelectedSubOption(cat.subOptions[0]);
                  }}
                >
                  <View style={styles.paymentIconCircle}>
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.secondary}
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{cat.name}</Text>
                    <Text style={styles.paymentDesc}>{cat.desc}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? colors.primary : colors.slate}
                  />
                </TouchableOpacity>

                {/* SUB OPTIONS */}
                {isSelected && cat.subOptions.length > 1 && (
                  <View style={styles.subOptionsContainer}>
                    {cat.subOptions.map((sub) => {
                      const isSubSelected = selectedSubOption === sub;
                      return (
                        <TouchableOpacity
                          key={sub}
                          style={styles.subOptionRow}
                          onPress={() => setSelectedSubOption(sub)}
                        >
                          <Ionicons
                            name={isSubSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={isSubSelected ? colors.primary : colors.slate}
                          />
                          <Text
                            style={[
                              styles.subOptionText,
                              isSubSelected && styles.subOptionTextActive,
                            ]}
                          >
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {selectedSubOption === 'Enter UPI ID' && (
                      <TextInput
                        style={styles.customUpiInput}
                        placeholder="e.g. yourname@oksbi / @paytm"
                        placeholderTextColor={colors.slate}
                        value={customUpi}
                        onChangeText={setCustomUpi}
                        autoCapitalize="none"
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ==================================================
            ORDER RECAP & BILL
        ================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Order Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total ({cart.length} items)</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Discount ({appliedCoupon?.code})</Text>
              <Text style={styles.billDiscount}>-₹{discountAmount}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={deliveryFee === 0 ? styles.freeText : styles.billValue}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Packaging & Safety Fee</Text>
            <Text style={styles.billValue}>₹{packagingFee}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal}</Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* BOTTOM PLACE ORDER BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomPriceWrap}>
            <Text style={styles.bottomPriceLabel}>Total Payable</Text>
            <Text style={styles.bottomPriceValue}>₹{finalTotal}</Text>
          </View>

          <TouchableOpacity
            style={styles.placeOrderBtn}
            activeOpacity={0.85}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.placeOrderText}>
                  {paymentMethod === 'COD' ? 'Confirm & Place Order' : `Pay ₹${finalTotal}`}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SAMPLE / SAVED E-PRESCRIPTIONS MODAL */}
      <Modal
        visible={showSampleRxModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSampleRxModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select E-Prescription</Text>
                <Text style={styles.modalSubtitle}>Prescriptions linked to your profile</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSampleRxModal(false)}>
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SAMPLE_PRESCRIPTIONS.map((rx) => (
                <TouchableOpacity
                  key={rx.id}
                  style={styles.sampleRxCard}
                  activeOpacity={0.8}
                  onPress={() => handleSelectSampleRx(rx)}
                >
                  <View style={styles.sampleRxHeader}>
                    <Ionicons name="document-text" size={20} color={colors.primary} />
                    <Text style={styles.sampleRxDoctor}>{rx.doctor}</Text>
                  </View>
                  <Text style={styles.sampleRxHospital}>{rx.hospital}</Text>
                  <Text style={styles.sampleRxMeds}>Prescribed: {rx.meds}</Text>
                  <Text style={styles.sampleRxDate}>Date: {rx.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    fontSize: 10,
    color: colors.slate,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rxRequiredCardBorder: {
    borderColor: '#FFC8B3',
    backgroundColor: '#FFFAF7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: '#E8F7F4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rxStepBadge: {
    backgroundColor: '#FFE6DC',
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
    flex: 1,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7F4',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
    justifyContent: 'center',
  },
  gpsDetectText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F0F4F6',
  },
  tagPillActive: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  tagTextActive: {
    color: colors.white,
  },
  rxNoticeBox: {
    backgroundColor: '#FFF2EC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFD3C4',
  },
  rxNoticeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.coral,
  },
  rxNoticeDesc: {
    fontSize: 10,
    color: '#7C3418',
    marginTop: 2,
    lineHeight: 14,
  },
  uploadedRxCard: {
    backgroundColor: '#F0FAF8',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BEECE1',
  },
  uploadedRxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  uploadedRxIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rxThumbnail: {
    width: '100%',
    height: '100%',
  },
  uploadedRxDetails: {
    flex: 1,
  },
  uploadedRxName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  uploadedRxSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A382',
  },
  removeRxBtn: {
    padding: 6,
  },
  uploadActionGrid: {
    gap: 8,
  },
  uploadBtn: {
    backgroundColor: '#F0FAF8',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BEECE1',
    borderStyle: 'dashed',
  },
  uploadBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  uploadBtnSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 1,
  },
  uploadBtnWide: {
    backgroundColor: '#F8FAFB',
    padding: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadBtnWideText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 10,
  },
  slotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF8',
  },
  slotInfo: {
    flex: 1,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  slotFee: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00B894',
  },
  slotTime: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  slotDesc: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
  paymentBox: {
    marginBottom: 10,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  paymentHeaderActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF8',
  },
  paymentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  paymentDesc: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 1,
  },
  subOptionsContainer: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    marginLeft: 20,
    gap: 8,
  },
  subOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  subOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate,
  },
  subOptionTextActive: {
    color: colors.secondary,
    fontWeight: '900',
  },
  customUpiInput: {
    height: 38,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 6,
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
  divider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
  },
  totalValue: {
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bottomBarInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  placeOrderBtn: {
    backgroundColor: colors.primary,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeOrderText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
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
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 1,
  },
  sampleRxCard: {
    backgroundColor: '#F8FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleRxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sampleRxDoctor: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  sampleRxHospital: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
  sampleRxMeds: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  sampleRxDate: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
});

export default CheckoutScreen;