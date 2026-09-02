import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'logo-google', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', icon: 'flash', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm UPI', icon: 'wallet', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'qr-code', color: '#00529C' },
  { id: 'cred', name: 'CRED Pay', icon: 'shield-checkmark', color: '#1A1A1A' },
];

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
  { id: 'kotak', name: 'Kotak Mahindra', code: 'KOTAK' },
];

const PaymentScreen = ({ navigation, route }) => {
  const { cart, finalTotal, subtotal, deliveryFee, discountAmount, packagingFee, clearCart, addOrder, selectedAddress } =
    useCart();

  const passedOrderData = route?.params?.orderData;
  const payableAmount = route?.params?.amount || finalTotal || passedOrderData?.total || 499;

  // Selected Category
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // 'UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD'

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(selectedAddress?.name || 'Ramesh Kumar');
  const [saveCard, setSaveCard] = useState(true);

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Wallet State
  const [selectedWallet, setSelectedWallet] = useState('amazon');

  // Processing & Simulation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(1); // 1: Contacting gateway, 2: Authorizing, 3: Success

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Process Payment Execution
  const handlePayNow = () => {
    // Basic validations
    if (selectedMethod === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid 3-digit CVV.');
        return;
      }
    }

    if (selectedMethod === 'UPI' && !selectedUpiApp && !upiId.trim()) {
      Alert.alert('UPI Required', 'Please select a UPI app or enter your UPI ID.');
      return;
    }

    setIsProcessing(true);
    setProcessStep(1);

    setTimeout(() => {
      setProcessStep(2); // Authorizing
      setTimeout(async () => {
        setProcessStep(3); // Success tick

        const orderId = passedOrderData?.id || `UNC${Math.floor(10000 + Math.random() * 90000)}`;

        let paymentLabel = 'Cash on Delivery (COD)';
        if (selectedMethod === 'UPI') {
          paymentLabel = `UPI (${selectedUpiApp ? selectedUpiApp.toUpperCase() : upiId})`;
        } else if (selectedMethod === 'CARD') {
          paymentLabel = `Card (Ending with ${cardNumber.slice(-4) || '4242'})`;
        } else if (selectedMethod === 'NETBANKING') {
          paymentLabel = `Net Banking (${selectedBank.toUpperCase()})`;
        } else if (selectedMethod === 'WALLET') {
          paymentLabel = `Wallet (${selectedWallet.toUpperCase()})`;
        }

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
          paymentMethod: paymentLabel,
          paymentStatus: selectedMethod === 'COD' ? 'Pay on Delivery' : 'Paid Online (Verified)',
          total: payableAmount,
          subtotal: passedOrderData?.subtotal || subtotal,
          deliveryFee: passedOrderData?.deliveryFee !== undefined ? passedOrderData.deliveryFee : deliveryFee,
          discountAmount: passedOrderData?.discountAmount || discountAmount,
          items: passedOrderData?.items || cart.map((i) => ({
            id: i.id,
            name: i.name,
            brand: i.brand,
            price: i.price,
            quantity: i.quantity,
          })),
          address: passedOrderData?.address || selectedAddress,
          prescriptionAttached: passedOrderData?.prescriptionAttached || null,
          deliverySlot: 'Express Delivery (30 - 45 mins)',
        };

        await addOrder(newOrder);
        clearCart();

        setTimeout(() => {
          setIsProcessing(false);
          navigation.replace('OrderSuccess', { order: newOrder });
        }, 1200);
      }, 1400);
    }, 1200);
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
          <Text style={styles.headerTitle}>Select Payment Option</Text>
          <Text style={styles.headerSubtitle}>256-Bit SSL Encrypted & Secure</Text>
        </View>

        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#00B894" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TOTAL PAYABLE AMOUNT CARD */}
        <View style={styles.amountCard}>
          <View style={styles.amountLeft}>
            <Text style={styles.amountLabel}>Total Amount Payable</Text>
            <Text style={styles.amountValue}>₹{payableAmount}</Text>
          </View>
          <View style={styles.amountRight}>
            <View style={styles.savingsTag}>
              <Ionicons name="sparkles" size={12} color="#00B894" />
              <Text style={styles.savingsTagText}>Best Price Guaranteed</Text>
            </View>
          </View>
        </View>

        {/* PAYMENT METHOD TABS */}
        <Text style={styles.sectionTitle}>Payment Categories</Text>
        <View style={styles.methodSelectorRow}>
          {[
            { id: 'UPI', label: 'UPI Fast Pay', icon: 'phone-portrait-outline' },
            { id: 'CARD', label: 'Cards', icon: 'card-outline' },
            { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline' },
            { id: 'COD', label: 'Cash on Delivery', icon: 'cash-outline' },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodTab, selectedMethod === m.id && styles.methodTabActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedMethod(m.id)}
            >
              <Ionicons
                name={m.icon}
                size={18}
                color={selectedMethod === m.id ? colors.white : colors.secondary}
              />
              <Text
                style={[styles.methodTabText, selectedMethod === m.id && styles.methodTabTextActive]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 1. UPI SECTION */}
        {selectedMethod === 'UPI' && (
          <View style={styles.paymentBox}>
            <Text style={styles.boxTitle}>Instant UPI Apps</Text>
            <View style={styles.upiGrid}>
              {UPI_APPS.map((app) => {
                const isSelected = selectedUpiApp === app.id;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.upiCard, isSelected && styles.upiCardSelected]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedUpiApp(app.id);
                      setUpiId('');
                    }}
                  >
                    <View style={[styles.upiIconWrap, { backgroundColor: `${app.color}18` }]}>
                      <Ionicons name={app.icon} size={22} color={app.color} />
                    </View>
                    <Text style={styles.upiName}>{app.name}</Text>
                    {isSelected && (
                      <View style={styles.upiCheckCircle}>
                        <Ionicons name="checkmark" size={10} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.boxTitle}>Or Enter Any UPI ID / VPA</Text>
            <View style={styles.upiInputRow}>
              <TextInput
                style={styles.upiInput}
                placeholder="e.g. mobile@upi, name@okhdfcbank"
                placeholderTextColor={colors.slate}
                value={upiId}
                onChangeText={(t) => {
                  setUpiId(t);
                  setSelectedUpiApp(null);
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.verifyUpiBtn}
                onPress={() => {
                  if (!upiId.includes('@')) {
                    Alert.alert('Invalid UPI ID', 'Please enter a valid UPI address (e.g. user@okhdfcbank).');
                    return;
                  }
                  setIsUpiVerified(true);
                  Alert.alert('UPI Verified! ✅', 'Verified Account: Ramesh Kumar');
                }}
              >
                <Text style={styles.verifyUpiText}>{isUpiVerified ? 'Verified' : 'Verify'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. CARD SECTION */}
        {selectedMethod === 'CARD' && (
          <View style={styles.paymentBox}>
            {/* VIRTUAL CREDIT CARD PREVIEW */}
            <View style={styles.virtualCard}>
              <View style={styles.vCardTop}>
                <Text style={styles.vCardBank}>UNNATHI SECURE PAY</Text>
                <Ionicons name="card" size={24} color={colors.white} />
              </View>
              <Text style={styles.vCardNumber}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.vCardBottom}>
                <View>
                  <Text style={styles.vCardLabel}>CARD HOLDER</Text>
                  <Text style={styles.vCardValue}>{cardHolder || 'RAMESH KUMAR'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.vCardLabel}>EXPIRES</Text>
                  <Text style={styles.vCardValue}>{cardExpiry || 'MM/YY'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Card Number *</Text>
            <View style={styles.cardInputWrap}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
              <TextInput
                style={styles.cardTextInput}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.slate}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Expiry Date *</Text>
                <View style={styles.cardInputWrap}>
                  <TextInput
                    style={styles.cardTextInput}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.slate}
                    value={cardExpiry}
                    onChangeText={handleExpiryChange}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>CVV *</Text>
                <View style={styles.cardInputWrap}>
                  <TextInput
                    style={styles.cardTextInput}
                    placeholder="123"
                    placeholderTextColor={colors.slate}
                    value={cardCvv}
                    onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                  />
                  <Ionicons name="lock-closed" size={14} color={colors.slate} />
                </View>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Name on Card</Text>
            <View style={styles.cardInputWrap}>
              <TextInput
                style={styles.cardTextInput}
                placeholder="Ramesh Kumar"
                placeholderTextColor={colors.slate}
                value={cardHolder}
                onChangeText={setCardHolder}
              />
            </View>
          </View>
        )}

        {/* 3. NET BANKING SECTION */}
        {selectedMethod === 'NETBANKING' && (
          <View style={styles.paymentBox}>
            <Text style={styles.boxTitle}>Popular Net Banking Banks</Text>
            {POPULAR_BANKS.map((b) => {
              const isSelected = selectedBank === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.bankRow, isSelected && styles.bankRowSelected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedBank(b.id)}
                >
                  <View style={styles.bankIconCircle}>
                    <Text style={styles.bankCodeText}>{b.code.slice(0, 3)}</Text>
                  </View>
                  <Text style={styles.bankNameText}>{b.name}</Text>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? colors.primary : colors.slate}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 4. CASH ON DELIVERY SECTION */}
        {selectedMethod === 'COD' && (
          <View style={styles.paymentBox}>
            <View style={styles.codHero}>
              <View style={styles.codIconCircle}>
                <Ionicons name="cash" size={32} color="#00B894" />
              </View>
              <Text style={styles.codTitle}>Pay at Your Doorstep</Text>
              <Text style={styles.codSub}>
                You can pay using Cash, or scan the delivery agent's UPI QR code (Google Pay, PhonePe, Paytm) upon arrival.
              </Text>
            </View>

            <View style={styles.codPerksRow}>
              <View style={styles.codPerk}>
                <Ionicons name="checkmark-circle" size={16} color="#00B894" />
                <Text style={styles.codPerkText}>No advance payment needed</Text>
              </View>
              <View style={styles.codPerk}>
                <Ionicons name="shield-checkmark" size={16} color="#00B894" />
                <Text style={styles.codPerkText}>Verified delivery OTP verification</Text>
              </View>
            </View>
          </View>
        )}

        {/* TRUST BADGES */}
        <View style={styles.trustBanner}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.trustText}>RBI Approved Gateway</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={16} color={colors.primary} />
            <Text style={styles.trustText}>100% Secure Payment</Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* BOTTOM FIXED PAY ACTION */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomPriceLabel}>Amount to Pay</Text>
          <Text style={styles.bottomPriceValue}>₹{payableAmount}</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          activeOpacity={0.85}
          onPress={handlePayNow}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color={colors.white} />
              <Text style={styles.payBtnText}>
                {selectedMethod === 'COD' ? 'Confirm Booking (COD)' : `Pay ₹${payableAmount} Securely`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* PAYMENT PROCESSING SIMULATION MODAL */}
      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.processOverlay}>
          <View style={styles.processModal}>
            {processStep === 1 && (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processTitle}>Connecting to Bank Server...</Text>
                <Text style={styles.processSubtitle}>Securing 256-bit encrypted gateway</Text>
              </>
            )}

            {processStep === 2 && (
              <>
                <ActivityIndicator size="large" color="#00B894" />
                <Text style={styles.processTitle}>Authorizing ₹{payableAmount}...</Text>
                <Text style={styles.processSubtitle}>Please do not press back or close the app</Text>
              </>
            )}

            {processStep === 3 && (
              <>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={38} color={colors.white} />
                </View>
                <Text style={[styles.processTitle, { color: '#00B894' }]}>Payment Successful!</Text>
                <Text style={styles.processSubtitle}>Generating order receipt & booking medicines...</Text>
              </>
            )}
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
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#00B894',
    fontWeight: '700',
  },
  secureBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  amountCard: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountLeft: {},
  amountLabel: {
    color: '#A5F3FC',
    fontSize: 11,
    fontWeight: '700',
  },
  amountValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  amountRight: {},
  savingsTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingsTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 10,
  },
  methodSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  methodTab: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  methodTabTextActive: {
    color: colors.white,
    fontWeight: '900',
  },
  paymentBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 12,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  upiCard: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFB',
    position: 'relative',
  },
  upiCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF8',
  },
  upiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  upiName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  upiCheckCircle: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 14,
  },
  upiInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  verifyUpiBtn: {
    backgroundColor: '#E8F7F4',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B3EFE6',
  },
  verifyUpiText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
  },
  virtualCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  vCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vCardBank: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  vCardNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 16,
  },
  vCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vCardLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '800',
  },
  vCardValue: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '700',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 12,
  },
  bankRowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF8',
  },
  bankIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCodeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
  },
  bankNameText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  codHero: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  codIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  codTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
  },
  codSub: {
    fontSize: 11,
    color: colors.slate,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  codPerksRow: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  codPerk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codPerkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  trustBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate,
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
  payBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  processOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  processModal: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  processSubtitle: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 6,
    textAlign: 'center',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PaymentScreen;
