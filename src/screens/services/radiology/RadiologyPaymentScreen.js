import React, { useState, useEffect } from 'react';
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
import { showAlert } from '../../../utils/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';
import { pushAppointment } from '../../../services/dataSyncService';

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

  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [walletBalance, setWalletBalance] = useState(1250);
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Load wallet balance
  useEffect(() => {
    (async () => {
      try {
        const bal = await AsyncStorage.getItem('@unnathi_wallet_balance');
        if (bal) setWalletBalance(parseInt(bal, 10) || 1250);
      } catch (e) {}
    })();
  }, []);

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
    if (paymentMethod === 'WALLET') {
      if (walletBalance < finalPayable) {
        showAlert(
          'Insufficient Wallet Balance 💳',
          `Your MediUnify Wallet has ₹${walletBalance.toLocaleString('en-IN')}, but the test fee is ₹${finalPayable.toLocaleString('en-IN')}.\n\nPlease top up or select Instant UPI / Credit or Debit Card / Net Banking.`,
          [
            { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet') },
            { text: 'Change Method', style: 'cancel' },
          ]
        );
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Simulate secure transaction network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const bookingId = `RAD-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;

      // Deduct from wallet if paid via wallet
      if (paymentMethod === 'WALLET') {
        const newBal = Math.max(0, walletBalance - finalPayable);
        setWalletBalance(newBal);
        try {
          await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
          const storedTx = await AsyncStorage.getItem('@unnathi_wallet_transactions');
          const existingTx = storedTx ? JSON.parse(storedTx) : [];
          const newTx = {
            id: `tx-${Date.now()}`,
            title: 'Paid for Diagnostic Scan Booking',
            subtitle: `Booking #${bookingId} • ${lab?.name || 'Radiology Lab'}`,
            amount: `-₹${finalPayable}`,
            type: 'debit',
            date: 'Just Now',
            icon: 'pulse-outline',
          };
          await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([newTx, ...existingTx]));
        } catch (e) {
          console.log('Error updating wallet:', e);
        }
      }

      const onlineMethodName =
        paymentMethod === 'WALLET'
          ? 'MediUnify Health Wallet'
          : paymentMethod === 'UPI'
          ? `Instant UPI (${selectedUpiApp.toUpperCase()})`
          : paymentMethod === 'CARD'
          ? 'Credit / Debit Card'
          : paymentMethod === 'NET_BANKING'
          ? `Net Banking (${selectedBank})`
          : 'Online Payment';

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
          method: onlineMethodName,
          status: 'Paid Online',
          paidAmount: finalPayable,
          mrpTotal: pricing?.mrpTotal || basePayable,
          savings: (pricing?.totalSavings || 0) + couponDiscount,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          transactionId: `TXN${Date.now()}`,
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
      const radAppointmentRecord = {
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
        paidAmount: finalPayable,
        paymentStatus: 'Paid Online',
        details: confirmedBooking,
      };

      const existingApptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const existingAppt = existingApptJson ? JSON.parse(existingApptJson) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([radAppointmentRecord, ...existingAppt])
      );

      // 3. Immediately push to central server database
      try {
        await pushAppointment(radAppointmentRecord);
      } catch (pushErr) {
        console.warn('Could not push radiology booking:', pushErr);
      }

      // 4. Remove booked items from cart if they were in cart
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
      showAlert('Payment Error', 'Could not complete the transaction. Please try again.');
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
            PAYMENT METHODS SELECTOR (ONLINE ONLY)
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="card-outline" size={18} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Select Online Payment Method</Text>
            </View>
            <View style={styles.onlineOnlyBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" style={{ marginRight: 3 }} />
              <Text style={styles.onlineOnlyBadgeText}>Online Only</Text>
            </View>
          </View>

          {/* OPTION 0: MEDIUNIFY WALLET */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === 'WALLET' && styles.paymentOptionActive,
            ]}
            activeOpacity={0.88}
            onPress={() => setPaymentMethod('WALLET')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={styles.radioCircle}>
                {paymentMethod === 'WALLET' && <View style={styles.radioSelected} />}
              </View>
              <View style={styles.paymentOptionTitleCol}>
                <Text style={styles.paymentMethodTitle}>MediUnify Health Wallet</Text>
                <Text style={styles.paymentMethodSubtitle}>1-Click Instant Zero-OTP Payment</Text>
              </View>
              <View style={[styles.fastTag, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.fastTagText, { color: '#059669' }]}>RECOMMENDED</Text>
              </View>
            </View>

            {paymentMethod === 'WALLET' && (
              <View style={styles.walletDetailsBox}>
                <View style={styles.walletBalanceRow}>
                  <Text style={styles.walletBalanceLabel}>Available Balance:</Text>
                  <Text
                    style={[
                      styles.walletBalanceAmount,
                      walletBalance < finalPayable && { color: colors.error },
                    ]}
                  >
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </Text>
                </View>

                {walletBalance < finalPayable ? (
                  <View style={styles.walletShortfallBanner}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.walletShortfallText}>
                      Shortfall of ₹{(finalPayable - walletBalance).toLocaleString('en-IN')}. Please top up or choose UPI / Cards.
                    </Text>
                    <TouchableOpacity
                      style={styles.topUpBtn}
                      onPress={() => navigation.navigate('Wallet')}
                    >
                      <Text style={styles.topUpBtnText}>Top Up</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.walletSufficientBanner}>
                    <Ionicons name="checkmark-circle" size={15} color="#059669" />
                    <Text style={styles.walletSufficientText}>
                      Instant debit • ₹{(walletBalance - finalPayable).toLocaleString('en-IN')} balance remaining
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* OPTION 1: INSTANT UPI */}
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
              <Ionicons name="flash-outline" size={18} color="#2563EB" />
            </View>

            {paymentMethod === 'UPI' && (
              <View style={styles.upiDetailsBox}>
                <Text style={styles.upiAppsLabel}>Select Preferred UPI App:</Text>
                <View style={styles.upiAppsRow}>
                  {[
                    { id: 'gpay', label: 'Google Pay', icon: 'logo-google' },
                    { id: 'phonepe', label: 'PhonePe', icon: 'phone-portrait' },
                    { id: 'paytm', label: 'Paytm', icon: 'wallet' },
                    { id: 'bhim', label: 'BHIM UPI', icon: 'qr-code' },
                  ].map((app) => {
                    const isSelected = selectedUpiApp === app.id;
                    return (
                      <TouchableOpacity
                        key={app.id}
                        style={[styles.upiAppPill, isSelected && styles.upiAppPillActive]}
                        onPress={() => setSelectedUpiApp(app.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={app.icon}
                          size={15}
                          color={isSelected ? '#2563EB' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.upiAppPillText,
                            isSelected && styles.upiAppPillTextActive,
                          ]}
                        >
                          {app.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.upiInputWrap}>
                  <Text style={styles.upiOrText}>Or enter your VPA / UPI ID:</Text>
                  <TextInput
                    style={styles.upiTextInput}
                    placeholder="e.g. mobileNumber@upi"
                    placeholderTextColor="#94A3B8"
                    value={upiIdInput}
                    onChangeText={setUpiIdInput}
                    autoCapitalize="none"
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
              <Ionicons name="card" size={18} color="#D97706" />
            </View>

            {paymentMethod === 'CARD' && (
              <View style={styles.cardInputBox}>
                <TextInput
                  style={styles.cardInputField}
                  placeholder="Card Number (16 Digits)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/\D/g, '').slice(0, 16);
                    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                    setCardNumber(formatted);
                  }}
                />
                <View style={styles.cardRow}>
                  <TextInput
                    style={[styles.cardInputField, { flex: 1, marginRight: 8 }]}
                    placeholder="MM / YY"
                    placeholderTextColor="#94A3B8"
                    maxLength={5}
                    value={cardExpiry}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/\D/g, '').slice(0, 4);
                      if (cleaned.length > 2) {
                        setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
                      } else {
                        setCardExpiry(cleaned);
                      }
                    }}
                  />
                  <TextInput
                    style={[styles.cardInputField, { flex: 1 }]}
                    placeholder="CVV"
                    placeholderTextColor="#94A3B8"
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
              <Ionicons name="business-outline" size={18} color="#4F46E5" />
            </View>

            {paymentMethod === 'NET_BANKING' && (
              <View style={styles.banksGrid}>
                {NET_BANKS.map((bank) => {
                  const isBankSelected = selectedBank === bank;
                  return (
                    <TouchableOpacity
                      key={bank}
                      style={[styles.bankPill, isBankSelected && styles.bankPillActive]}
                      onPress={() => setSelectedBank(bank)}
                      activeOpacity={0.8}
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
        </View>

        {/* ==================================================
            FINAL INVOICE SUMMARY
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Payment Details & Summary</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Test(s) Standard MRP Total</Text>
            <Text style={styles.invoiceValue}>₹{pricing?.mrpTotal || basePayable}</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={[styles.invoiceLabel, { color: '#059669' }]}>Diagnostic Partner Discount</Text>
            <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '700' }]}>
              - ₹{pricing?.totalSavings || 0}
            </Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceLabel, { color: '#2563EB' }]}>
                Coupon ({appliedCoupon?.code})
              </Text>
              <Text style={[styles.invoiceValue, { color: '#2563EB', fontWeight: '700' }]}>
                - ₹{couponDiscount}
              </Text>
            </View>
          )}

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Sample Handling / Clinical Disposables</Text>
            <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '700' }]}>FREE</Text>
          </View>

          <View style={styles.invoiceDivider} />

          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.finalTotalLabel}>Total Amount Payable</Text>
              <Text style={styles.finalTotalSub}>Inclusive of all GST & digital report delivery</Text>
            </View>
            <Text style={styles.finalTotalValue}>₹{finalPayable}</Text>
          </View>
        </View>

        {/* TRUST BANNER */}
        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <View style={styles.trustTextCol}>
            <Text style={styles.trustTitle}>100% Secure Encrypted Online Payment</Text>
            <Text style={styles.trustSub}>
              256-Bit SSL protection. Instant slot reservation with official NABL diagnostic centers.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ==================================================
          BOTTOM ACTION BAR
      ================================================== */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomTotalLabel}>Pay Online</Text>
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
                <Text style={styles.payButtonText}>Pay ₹{finalPayable}</Text>
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
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
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bottomBarInner: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    minWidth: 160,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  onlineOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onlineOnlyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  walletDetailsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletBalanceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  walletBalanceAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  walletShortfallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
  },
  walletShortfallText: {
    flex: 1,
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  walletSufficientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  walletSufficientText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  topUpBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topUpBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  upiDetailsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  upiAppsLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  upiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upiAppPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  upiAppPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  upiAppPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  upiAppPillTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  upiInputWrap: {
    marginTop: 12,
  },
  upiOrText: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  upiTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.text,
  },
  cardInputBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  cardInputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.text,
  },
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  finalTotalSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  finalTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  trustSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 15,
  },
  walletDetailsWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
  },
  walletBalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletBalText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  sufficientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  sufficientText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  walletPerkNote: {
    fontSize: 11,
    color: '#047857',
    marginTop: 6,
    fontWeight: '500',
  },
  walletLowBalNote: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '600',
  },
});

export default RadiologyPaymentScreen;
