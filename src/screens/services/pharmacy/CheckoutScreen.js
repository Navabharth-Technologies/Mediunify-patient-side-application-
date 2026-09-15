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
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../../utils/locationHelper';
import { useCart } from '../../../context/CartContext';
import WebFooter from '../../../components/web/WebFooter';

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

const CheckoutScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const {
    cart,
    subtotal,
    deliveryFee,
    packagingFee,
    discountAmount,
    finalTotal,
    appliedCoupon,
    selectedAddress,
    addOrder,
    clearCart,
  } = useCart();

  // Form States (Matching Video & Doctor Booking design)
  const [recipientName, setRecipientName] = useState(selectedAddress?.name || 'Ramesh (Self)');
  const [recipientPhone, setRecipientPhone] = useState(selectedAddress?.phone || '+91 98450 12345');
  const [deliveryAddress, setDeliveryAddress] = useState(
    selectedAddress?.addressLine || 'Flat 402, Green Valley Apartments, Kuvempunagar, Mysore'
  );
  const [deliveryCity, setDeliveryCity] = useState(selectedAddress?.city || 'Mysore');
  const [deliveryPincode, setDeliveryPincode] = useState(selectedAddress?.pincode || '570023');

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);

  // Uploaded Document / Prescription / PDF State
  const [uploadedDocument, setUploadedDocument] = useState(null);

  // Delivery & Payment States
  const [selectedSlot, setSelectedSlot] = useState('express');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'WALLET' | 'UPI'
  const [walletBalance, setWalletBalance] = useState(1250);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim()) {
        setRecipientName(`${storedName.trim()} (Self)`);
      }
      const storedPhone = await AsyncStorage.getItem('userPhone');
      if (storedPhone && storedPhone.trim()) {
        setRecipientPhone(storedPhone.trim().startsWith('+91') ? storedPhone.trim() : `+91 ${storedPhone.trim()}`);
      }
      const bal = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (bal) setWalletBalance(parseInt(bal, 10) || 1250);
    } catch (e) {
      console.log('Error loading user data in checkout:', e);
    }
  };

  // GPS Auto-locate
  const handleGpsAutofill = async () => {
    try {
      setGpsLoading(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        showAlert('Permission Required', 'Location permission is required to detect delivery address.');
        setGpsLoading(false);
        return;
      }
      const pos = await getCurrentPositionWebSafe({ accuracy: 3 });
      if (pos?.coords) {
        const geo = await reverseGeocodeWebSafe(pos.coords.latitude, pos.coords.longitude);
        if (geo) {
          const formatted = `${geo.name ? geo.name + ', ' : ''}${geo.street ? geo.street + ', ' : ''}${geo.district || geo.city || ''}`;
          setDeliveryAddress(formatted || 'Current GPS Location, Kuvempunagar');
          if (geo.city) setDeliveryCity(geo.city);
          if (geo.postalCode) setDeliveryPincode(geo.postalCode);
        }
      }
      setGpsLoading(false);
    } catch (e) {
      setGpsLoading(false);
      setDeliveryAddress('Kuvempunagar 5th Main, Mysore');
    }
  };

  // Document / Prescription Picker (Matching VideoBookingScreen)
  const handlePickDocument = async (typeChoice = 'any') => {
    try {
      if (typeChoice === 'camera') {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Required', 'Camera permission is required to capture documents.');
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: `Camera_Rx_${Date.now().toString().slice(-4)}.jpg`,
            uri: asset.uri,
            type: 'image/jpeg',
            size: '1.2 MB',
          });
        }
      } else if (typeChoice === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const fileName = asset.fileName || `Rx_Image_${Date.now().toString().slice(-4)}.jpg`;
          setUploadedDocument({
            name: fileName,
            uri: asset.uri,
            type: 'image/jpeg',
            size: asset.fileSize ? `${(asset.fileSize / 1024 / 1024).toFixed(1)} MB` : '1.4 MB',
          });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: asset.name || 'Medical_Record.pdf',
            uri: asset.uri,
            type: asset.mimeType || 'application/pdf',
            size: asset.size ? `${(asset.size / 1024 / 1024).toFixed(1)} MB` : '850 KB',
          });
        }
      }
    } catch (err) {
      console.log('Error picking document:', err);
      showAlert('Upload Error', 'Could not access file. Please try selecting again.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!recipientName.trim()) {
      showAlert('Name Required', 'Please enter the recipient full name.');
      return;
    }
    if (!recipientPhone.trim()) {
      showAlert('Phone Required', 'Please enter a contact number for delivery.');
      return;
    }
    if (!deliveryAddress.trim()) {
      showAlert('Address Required', 'Please provide a valid delivery address.');
      return;
    }

    if (cart.length === 0) {
      showAlert('Empty Cart', 'Your cart is empty. Please add medicines before checkout.');
      return;
    }

    setIsPlacingOrder(true);
    const orderId = `PHARM-${Date.now().toString().slice(-6)}`;
    const slotObj = DELIVERY_SLOTS.find((s) => s.id === selectedSlot) || DELIVERY_SLOTS[0];

    const newOrder = {
      orderId,
      id: orderId,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Confirmed',
      itemsCount: cart.length,
      subtotal,
      deliveryFee,
      packagingFee,
      discountAmount,
      totalAmount: finalTotal,
      finalTotal,
      paymentMethod,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      address: {
        name: recipientName.trim(),
        phone: recipientPhone.trim(),
        addressLine: deliveryAddress.trim(),
        city: deliveryCity,
        pincode: deliveryPincode,
      },
      prescriptionAttached: uploadedDocument ? uploadedDocument.name : null,
      deliverySlot: `${slotObj.title} (${slotObj.time})`,
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        brand: i.brand,
        price: i.price,
        quantity: i.quantity,
        category: i.category,
      })),
    };

    try {
      await addOrder(newOrder);

      // Save to async storage
      const existingJson = await AsyncStorage.getItem('@unnathi_pharmacy_orders');
      const existing = existingJson ? JSON.parse(existingJson) : [];
      await AsyncStorage.setItem('@unnathi_pharmacy_orders', JSON.stringify([newOrder, ...existing]));

      // If wallet used, deduct balance
      if (paymentMethod === 'WALLET') {
        const newBal = Math.max(0, walletBalance - finalTotal);
        await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
      }

      clearCart();
      setIsPlacingOrder(false);

      showAlert(
        'Medicine Order Placed! 💊',
        `Thank you ${recipientName}! Your pharmacy order (${orderId}) has been confirmed for ${slotObj.title}.\n\nEstimated Delivery: 30-45 mins.\nTotal: ₹${finalTotal}`,
        [
          {
            text: 'Go to My Orders',
            onPress: () => {
              navigation.replace('MyOrders');
            },
          },
          {
            text: 'Done',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (e) {
      console.log('Error placing pharmacy order:', e);
      setIsPlacingOrder(false);
      showAlert('Order Error', 'Could not complete order. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDesktopWeb && styles.scrollContentDesktop,
          ]}
        >
          {/* DESKTOP BREADCRUMBS ROW */}
          {isDesktopWeb && (
            <View style={styles.breadcrumbsRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSlash}>/</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Pharmacy')}>
                <Text style={styles.breadcrumbLink}>Pharmacy Store</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSlash}>/</Text>
              <Text style={styles.breadcrumbCurrent}>Book Pharmacy Order</Text>
            </View>
          )}

          {/* CARD CONTAINER (Matching Video & Doctor Booking Screen) */}
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 500 }]}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.confidentialBadgePill}>
                  <Ionicons name="shield-checkmark" size={11} color="#00B894" />
                  <Text style={styles.confidentialBadgePillText}>100% VERIFIED PHARMACY CARE</Text>
                </View>
                <Text style={styles.modalTitle}>Order Medicines & Health Products</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {cart.length > 0 ? `${cart.length} item${cart.length > 1 ? 's' : ''} in cart • Total ₹${finalTotal}` : 'Express Doorstep Delivery'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* FORM BODY */}
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* RECIPIENT FULL NAME */}
              <Text style={styles.inputLabel}>Recipient Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Enter recipient name"
                placeholderTextColor="#94A3B8"
              />

              {/* MOBILE NUMBER */}
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
                placeholder="+91 98450 12345"
                placeholderTextColor="#94A3B8"
              />

              {/* DELIVERY ADDRESS */}
              <View style={styles.labelWithActionRow}>
                <Text style={styles.inputLabelNoMargin}>Delivery Address & Landmark</Text>
                <TouchableOpacity
                  style={styles.gpsAutofillChip}
                  onPress={handleGpsAutofill}
                  disabled={gpsLoading}
                  activeOpacity={0.8}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color="#00B894" />
                  ) : (
                    <Ionicons name="navigate" size={12} color="#00B894" />
                  )}
                  <Text style={styles.gpsAutofillText}>
                    {gpsLoading ? 'Detecting...' : 'Auto-locate GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Flat / House No., Apartment name, Street & Area"
                placeholderTextColor="#94A3B8"
                multiline
              />

              {/* UPLOAD PRESCRIPTION / MEDICAL RECORDS */}
              <Text style={styles.inputLabel}>Doctor Prescription / Medical Records (Optional)</Text>
              {!uploadedDocument ? (
                <View style={styles.uploadContainer}>
                  <View style={styles.uploadButtonsRow}>
                    {/* UPLOAD PDF BUTTON */}
                    <TouchableOpacity
                      style={styles.uploadActionBtn}
                      onPress={() => handlePickDocument('pdf')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="document-text" size={16} color="#DC2626" />
                      <Text style={styles.uploadActionBtnText}>Upload PDF</Text>
                    </TouchableOpacity>

                    {/* TAKE PHOTO BUTTON */}
                    <TouchableOpacity
                      style={styles.uploadActionBtn}
                      onPress={() => handlePickDocument('camera')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="camera" size={16} color="#2563EB" />
                      <Text style={styles.uploadActionBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadHintText}>
                    Our licensed registered pharmacist will verify dosage and pack genuine medicines.
                  </Text>
                </View>
              ) : (
                /* UPLOADED FILE CARD */
                <View style={styles.uploadedFileCard}>
                  <View style={styles.uploadedFileIconWrap}>
                    {uploadedDocument.type?.includes('image') ? (
                      <Image source={{ uri: uploadedDocument.uri }} style={styles.uploadedFileThumb} />
                    ) : (
                      <Ionicons name="document-text" size={20} color="#DC2626" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.uploadedFileName} numberOfLines={1}>
                      {uploadedDocument.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={styles.uploadedFileSize}>{uploadedDocument.size}</Text>
                      <Text style={styles.uploadedFileDot}>•</Text>
                      <Text style={styles.uploadedFileReady}>✓ Attached to Order</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUploadedDocument(null)}
                    style={styles.removeFileBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* PREFERRED DELIVERY SLOT */}
              <Text style={styles.inputLabel}>Select Delivery Slot</Text>
              <View style={styles.slotPickerRow}>
                {DELIVERY_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                      onPress={() => setSelectedSlot(slot.id)}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                          {slot.title}
                        </Text>
                        <Text style={[styles.slotChipFee, isSelected && styles.slotChipFeeSelected]}>
                          {slot.time}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* PAYMENT OPTIONS (Matching Video & In-Clinic Booking) */}
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.payOptionsRow}>
                {/* 1. COD */}
                <TouchableOpacity
                  style={[styles.payMethodChip, paymentMethod === 'COD' && styles.payMethodChipActive]}
                  onPress={() => setPaymentMethod('COD')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="cash-outline"
                    size={14}
                    color={paymentMethod === 'COD' ? '#00B894' : '#64748B'}
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={[styles.payMethodText, paymentMethod === 'COD' && styles.payMethodTextActive]}>
                    Pay on Delivery
                  </Text>
                </TouchableOpacity>

                {/* 2. WALLET */}
                <TouchableOpacity
                  style={[styles.payMethodChip, paymentMethod === 'WALLET' && styles.payMethodChipActive]}
                  onPress={() => setPaymentMethod('WALLET')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={14}
                    color={paymentMethod === 'WALLET' ? '#00B894' : '#64748B'}
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={[styles.payMethodText, paymentMethod === 'WALLET' && styles.payMethodTextActive]}>
                    Wallet (₹{walletBalance})
                  </Text>
                </TouchableOpacity>

                {/* 3. UPI */}
                <TouchableOpacity
                  style={[styles.payMethodChip, paymentMethod === 'UPI' && styles.payMethodChipActive]}
                  onPress={() => setPaymentMethod('UPI')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={14}
                    color={paymentMethod === 'UPI' ? '#00B894' : '#64748B'}
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={[styles.payMethodText, paymentMethod === 'UPI' && styles.payMethodTextActive]}>
                    Instant UPI
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PRICING & BILL BREAKDOWN */}
              <View style={styles.pricingSummaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items Subtotal ({cart.length} items)</Text>
                  <Text style={styles.summaryVal}>₹{subtotal}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Express Delivery Fee</Text>
                  <Text style={[styles.summaryVal, { color: '#00B894' }]}>FREE</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Coupon Discount ({appliedCoupon?.code || 'OFFER'})</Text>
                    <Text style={[styles.summaryVal, { color: '#00B894' }]}>-₹{discountAmount}</Text>
                  </View>
                )}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Final Amount Payable</Text>
                  <Text style={styles.summaryTotalVal}>₹{finalTotal}</Text>
                </View>
              </View>

              {/* PRIVACY & ASSURANCE BOX */}
              <View style={styles.assuranceBox}>
                <Ionicons name="shield-checkmark" size={16} color="#00B894" />
                <Text style={styles.assuranceText}>
                  100% Genuine Pharmacy Guarantee: Sealed cold-chain transit, licensed pharmacist verification, and doorstep return support.
                </Text>
              </View>
            </ScrollView>

            {/* MODAL FOOTER CONFIRM BUTTON */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={handlePlaceOrder}
                activeOpacity={0.9}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.confirmBookingBtnText}>
                      Place Order • ₹{finalTotal}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isDesktopWeb && (
            <View style={{ width: '100%', marginTop: 40 }}>
              <WebFooter />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? 'rgba(15, 23, 42, 0.65)' : '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContentDesktop: {
    paddingVertical: 32,
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    marginBottom: 16,
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    color: Platform.OS === 'web' ? '#34D399' : '#059669',
    fontWeight: '600',
  },
  breadcrumbSlash: {
    fontSize: 12,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: Platform.OS === 'web' ? '#CBD5E1' : '#64748B',
    fontWeight: '500',
  },

  // MODAL CARD (Matches VideoBookingScreen standard)
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
  },

  // MODAL HEADER
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  confidentialBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  confidentialBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.3,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '600',
    maxWidth: 340,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // FORM BODY
  modalForm: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  inputLabelNoMargin: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 10,
  },
  gpsAutofillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsAutofillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B894',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },

  // UPLOAD CONTAINER (Matching VideoBookingScreen)
  uploadContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  uploadActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  uploadHintText: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // UPLOADED FILE CARD
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 10,
  },
  uploadedFileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  uploadedFileThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  uploadedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadedFileSize: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  uploadedFileDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  uploadedFileReady: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00B894',
  },
  removeFileBtn: {
    padding: 6,
  },

  // DELIVERY SLOTS
  slotPickerRow: {
    gap: 6,
    marginTop: 2,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#00B894',
  },
  slotChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  slotChipTextSelected: {
    fontWeight: '800',
    color: '#065F46',
  },
  slotChipFee: {
    fontSize: 11,
    color: '#64748B',
  },
  slotChipFeeSelected: {
    color: '#00B894',
    fontWeight: '700',
  },

  // PAYMENT OPTIONS
  payOptionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  payMethodChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#00B894',
  },
  payMethodText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  payMethodTextActive: {
    color: '#065F46',
    fontWeight: '800',
  },

  // PRICING SUMMARY BOX
  pricingSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00B894',
  },

  // ASSURANCE BOX
  assuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  assuranceText: {
    fontSize: 10.5,
    color: '#065F46',
    lineHeight: 14,
    flex: 1,
    fontWeight: '500',
  },

  // MODAL FOOTER
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmBookingBtn: {
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBookingBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default CheckoutScreen;