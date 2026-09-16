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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fertilityDiagnosticTests } from '../../../data/fertilityData';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const PAYMENT_MODES = [
  {
    id: 'UPI',
    title: 'Instant Online UPI / Cards',
    sub: 'Google Pay, PhonePe, Paytm, Debit/Credit Card',
    icon: 'card-outline',
    badge: 'POPULAR',
    badgeColor: '#059669',
    badgeBg: '#ECFDF5',
  },
  {
    id: 'WALLET',
    title: 'MediUnify Health Wallet',
    sub: 'Instant 1-click payment (₹1,250 Balance)',
    icon: 'wallet-outline',
    badge: '1-CLICK',
    badgeColor: '#0F766E',
    badgeBg: '#F0FDFA',
  },
  {
    id: 'CENTRE_PAY',
    title: 'Pay at Diagnostic Counter',
    sub: 'Cash, UPI QR, or Card on arrival at centre',
    icon: 'business-outline',
    badge: 'PAY AT DESK',
    badgeColor: '#D97706',
    badgeBg: '#FFFBEB',
  },
];

const FertilityTestDetailsScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const test = route?.params?.test || fertilityDiagnosticTests[0];
  const autoOpenBooking = route?.params?.autoOpenBooking || false;

  const [bookingModalVisible, setBookingModalVisible] = useState(autoOpenBooking);
  const [patientName, setPatientName] = useState('Ananya Sharma');
  const [phone, setPhone] = useState('+91 98450 12345');
  const [preferredCentre, setPreferredCentre] = useState('Nova IVF Fertility Centre Lab, Gokulam');
  const [preferredDate, setPreferredDate] = useState('Tomorrow Morning (07:30 AM - 09:30 AM)');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmBooking = () => {
    if (!patientName.trim() || !phone.trim()) {
      showAlert('Required', 'Please fill in patient name and phone number.');
      return;
    }

    const payModeObj = PAYMENT_MODES.find((m) => m.id === selectedPaymentMode);
    const payModeTitle = payModeObj ? payModeObj.title : 'UPI';

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingModalVisible(false);

      let payStatusMsg = '';
      if (selectedPaymentMode === 'CENTRE_PAY') {
        payStatusMsg = `Payment: Pay ₹${test.price.toLocaleString('en-IN')} on arrival at the diagnostic centre desk.`;
      } else if (selectedPaymentMode === 'WALLET') {
        payStatusMsg = `Payment: ₹${test.price.toLocaleString('en-IN')} paid instantly via MediUnify Health Wallet.`;
      } else {
        payStatusMsg = `Payment: ₹${test.price.toLocaleString('en-IN')} paid online via UPI/Card. Transaction Ref: #UPI-${Date.now().toString().slice(-6)}.`;
      }

      showAlert(
        'Diagnostic Test Scheduled! 🧪',
        `Your test booking for "${test.name}" has been confirmed for ${preferredDate} at ${preferredCentre}.\n\n💳 ${payStatusMsg}\n\nToken: #LAB-FERT-${Math.floor(
          100 + Math.random() * 900
        )}.`
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Details</Text>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => showAlert('Share', `Sharing ${test.name}`)}
        >
          <Ionicons name="share-social-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catText}>{test.category}</Text>
            </View>
            <View style={styles.genderBadge}>
              <Text style={styles.genderText}>{test.targetGender}</Text>
            </View>
          </View>

          <Text style={styles.testName}>{test.name}</Text>
          <Text style={styles.testDesc}>{test.description}</Text>

          <View style={styles.pricingRow}>
            <View style={styles.priceWrap}>
              <Text style={styles.priceText}>₹{test.price.toLocaleString('en-IN')}</Text>
              {test.mrp && (
                <Text style={styles.mrpText}>₹{test.mrp.toLocaleString('en-IN')}</Text>
              )}
            </View>
            {test.discount && <Text style={styles.discBadge}>{test.discount}</Text>}
          </View>
        </View>

        {/* Preparation Guidelines */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preparation & Cycle Timing</Text>
          <View style={styles.prepBox}>
            <Ionicons name="information-circle" size={20} color="#E11D48" />
            <View style={styles.prepTextCol}>
              <Text style={styles.prepHead}>Important Instruction:</Text>
              <Text style={styles.prepBody}>{test.prepGuidelines}</Text>
            </View>
          </View>

          <View style={styles.specGrid}>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Fasting Protocol:</Text>
              <Text style={styles.specVal}>{test.fastingRequired}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Sample Type:</Text>
              <Text style={styles.specVal}>{test.sampleType}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Turnaround Time:</Text>
              <Text style={styles.specVal}>{test.tat}</Text>
            </View>
          </View>
        </View>

        {/* Why this test matters */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Clinical Value in Fertility</Text>
          <Text style={styles.clinicalValueText}>
            Accurate diagnostic assessment allows reproductive endocrinologists to titrate gonadotropin stimulation dosing, detect subclinical ovarian decline early, and evaluate sperm DNA integrity before planning IUI or IVF cycles.
          </Text>
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Test Fee</Text>
          <Text style={styles.bottomPrice}>₹{test.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => setBookingModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>Book Diagnostic Test</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Book Fertility Test</Text>
                <Text style={styles.modalSub}>{test.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBookingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Centre Visit Requirement Notice */}
              <View style={styles.centreNoticeBox}>
                <Ionicons name="business" size={18} color="#0F766E" />
                <View style={styles.centreNoticeContent}>
                  <Text style={styles.centreNoticeTitle}>Accredited Centre Visit Only</Text>
                  <Text style={styles.centreNoticeSub}>
                    To maintain strict ISO cleanroom standards, cold-chain stability, and laboratory precision, all fertility test samples are collected on-site at the accredited centre.
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Diagnostic Centre / Laboratory</Text>
              <View style={styles.centreSelectCard}>
                <Ionicons name="location" size={16} color="#0F766E" />
                <Text style={styles.centreSelectText}>{preferredCentre}</Text>
              </View>

              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput
                style={styles.modalInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Full name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="10-digit phone"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Preferred Date & Slot</Text>
              <TextInput
                style={styles.modalInput}
                value={preferredDate}
                onChangeText={setPreferredDate}
                placeholder="e.g. Tomorrow 08:00 AM"
                placeholderTextColor="#94A3B8"
              />

              {/* Payment Option Selection */}
              <Text style={styles.inputLabel}>Choose Payment Option</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_MODES.map((mode) => {
                  const isSelected = selectedPaymentMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.paymentOptionCard,
                        isSelected && styles.paymentOptionCardActive,
                      ]}
                      onPress={() => setSelectedPaymentMode(mode.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.paymentRadio, isSelected && styles.paymentRadioActive]}>
                        {isSelected && <View style={styles.paymentRadioDot} />}
                      </View>
                      <View style={styles.paymentOptionIconBox}>
                        <Ionicons
                          name={mode.icon}
                          size={18}
                          color={isSelected ? '#0F766E' : '#64748B'}
                        />
                      </View>
                      <View style={styles.paymentOptionInfo}>
                        <View style={styles.paymentTitleRow}>
                          <Text
                            style={[
                              styles.paymentOptionTitle,
                              isSelected && styles.paymentOptionTitleActive,
                            ]}
                          >
                            {mode.title}
                          </Text>
                          {mode.badge && (
                            <View style={[styles.payBadge, { backgroundColor: mode.badgeBg }]}>
                              <Text style={[styles.payBadgeText, { color: mode.badgeColor }]}>
                                {mode.badge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.paymentOptionSub} numberOfLines={1}>
                          {mode.sub}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Order Summary & Fee Breakdown */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumLabel}>Diagnostic Test Fee</Text>
                  <Text style={styles.sumVal}>₹{test.price.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumLabel}>Sample Prep & Cold-Chain Lab Consumables</Text>
                  <Text style={[styles.sumVal, { color: '#059669' }]}>FREE</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumLabel}>Selected Payment Method</Text>
                  <Text style={[styles.sumVal, { color: '#0F766E', fontWeight: '800' }]}>
                    {PAYMENT_MODES.find((m) => m.id === selectedPaymentMode)?.title || 'UPI'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.sumTotalRow]}>
                  <Text style={styles.sumTotalLabel}>Total Amount</Text>
                  <Text style={styles.sumTotalVal}>₹{test.price.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmBooking}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-closed" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>
                  {isSubmitting
                    ? 'Processing...'
                    : selectedPaymentMode === 'CENTRE_PAY'
                    ? `Book & Pay at Desk (₹${test.price.toLocaleString('en-IN')})`
                    : `Pay & Schedule (₹${test.price.toLocaleString('en-IN')})`}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  shareBtn: {
    padding: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  desktopContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  catBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  genderBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  testName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  testDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  mrpText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  prepBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 12,
  },
  prepTextCol: {
    flex: 1,
  },
  prepHead: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9F1239',
  },
  prepBody: {
    fontSize: 11,
    color: '#4C0519',
    marginTop: 2,
    lineHeight: 16,
  },
  specGrid: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 6,
  },
  specKey: {
    fontSize: 12,
    color: '#64748B',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  clinicalValueText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 19,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  bookBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  centreNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  centreNoticeContent: {
    flex: 1,
  },
  centreNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 2,
  },
  centreNoticeSub: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  centreSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  centreSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentMethodsWrap: {
    gap: 8,
    marginVertical: 4,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  paymentOptionCardActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor: '#0D9488',
  },
  paymentRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D9488',
  },
  paymentOptionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentOptionTitleActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  paymentOptionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  payBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  payBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sumLabel: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  sumVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  sumTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  sumTotalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sumTotalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F766E',
  },
  confirmBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
});

export default FertilityTestDetailsScreen;
