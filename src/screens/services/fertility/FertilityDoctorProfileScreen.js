import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { fertilitySpecialists } from '../../../data/fertilityData';
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
    id: 'CLINIC_PAY',
    title: 'Pay at Clinic Desk',
    sub: 'Cash, UPI QR, or Card on arrival for consultation',
    icon: 'business-outline',
    badge: 'PAY AT DESK',
    badgeColor: '#D97706',
    badgeBg: '#FFFBEB',
  },
];

const FertilityDoctorProfileScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const doctor = route?.params?.doctor || fertilitySpecialists[0];
  const autoOpenBooking = route?.params?.autoOpenBooking || false;

  const [bookingModalVisible, setBookingModalVisible] = useState(autoOpenBooking);
  const [selectedSlot, setSelectedSlot] = useState(doctor.slots[0] || '10:00 AM');
  const [consultType, setConsultType] = useState('In-Clinic'); // 'In-Clinic' | 'Video Call'
  const [patientName, setPatientName] = useState('Ananya & Ramesh');
  const [contactPhone, setContactPhone] = useState('+91 98450 12345');
  const [concernNotes, setConcernNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmBooking = () => {
    if (!patientName.trim()) {
      showAlert('Required', 'Please enter your name.');
      return;
    }
    if (!contactPhone.trim() || contactPhone.length < 10) {
      showAlert('Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingModalVisible(false);

      let payStatus = '';
      if (selectedPayment === 'CLINIC_PAY') {
        payStatus = `Payment: Pay ₹${doctor.fee} at the clinic reception desk on arrival.`;
      } else if (selectedPayment === 'WALLET') {
        payStatus = `Payment: ₹${doctor.fee} deducted instantly from MediUnify Health Wallet.`;
      } else {
        payStatus = `Payment: ₹${doctor.fee} paid online via UPI/Card. Ref #UPI-${Date.now().toString().slice(-6)}.`;
      }

      showAlert(
        'Consultation Confirmed! 🎉',
        `Your appointment with ${doctor.name} on ${selectedSlot} (${consultType}) has been booked.\n\n💳 ${payStatus}\n\nToken: #FERT-${Math.floor(
          100 + Math.random() * 900
        )}.`
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Specialist Profile</Text>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => showAlert('Share', `Sharing profile of ${doctor.name}`)}
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
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: doctor.image }} style={styles.docImg} />
          <View style={styles.profileHeaderCol}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{doctor.rating}</Text>
              <Text style={styles.reviewsCountText}>({doctor.reviewsCount} reviews)</Text>
            </View>
            <Text style={styles.docName}>{doctor.name}</Text>
            <Text style={styles.docSpecialty}>{doctor.specialty}</Text>
            <Text style={styles.qualificationText}>{doctor.qualification}</Text>

            <View style={styles.pillRow}>
              <View style={styles.highlightPill}>
                <Ionicons name="ribbon-outline" size={12} color="#E11D48" />
                <Text style={styles.highlightPillText}>{doctor.successRate}</Text>
              </View>
              <View style={styles.expPill}>
                <Text style={styles.expPillText}>{doctor.experienceYears}+ Years Exp</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Highlights Bar */}
        <View style={styles.highlightsBar}>
          <View style={styles.hlItem}>
            <Text style={styles.hlLabel}>Consult Fee</Text>
            <Text style={styles.hlVal}>₹{doctor.fee}</Text>
          </View>
          <View style={styles.hlDivider} />
          <View style={styles.hlItem}>
            <Text style={styles.hlLabel}>Languages</Text>
            <Text style={styles.hlVal}>{doctor.languages.join(', ')}</Text>
          </View>
          <View style={styles.hlDivider} />
          <View style={styles.hlItem}>
            <Text style={styles.hlLabel}>Next Available</Text>
            <Text style={[styles.hlVal, { color: '#059669' }]}>
              {doctor.availableToday ? 'Today' : 'Tomorrow'}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About Specialist</Text>
          <Text style={styles.aboutBody}>{doctor.about}</Text>
        </View>

        {/* Clinical Specializations */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Clinical Focus</Text>
          <View style={styles.specsGrid}>
            {doctor.specializations.map((spec, idx) => (
              <View key={idx} style={styles.specChip}>
                <Ionicons name="checkmark-circle" size={14} color="#E11D48" />
                <Text style={styles.specChipText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hospital & Clinic Affiliation */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Primary Clinic & Affiliations</Text>
          <View style={styles.clinicInfoBox}>
            <Ionicons name="business" size={20} color="#E11D48" />
            <View style={styles.clinicDetails}>
              <Text style={styles.clinicNameText}>{doctor.clinicName}</Text>
              <Text style={styles.clinicAddressText}>{doctor.clinicAddress}</Text>
            </View>
          </View>
          {doctor.hospitalAffiliations && (
            <View style={styles.affiliationsRow}>
              <Text style={styles.affilLabel}>Also Affiliated With: </Text>
              <Text style={styles.affilVal}>{doctor.hospitalAffiliations.join(' • ')}</Text>
            </View>
          )}
        </View>

        {/* Available Time Slots */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          <View style={styles.slotsGrid}>
            {doctor.slots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slotPill,
                  selectedSlot === slot && styles.slotPillSelected,
                ]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={selectedSlot === slot ? '#FFFFFF' : '#475569'}
                />
                <Text
                  style={[
                    styles.slotText,
                    selectedSlot === slot && styles.slotTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Confidentiality Notice */}
        <View style={styles.confidentialBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <Text style={styles.confidentialText}>
            100% Confidential Consultation. Discrete communication & billing guaranteed.
          </Text>
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomFeeLabel}>Consultation Fee</Text>
          <Text style={styles.bottomFee}>₹{doctor.fee}</Text>
        </View>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => setBookingModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar" size={16} color="#FFFFFF" />
          <Text style={styles.ctaBtnText}>Book Appointment</Text>
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
                <Text style={styles.modalTitle}>Book Consultation</Text>
                <Text style={styles.modalSub}>{doctor.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBookingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Mode Picker */}
              <Text style={styles.inputLabel}>Consultation Mode</Text>
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[styles.modeBtn, consultType === 'In-Clinic' && styles.modeBtnActive]}
                  onPress={() => setConsultType('In-Clinic')}
                >
                  <Ionicons
                    name="business-outline"
                    size={16}
                    color={consultType === 'In-Clinic' ? '#E11D48' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.modeBtnText,
                      consultType === 'In-Clinic' && styles.modeBtnTextActive,
                    ]}
                  >
                    In-Clinic Visit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, consultType === 'Video Call' && styles.modeBtnActive]}
                  onPress={() => setConsultType('Video Call')}
                >
                  <Ionicons
                    name="videocam-outline"
                    size={16}
                    color={consultType === 'Video Call' ? '#E11D48' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.modeBtnText,
                      consultType === 'Video Call' && styles.modeBtnTextActive,
                    ]}
                  >
                    Private Video Call
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Slot Selection */}
              <Text style={styles.inputLabel}>Select Appointment Slot</Text>
              <View style={styles.modalSlotsRow}>
                {doctor.slots.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.modalSlotPill, selectedSlot === s && styles.modalSlotPillActive]}
                    onPress={() => setSelectedSlot(s)}
                  >
                    <Text
                      style={[
                        styles.modalSlotText,
                        selectedSlot === s && styles.modalSlotTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Patient Demographics */}
              <Text style={styles.inputLabel}>Patient / Couple Name</Text>
              <TextInput
                style={styles.modalInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="e.g. Ananya & Ramesh"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Confidential Mobile Number</Text>
              <TextInput
                style={styles.modalInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                placeholder="10-digit phone number"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Brief Notes / Concerns (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={concernNotes}
                onChangeText={setConcernNotes}
                multiline
                numberOfLines={3}
                placeholder="e.g. Trying to conceive for 18 months, previous IUI..."
                placeholderTextColor="#94A3B8"
              />

              {/* Choose Payment Option */}
              <Text style={styles.inputLabel}>Choose Payment Option</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_MODES.map((mode) => {
                  const isSelected = selectedPayment === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.paymentOptionCard,
                        isSelected && styles.paymentOptionCardActive,
                      ]}
                      onPress={() => setSelectedPayment(mode.id)}
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

              {/* Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumLabel}>Doctor Consultation Fee</Text>
                  <Text style={styles.sumVal}>₹{doctor.fee}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumLabel}>HIPAA Vault & Video Encryption</Text>
                  <Text style={[styles.sumVal, { color: '#059669' }]}>FREE</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.sumLabel}>Payment Method</Text>
                  <Text style={[styles.sumVal, { color: '#0F766E', fontWeight: '800' }]}>
                    {PAYMENT_MODES.find((m) => m.id === selectedPayment)?.title || 'UPI'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.sumTotalRow]}>
                  <Text style={styles.sumTotalLabel}>Total Payable</Text>
                  <Text style={styles.sumTotalVal}>₹{doctor.fee}</Text>
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
                    : selectedPayment === 'CLINIC_PAY'
                    ? `Book & Pay at Desk (₹${doctor.fee})`
                    : `Pay & Confirm (₹${doctor.fee})`}
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
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
    marginBottom: 14,
  },
  docImg: {
    width: 90,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  profileHeaderCol: {
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewsCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  docName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  docSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E11D48',
    marginTop: 2,
  },
  qualificationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  highlightPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  expPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  expPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  highlightsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  hlItem: {
    alignItems: 'center',
  },
  hlLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  hlVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  hlDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  aboutBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 19,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  clinicInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 10,
  },
  clinicDetails: {
    flex: 1,
  },
  clinicNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
  },
  clinicAddressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  affiliationsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  affilLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  affilVal: {
    fontSize: 11,
    color: '#0F172A',
    flex: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  slotPillSelected: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  slotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confidentialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  confidentialText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
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
  bottomPriceCol: {},
  bottomFeeLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  bottomFee: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  ctaBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaBtnText: {
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
    marginTop: 2,
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
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeBtnTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  modalSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSlotPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  modalSlotPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  modalSlotText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  modalSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    minHeight: 65,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sumLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sumVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sumTotalRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  sumTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sumTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E11D48',
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
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
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
    borderColor: '#E11D48',
  },
  paymentRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E11D48',
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
    color: '#E11D48',
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
  confirmBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default FertilityDoctorProfileScreen;
