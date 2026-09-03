import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';

const PROMO_CHIPS = ['MEDI20', 'HEALTH50'];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'logo-google', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm UPI', icon: 'wallet', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'flash', color: '#00875A' },
];

const NET_BANKS = ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank'];

const RadiologyPaymentScreen = ({ route, navigation }) => {
  const { bookingDetails } = route.params || {};
  const { lab, tests = [], date, timeSlot, patient, pricing } = bookingDetails || {};

  const { removeFromCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);

  // Processing loader
  const [isProcessing, setIsProcessing] = useState(false);

  // Base pricing
  const basePayable = pricing?.finalPayable || 0;

  // Calculate extra discount from promo
  const couponDiscount = appliedCoupon
    ? appliedCoupon.percent
      ? Math.round((basePayable * appliedCoupon.percent) / 100)
      : appliedCoupon.amount || 0
    : 0;

  const finalPayable = Math.max(0, basePayable - couponDiscount);

  // Handle Apply Coupon
  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (code === 'MEDI20') {
      setAppliedCoupon({ code: 'MEDI20', percent: 20 });
      setCouponMessage({ type: 'success', text: '20% Extra Diagnostic Discount Applied!' });
    } else if (code === 'HEALTH50') {
      setAppliedCoupon({ code: 'HEALTH50', amount: 50 });
      setCouponMessage({ type: 'success', text: 'Flat ₹50 Promo Discount Applied!' });
    } else {
      setAppliedCoupon(null);
      setCouponMessage({ type: 'error', text: 'Invalid promo code. Try MEDI20 or HEALTH50' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage(null);
    setCouponCode('');
  };

  // Process & Confirm Booking
  const handleConfirmAndPay = async () => {
    setIsProcessing(true);

    try {
      // Simulate secure transaction network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const bookingId = `RAD-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;

      const confirmedBooking = {
        id: bookingId,
        bookingType: 'Radiology',
        tokenNumber,
        bookingDate: new Date().toISOString(),
        appointmentDate: date.fullDateText,
        appointmentDateStr: date.dateStr,
        appointmentSlot: timeSlot,
        lab: {
          id: lab?.id,
          name: lab?.name,
          area: lab?.area,
          address: lab?.address,
          phone: lab?.phone,
          accreditation: lab?.accreditation,
        },
        tests: tests.map((t) => ({
          id: t.id,
          name: t.name,
          categoryLabel: t.categoryLabel,
          modalityCode: t.modalityCode,
          price: t.price,
          duration: t.duration,
          reportTime: t.reportTime,
          fastingRequired: t.fastingRequired,
          preparation: t.preparation,
        })),
        patient,
        payment: {
          method: paymentMethod === 'LAB_COUNTER' ? 'Pay at Lab Counter' : paymentMethod,
          status: paymentMethod === 'LAB_COUNTER' ? 'Pay on Visit' : 'Paid Online',
          paidAmount: finalPayable,
          mrpTotal: pricing?.mrpTotal || basePayable,
          savings: (pricing?.totalSavings || 0) + couponDiscount,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          transactionId: paymentMethod === 'LAB_COUNTER' ? null : `TXN${Date.now()}`,
        },
        status: 'Confirmed',
      };

      // 1. Save to AsyncStorage '@radiologyBookings'
      const existingRadJson = await AsyncStorage.getItem('@radiologyBookings');
      const existingRad = existingRadJson ? JSON.parse(existingRadJson) : [];
      await AsyncStorage.setItem(
        '@radiologyBookings',
        JSON.stringify([confirmedBooking, ...existingRad])
      );

      // 2. Also save to global '@unnathi_appointments' / Bookings list
      const existingApptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const existingAppt = existingApptJson ? JSON.parse(existingApptJson) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([
          {
            id: bookingId,
            doctor: {
              name: lab?.name || 'Diagnostic Center',
              specialty: `Radiology (${tests[0]?.categoryLabel || 'Scan'})`,
            },
            day: date.dayName,
            date: `${date.dayNum} ${date.month}`,
            time: timeSlot,
            status: 'Confirmed',
            type: 'Radiology',
            details: confirmedBooking,
          },
          ...existingAppt,
        ])
      );

      // 3. Remove booked items from cart if they were in cart
      tests.forEach((t) => {
        removeFromCart(t.id);
      });

      setIsProcessing(false);

      // Navigate to order success screen
      navigation.navigate('RadiologyOrderSuccess', {
        booking: confirmedBooking,
      });
    } catch (e) {
      console.log('Error saving booking:', e);
      setIsProcessing(false);
      Alert.alert('Payment Error', 'Could not complete the transaction. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          HEADER
      ================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pay Test Bill</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 2: Secure Payment & Invoice</Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>2/2</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            APPOINTMENT & LAB SUMMARY CARD
        ================================================== */}
        <View style={styles.bookingOverviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.overviewIconWrap}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
            </View>
            <View style={styles.overviewHeaderInfo}>
              <Text style={styles.overviewDateText}>
                {date?.fullDateText} • {timeSlot}
              </Text>
              <Text style={styles.overviewLabName}>{lab?.name}</Text>
            </View>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.patientInfoRow}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
            <Text style={styles.patientNameText}>
              Patient: <Text style={{ fontWeight: '800', color: colors.secondary }}>{patient?.name}</Text> ({patient?.age} yrs, {patient?.gender})
            </Text>
          </View>
        </View>

        {/* ==================================================
            PROMO CODE & COUPONS
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="pricetag-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Apply Coupon / Promo Code</Text>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedCouponBanner}>
              <View style={styles.appliedCouponLeft}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.appliedCouponCode}>{appliedCoupon.code} Applied</Text>
                  <Text style={styles.appliedCouponDesc}>You saved ₹{couponDiscount} extra</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Promo Code (e.g. MEDI20)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={couponCode}
                  onChangeText={setCouponCode}
                />
                <TouchableOpacity
                  style={styles.applyCouponBtn}
                  onPress={() => handleApplyCoupon(couponCode)}
                >
                  <Text style={styles.applyCouponBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>

              {couponMessage && (
                <Text
                  style={[
                    styles.couponFeedbackText,
                    couponMessage.type === 'error' && { color: '#EF4444' },
                  ]}
                >
                  {couponMessage.text}
                </Text>
              )}

              {/* QUICK PROMO CHIPS */}
              <View style={styles.promoChipsRow}>
                {PROMO_CHIPS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.promoChip}
                    onPress={() => {
                      setCouponCode(c);
                      handleApplyCoupon(c);
                    }}
                  >
                    <Ionicons name="flash" size={11} color={colors.primary} />
                    <Text style={styles.promoChipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ==================================================
            PAYMENT METHODS SELECTOR
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
          </View>

          {/* OPTION 1: UPI */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === 'UPI' && styles.paymentOptionActive,
            ]}
            activeOpacity={0.88}
            onPress={() => setPaymentMethod('UPI')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={styles.radioCircle}>
                {paymentMethod === 'UPI' && <View style={styles.radioSelected} />}
              </View>
              <View style={styles.paymentOptionTitleCol}>
                <Text style={styles.paymentMethodTitle}>Instant UPI (Google Pay, PhonePe, Paytm)</Text>
                <Text style={styles.paymentMethodSubtitle}>Instant zero-convenience fee payment</Text>
              </View>
              <View style={styles.fastTag}>
                <Text style={styles.fastTagText}>INSTANT</Text>
              </View>
            </View>

            {paymentMethod === 'UPI' && (
              <View style={styles.upiAppsContainer}>
                <View style={styles.upiAppsGrid}>
                  {UPI_APPS.map((app) => {
                    const isAppSelected = selectedUpiApp === app.id;
                    return (
                      <TouchableOpacity
                        key={app.id}
                        style={[
                          styles.upiAppBtn,
                          isAppSelected && styles.upiAppBtnActive,
                        ]}
                        onPress={() => setSelectedUpiApp(app.id)}
                      >
                        <Ionicons name={app.icon} size={20} color={app.color} />
                        <Text
                          style={[
                            styles.upiAppBtnText,
                            isAppSelected && styles.upiAppBtnTextActive,
                          ]}
                        >
                          {app.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.upiIdInputWrap}>
                  <TextInput
                    style={styles.upiIdInput}
                    placeholder="Or enter UPI ID (e.g. name@okhdfcbank)"
                    value={upiIdInput}
                    onChangeText={setUpiIdInput}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* OPTION 2: CREDIT / DEBIT CARD */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === 'CARD' && styles.paymentOptionActive,
            ]}
            activeOpacity={0.88}
            onPress={() => setPaymentMethod('CARD')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={styles.radioCircle}>
                {paymentMethod === 'CARD' && <View style={styles.radioSelected} />}
              </View>
              <View style={styles.paymentOptionTitleCol}>
                <Text style={styles.paymentMethodTitle}>Credit / Debit Card</Text>
                <Text style={styles.paymentMethodSubtitle}>Visa, MasterCard, RuPay, Maestro</Text>
              </View>
              <Ionicons name="card" size={20} color={colors.secondary} />
            </View>

            {paymentMethod === 'CARD' && (
              <View style={styles.cardInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Card Number (e.g. 4532 8920 1284 9012)"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
                <View style={styles.cardRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                    placeholder="MM / YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="CVV"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={cardCvv}
                    onChangeText={setCardCvv}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* OPTION 3: NET BANKING */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === 'NET_BANKING' && styles.paymentOptionActive,
            ]}
            activeOpacity={0.88}
            onPress={() => setPaymentMethod('NET_BANKING')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={styles.radioCircle}>
                {paymentMethod === 'NET_BANKING' && <View style={styles.radioSelected} />}
              </View>
              <View style={styles.paymentOptionTitleCol}>
                <Text style={styles.paymentMethodTitle}>Net Banking</Text>
                <Text style={styles.paymentMethodSubtitle}>All Indian major banks supported</Text>
              </View>
              <Ionicons name="globe-outline" size={20} color={colors.secondary} />
            </View>

            {paymentMethod === 'NET_BANKING' && (
              <View style={styles.bankPillsRow}>
                {NET_BANKS.map((bank) => {
                  const isBankSelected = selectedBank === bank;
                  return (
                    <TouchableOpacity
                      key={bank}
                      style={[
                        styles.bankPill,
                        isBankSelected && styles.bankPillActive,
                      ]}
                      onPress={() => setSelectedBank(bank)}
                    >
                      <Text
                        style={[
                          styles.bankPillText,
                          isBankSelected && styles.bankPillTextActive,
                        ]}
                      >
                        {bank}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>

          {/* OPTION 4: PAY AT LAB COUNTER */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === 'LAB_COUNTER' && styles.paymentOptionActive,
            ]}
            activeOpacity={0.88}
            onPress={() => setPaymentMethod('LAB_COUNTER')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={styles.radioCircle}>
                {paymentMethod === 'LAB_COUNTER' && <View style={styles.radioSelected} />}
              </View>
              <View style={styles.paymentOptionTitleCol}>
                <Text style={styles.paymentMethodTitle}>Pay at Diagnostic Center Counter</Text>
                <Text style={styles.paymentMethodSubtitle}>Pay via Cash or Card on your appointment visit</Text>
              </View>
              <Ionicons name="cash-outline" size={20} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ==================================================
            FINAL INVOICE SUMMARY
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="receipt" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Invoice & Tax Summary</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Test(s) Standard MRP Rate</Text>
            <Text style={styles.invoiceValue}>₹{pricing?.mrpTotal || basePayable}</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={[styles.invoiceLabel, { color: '#059669' }]}>Diagnostic Lab Discount</Text>
            <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '700' }]}>
              - ₹{pricing?.totalSavings || 0}
            </Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceLabel, { color: '#059669' }]}>
                Promo Voucher ({appliedCoupon?.code})
              </Text>
              <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '700' }]}>
                - ₹{couponDiscount}
              </Text>
            </View>
          )}

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Lab Facility & Sanitization Fee</Text>
            <Text style={[styles.invoiceValue, { color: '#059669' }]}>FREE</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>GST / Healthcare Tax</Text>
            <Text style={styles.invoiceValue}>₹0 (Exempted)</Text>
          </View>

          <View style={styles.invoiceDivider} />

          <View style={styles.invoiceTotalRow}>
            <View>
              <Text style={styles.invoiceTotalLabel}>Net Payable Amount</Text>
              <Text style={styles.invoiceSavingsText}>
                Total Saved: ₹{(pricing?.totalSavings || 0) + couponDiscount}
              </Text>
            </View>
            <Text style={styles.invoiceTotalAmount}>₹{finalPayable}</Text>
          </View>
        </View>

        {/* TRUST BADGE */}
        <View style={styles.trustBadgeRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={styles.trustBadgeText}>
            100% Safe & Secure 256-Bit SSL Encrypted Healthcare Checkout
          </Text>
        </View>
      </ScrollView>

      {/* ==================================================
          BOTTOM ACTION BAR
      ================================================== */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>
            {paymentMethod === 'LAB_COUNTER' ? 'Pay on Visit' : 'Pay Online'}
          </Text>
          <Text style={styles.bottomTotalValue}>₹{finalPayable}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          activeOpacity={0.88}
          disabled={isProcessing}
          onPress={handleConfirmAndPay}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {paymentMethod === 'LAB_COUNTER' ? 'Confirm Appointment' : `Pay ₹${finalPayable}`}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  stepBadge: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  // OVERVIEW CARD
  bookingOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  overviewHeaderInfo: {
    flex: 1,
  },
  overviewDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  overviewLabName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientNameText: {
    fontSize: 12,
    color: colors.text,
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },

  // COUPON
  appliedCouponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCouponCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  appliedCouponDesc: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 1,
  },
  removeCouponText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text,
  },
  applyCouponBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  couponFeedbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 6,
  },
  promoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  promoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  promoChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },

  // PAYMENT METHODS
  paymentOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentOptionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentOptionTitleCol: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  paymentMethodSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fastTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },

  // UPI APPS
  upiAppsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  upiAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upiAppBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  upiAppBtnActive: {
    backgroundColor: colors.lightTeal,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  upiAppBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  upiAppBtnTextActive: {
    color: colors.primary,
  },
  upiIdInputWrap: {
    marginTop: 10,
  },
  upiIdInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: colors.text,
  },

  // CARD INPUTS
  cardInputContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    fontSize: 12,
    color: colors.text,
  },
  cardRow: {
    flexDirection: 'row',
  },

  // NET BANKING
  bankPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bankPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bankPillActive: {
    backgroundColor: colors.secondary,
  },
  bankPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  bankPillTextActive: {
    color: '#FFFFFF',
  },

  // INVOICE
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invoiceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  invoiceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  invoiceTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  invoiceSavingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  invoiceTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  // TRUST BADGE
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
    gap: 6,
  },
  trustBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // BOTTOM BAR
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bottomPriceCol: {},
  bottomTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomTotalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 160,
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default RadiologyPaymentScreen;
