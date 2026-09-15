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
  Platform,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';
import WebFooter from '../../../components/web/WebFooter';

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

const PAYMENT_METHODS = [
  { id: 'WALLET', label: 'MediUnify Wallet', icon: 'wallet-outline', desc: '1-Click • Zero OTP' },
  { id: 'UPI', label: 'UPI Fast Pay', icon: 'phone-portrait-outline', desc: 'Instant Transfer' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: 'card-outline', desc: 'Visa, Mastercard, RuPay' },
  { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline', desc: 'All Major Banks' },
  { id: 'COD', label: 'Cash on Delivery', icon: 'cash-outline', desc: 'Pay at Doorstep' },
];

const PaymentScreenWeb = ({ navigation, route }) => {
  const { cart, finalTotal, subtotal, deliveryFee, discountAmount, packagingFee, clearCart, addOrder, selectedAddress } =
    useCart();

  const passedOrderData = route?.params?.orderData;
  const payableAmount = route?.params?.amount || finalTotal || passedOrderData?.total || 499;

  const [selectedMethod, setSelectedMethod] = useState('WALLET');
  const [walletBalance, setWalletBalance] = useState(1250);

  useEffect(() => {
    (async () => {
      try {
        const bal = await AsyncStorage.getItem('@unnathi_wallet_balance');
        if (bal) setWalletBalance(parseInt(bal, 10) || 1250);
      } catch (e) {}
    })();
  }, []);

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

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(1);

  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const handlePayNow = () => {
    if (selectedMethod === 'WALLET') {
      if (walletBalance < payableAmount) {
        showAlert(
          'Insufficient Wallet Balance 💳',
          `Your MediUnify Wallet balance is ₹${walletBalance.toLocaleString('en-IN')}, but the payable amount is ₹${payableAmount.toLocaleString('en-IN')}.\n\nPlease top up or select another payment method.`,
          [
            { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet') },
            { text: 'Change Method', style: 'cancel' },
          ]
        );
        return;
      }
    }

    if (selectedMethod === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        showAlert('Invalid Card', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        showAlert('Invalid Expiry', 'Please enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        showAlert('Invalid CVV', 'Please enter a valid 3-digit CVV.');
        return;
      }
    }

    if (selectedMethod === 'UPI' && !selectedUpiApp && !upiId.trim()) {
      showAlert('UPI Required', 'Please select a UPI app or enter your UPI ID.');
      return;
    }

    setIsProcessing(true);
    setProcessStep(1);

    setTimeout(() => {
      setProcessStep(2);
      setTimeout(async () => {
        setProcessStep(3);

        const orderId = passedOrderData?.id || `UNC${Math.floor(10000 + Math.random() * 90000)}`;

        if (selectedMethod === 'WALLET') {
          const newBal = Math.max(0, walletBalance - payableAmount);
          setWalletBalance(newBal);
          try {
            await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
            const storedTx = await AsyncStorage.getItem('@unnathi_wallet_transactions');
            const existingTx = storedTx ? JSON.parse(storedTx) : [];
            const newTx = {
              id: `tx-${Date.now()}`,
              title: 'Paid via MediUnify Wallet',
              subtitle: `Order #${orderId} • Verified Payment`,
              amount: `-₹${payableAmount}`,
              type: 'debit',
              date: 'Just Now',
              icon: 'wallet-outline',
            };
            await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([newTx, ...existingTx]));
          } catch (e) {
            console.log('Error updating wallet:', e);
          }
        }

        let paymentLabel = 'Cash on Delivery (COD)';
        if (selectedMethod === 'WALLET') {
          paymentLabel = 'MediUnify Health Wallet';
        } else if (selectedMethod === 'UPI') {
          paymentLabel = `UPI (${selectedUpiApp ? selectedUpiApp.toUpperCase() : upiId})`;
        } else if (selectedMethod === 'CARD') {
          paymentLabel = `Card (Ending with ${cardNumber.slice(-4) || '4242'})`;
        } else if (selectedMethod === 'NETBANKING') {
          paymentLabel = `Net Banking (${selectedBank.toUpperCase()})`;
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
      {/* ===== PREMIUM NAVY HEADER (Matches Home Screen Design) ===== */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenterBlock}>
            <Text style={styles.headerTitle}>Secure Payment</Text>
            <View style={styles.headerSecureBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#00B894" />
              <Text style={styles.headerSecureText}>256-Bit SSL Encrypted</Text>
            </View>
          </View>
          <View style={styles.headerCartIcon}>
            <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ===== AMOUNT DUE HERO CARD ===== */}
        <View style={styles.amountHeroSection}>
          <View style={styles.amountHeroCard}>
            <View style={styles.amountHeroLeft}>
              <View style={styles.amountIconCircle}>
                <Ionicons name="receipt" size={22} color="#00B894" />
              </View>
              <View>
                <Text style={styles.amountHeroLabel}>Total Amount Payable</Text>
                <Text style={styles.amountHeroValue}>₹{payableAmount.toLocaleString('en-IN')}</Text>
                <Text style={styles.amountHeroSub}>Inclusive of all taxes & delivery charges</Text>
              </View>
            </View>
            <View style={styles.amountBestPriceBadge}>
              <Ionicons name="sparkles" size={13} color="#00B894" />
              <Text style={styles.amountBestPriceText}>Best Price{'\n'}Guaranteed</Text>
            </View>
          </View>

          {/* Trust Bar */}
          <View style={styles.trustStrip}>
            {[
              { icon: 'shield-checkmark', label: '100% Secure', color: '#00B894' },
              { icon: 'flash', label: 'Instant Confirm', color: '#EA580C' },
              { icon: 'card', label: 'Zero Surcharge', color: '#7C3AED' },
            ].map((t) => (
              <View key={t.label} style={styles.trustStripItem}>
                <Ionicons name={t.icon} size={15} color={t.color} />
                <Text style={styles.trustStripText}>{t.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== PAYMENT METHOD GRID ===== */}
        <View style={styles.methodSection}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodCard, selectedMethod === m.id && styles.methodCardActive]}
                onPress={() => setSelectedMethod(m.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIconCircle, selectedMethod === m.id && styles.methodIconCircleActive]}>
                  <Ionicons
                    name={m.icon}
                    size={22}
                    color={selectedMethod === m.id ? '#FFFFFF' : '#1E3A8A'}
                  />
                </View>
                <Text style={[styles.methodCardLabel, selectedMethod === m.id && styles.methodCardLabelActive]}>
                  {m.label}
                </Text>
                <Text style={[styles.methodCardDesc, selectedMethod === m.id && styles.methodCardDescActive]}>
                  {m.desc}
                </Text>
                {selectedMethod === m.id && (
                  <View style={styles.methodSelectedDot}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== PAYMENT DETAIL PANELS ===== */}
        <View style={styles.detailSection}>

          {/* WALLET */}
          {selectedMethod === 'WALLET' && (
            <View style={styles.detailPanel}>
              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderIcon}>
                  <Ionicons name="wallet" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.panelHeaderTitle}>MediUnify Health Wallet</Text>
                  <Text style={styles.panelHeaderSub}>1-Click Instant • Zero OTP Required</Text>
                </View>
              </View>

              <View style={styles.walletBalanceRow}>
                <View>
                  <Text style={styles.walletBalLabel}>Available Balance</Text>
                  <Text style={[
                    styles.walletBalAmount,
                    walletBalance < payableAmount && { color: '#EF4444' }
                  ]}>
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.walletTopUpBtn}
                  onPress={() => navigation.navigate('Wallet')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle" size={15} color="#FFFFFF" />
                  <Text style={styles.walletTopUpText}>Top Up</Text>
                </TouchableOpacity>
              </View>

              {walletBalance >= payableAmount ? (
                <View style={styles.walletSufficient}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.walletSufficientText}>
                    Sufficient balance. ₹{(walletBalance - payableAmount).toLocaleString('en-IN')} will remain after payment.
                  </Text>
                </View>
              ) : (
                <View style={styles.walletInsufficient}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={styles.walletInsufficientText}>
                    Insufficient balance. Please top up ₹{(payableAmount - walletBalance).toLocaleString('en-IN')} more.
                  </Text>
                </View>
              )}

              <View style={styles.walletPerkBox}>
                <Ionicons name="gift" size={16} color="#059669" />
                <Text style={styles.walletPerkText}>
                  Earn 5% MediCoins cashback on every wallet payment. Redeemable on future orders!
                </Text>
              </View>
            </View>
          )}

          {/* UPI */}
          {selectedMethod === 'UPI' && (
            <View style={styles.detailPanel}>
              <Text style={styles.panelSectionLabel}>Select UPI App</Text>
              <View style={styles.upiGrid}>
                {UPI_APPS.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.upiCard, selectedUpiApp === app.id && styles.upiCardActive]}
                    onPress={() => setSelectedUpiApp(app.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.upiIconCircle, { backgroundColor: app.color + '18' }]}>
                      <Ionicons name={app.icon} size={22} color={app.color} />
                    </View>
                    <Text style={[styles.upiCardLabel, selectedUpiApp === app.id && styles.upiCardLabelActive]}>
                      {app.name}
                    </Text>
                    {selectedUpiApp === app.id && (
                      <View style={styles.upiCheckMark}>
                        <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR ENTER UPI ID</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.upiInputRow}>
                <View style={styles.upiInputWrap}>
                  <Ionicons name="at" size={18} color="#64748B" />
                  <TextInput
                    style={styles.upiTextInput}
                    placeholder="yourname@bankname"
                    placeholderTextColor="#94A3B8"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                  />
                  {isUpiVerified && <Ionicons name="checkmark-circle" size={18} color="#059669" />}
                </View>
                <TouchableOpacity
                  style={styles.verifyUpiBtn}
                  onPress={() => { if (upiId.trim()) setIsUpiVerified(true); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.verifyUpiText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CARD */}
          {selectedMethod === 'CARD' && (
            <View style={styles.detailPanel}>
              {/* Virtual Card Preview */}
              <View style={styles.virtualCard}>
                <View style={styles.vCardTopRow}>
                  <Text style={styles.vCardBankLabel}>MEDIUNIFY SECURED</Text>
                  <Ionicons name="card" size={20} color="#38BDF8" />
                </View>
                <Text style={styles.vCardNumber}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.vCardBottomRow}>
                  <View>
                    <Text style={styles.vCardFieldLabel}>CARD HOLDER</Text>
                    <Text style={styles.vCardFieldValue}>{cardHolder || '––'}</Text>
                  </View>
                  <View>
                    <Text style={styles.vCardFieldLabel}>EXPIRES</Text>
                    <Text style={styles.vCardFieldValue}>{cardExpiry || 'MM/YY'}</Text>
                  </View>
                  <View>
                    <Text style={styles.vCardFieldLabel}>CVV</Text>
                    <Text style={styles.vCardFieldValue}>{cardCvv ? '•••' : '•••'}</Text>
                  </View>
                </View>
              </View>

              {/* Card Form */}
              <View style={styles.cardFormGrid}>
                <View style={styles.cardFormFull}>
                  <Text style={styles.cardFieldLabel}>Card Number</Text>
                  <View style={styles.cardInputWrap}>
                    <Ionicons name="card-outline" size={16} color="#64748B" />
                    <TextInput
                      style={styles.cardTextInput}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      maxLength={19}
                    />
                  </View>
                </View>
                <View style={styles.cardFormHalf}>
                  <Text style={styles.cardFieldLabel}>Expiry (MM/YY)</Text>
                  <View style={styles.cardInputWrap}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <TextInput
                      style={styles.cardTextInput}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={styles.cardFormHalf}>
                  <Text style={styles.cardFieldLabel}>CVV</Text>
                  <View style={styles.cardInputWrap}>
                    <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                    <TextInput
                      style={styles.cardTextInput}
                      placeholder="•••"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={(t) => setCardCvv(t.slice(0, 3))}
                      maxLength={3}
                    />
                  </View>
                </View>
                <View style={styles.cardFormFull}>
                  <Text style={styles.cardFieldLabel}>Cardholder Name</Text>
                  <View style={styles.cardInputWrap}>
                    <Ionicons name="person-outline" size={16} color="#64748B" />
                    <TextInput
                      style={styles.cardTextInput}
                      placeholder="Name on Card"
                      placeholderTextColor="#94A3B8"
                      value={cardHolder}
                      onChangeText={setCardHolder}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveCardRow}
                onPress={() => setSaveCard(!saveCard)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkBox, saveCard && styles.checkBoxActive]}>
                  {saveCard && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.saveCardText}>Securely save this card for faster future checkouts</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* NET BANKING */}
          {selectedMethod === 'NETBANKING' && (
            <View style={styles.detailPanel}>
              <Text style={styles.panelSectionLabel}>Select Your Bank</Text>
              {POPULAR_BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[styles.bankRow, selectedBank === bank.id && styles.bankRowActive]}
                  onPress={() => setSelectedBank(bank.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.bankCodeCircle, selectedBank === bank.id && styles.bankCodeCircleActive]}>
                    <Text style={[styles.bankCodeText, selectedBank === bank.id && { color: '#FFFFFF' }]}>
                      {bank.code.slice(0, 2)}
                    </Text>
                  </View>
                  <Text style={[styles.bankName, selectedBank === bank.id && styles.bankNameActive]}>
                    {bank.name}
                  </Text>
                  <View style={[styles.bankRadio, selectedBank === bank.id && styles.bankRadioActive]}>
                    {selectedBank === bank.id && <View style={styles.bankRadioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* COD */}
          {selectedMethod === 'COD' && (
            <View style={styles.detailPanel}>
              <View style={styles.codHero}>
                <View style={styles.codIconCircle}>
                  <Ionicons name="cash" size={36} color="#059669" />
                </View>
                <Text style={styles.codTitle}>Cash on Delivery</Text>
                <Text style={styles.codSubtitle}>
                  Pay in cash when your order arrives at your doorstep.{'\n'}No prepayment required.
                </Text>
              </View>
              <View style={styles.codPerks}>
                {[
                  { icon: 'checkmark-circle', text: 'No advance payment needed – pay when you receive' },
                  { icon: 'checkmark-circle', text: 'Exact change appreciated (delivery executives carry change)' },
                  { icon: 'checkmark-circle', text: 'Contactless payment via QR code also accepted at door' },
                ].map((p, i) => (
                  <View key={i} style={styles.codPerkRow}>
                    <Ionicons name={p.icon} size={15} color="#059669" />
                    <Text style={styles.codPerkText}>{p.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ===== PAY NOW BOTTOM SECTION ===== */}
        <View style={styles.paySection}>
          <View style={styles.paySectionCard}>
            <View style={styles.payAmountPreview}>
              <Text style={styles.payAmountLabel}>You Pay</Text>
              <Text style={styles.payAmountValue}>₹{payableAmount.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={handlePayNow}
              activeOpacity={0.88}
            >
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.payNowBtnText}>
                {selectedMethod === 'COD' ? 'Place COD Order' : `Pay ₹${payableAmount.toLocaleString('en-IN')} Now`}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.payDisclaimer}>
            🔒 Your payment is 100% secure and encrypted by Razorpay Payment Gateway
          </Text>
        </View>

        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ===== PROCESSING MODAL ===== */}
      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.processModal}>
            {processStep < 3 ? (
              <>
                <ActivityIndicator size="large" color="#00B894" />
                <Text style={styles.processTitle}>
                  {processStep === 1 ? '🔗 Connecting to Payment Gateway...' : '🔐 Authorizing Payment...'}
                </Text>
                <Text style={styles.processSub}>
                  {processStep === 1
                    ? 'Establishing a secure 256-bit encrypted tunnel'
                    : 'Verifying your credentials with the bank'}
                </Text>
                <View style={styles.processStepRow}>
                  {[1, 2, 3].map((s) => (
                    <View
                      key={s}
                      style={[styles.processDot, processStep >= s && styles.processDotActive]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                </View>
                <Text style={[styles.processTitle, { color: '#059669' }]}>Payment Successful! 🎉</Text>
                <Text style={styles.processSub}>Generating your order receipt...</Text>
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
    backgroundColor: '#F8FAFC',
  },

  // HEADER
  pageHeader: {
    backgroundColor: '#1E3A8A',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  pageHeaderInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSecureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  headerSecureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  headerCartIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    flexGrow: 1,
  },

  // AMOUNT HERO
  amountHeroSection: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  amountHeroCard: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  amountHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  amountIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,184,148,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,184,148,0.4)',
  },
  amountHeroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountHeroValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -1,
  },
  amountHeroSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    fontWeight: '500',
  },
  amountBestPriceBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,184,148,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,184,148,0.35)',
    gap: 4,
  },
  amountBestPriceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
    textAlign: 'center',
    lineHeight: 15,
  },
  trustStrip: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  trustStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustStripText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },

  // PAYMENT METHOD SECTION
  methodSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCard: {
    minWidth: 140,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  methodCardActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EEF2FF',
  },
  methodIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodIconCircleActive: {
    backgroundColor: '#1E3A8A',
  },
  methodCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  methodCardLabelActive: {
    color: '#1E3A8A',
  },
  methodCardDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 3,
  },
  methodCardDescActive: {
    color: '#64748B',
  },
  methodSelectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // DETAIL PANELS
  detailSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  detailPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  panelHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  panelHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  panelHeaderSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  panelSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // WALLET
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  walletBalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  walletBalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    marginTop: 3,
  },
  walletTopUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  walletTopUpText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  walletSufficient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  walletSufficientText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
    lineHeight: 17,
  },
  walletInsufficient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  walletInsufficientText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
    lineHeight: 17,
  },
  walletPerkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  walletPerkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
    lineHeight: 17,
  },

  // UPI
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  upiCard: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  upiCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#ECFDF5',
  },
  upiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  upiCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  upiCardLabelActive: {
    color: '#059669',
  },
  upiCheckMark: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  upiInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  upiTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    outlineStyle: 'none',
  },
  verifyUpiBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyUpiText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CARD
  virtualCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  vCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vCardBankLabel: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  vCardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 20,
  },
  vCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vCardFieldLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  vCardFieldValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  cardFormGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cardFormFull: {
    width: '100%',
  },
  cardFormHalf: {
    flex: 1,
    minWidth: 120,
  },
  cardFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    outlineStyle: 'none',
  },
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  saveCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },

  // NET BANKING
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  bankRowActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EEF2FF',
  },
  bankCodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCodeCircleActive: {
    backgroundColor: '#1E3A8A',
  },
  bankCodeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  bankName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  bankNameActive: {
    color: '#1E3A8A',
  },
  bankRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankRadioActive: {
    borderColor: '#1E3A8A',
  },
  bankRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E3A8A',
  },

  // COD
  codHero: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  codIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  codTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  codSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  codPerks: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codPerkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  codPerkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },

  // PAY SECTION
  paySection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  paySectionCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  payAmountPreview: {},
  payAmountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payAmountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  payNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00B894',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  payNowBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  payDisclaimer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },

  // PROCESSING MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  processModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  processTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E3A8A',
    marginTop: 16,
    textAlign: 'center',
  },
  processSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  processStepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  processDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  processDotActive: {
    backgroundColor: '#00B894',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

export default PaymentScreenWeb;
