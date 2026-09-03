import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import {
  nursingDurations,
  nursingPurposes,
  certifiedNurses,
} from '../../../data/nurseCareData';

const NurseBookingScreen = ({ navigation }) => {
  // Step 1: Duration
  const [selectedDurationId, setSelectedDurationId] = useState('day-1');

  // Step 2: Purpose & Description
  const [selectedPurposes, setSelectedPurposes] = useState(['Post-Surgery Recovery']);
  const [careDescription, setCareDescription] = useState('');

  // Step 3: Patient Details
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientRelation, setPatientRelation] = useState('Self');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [patientAddress, setPatientAddress] = useState('House #142, 5th Cross, Kuvempunagar, Mysore');
  const [startDate, setStartDate] = useState('Today, Immediate');
  const [preferredTime, setPreferredTime] = useState('Morning (8:00 AM)');

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Card' | 'PayOnArrival'
  const [upiApp, setUpiApp] = useState('Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);

  // Success Confirmation Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim()) {
        setPatientName(storedName.trim());
      }
      const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      if (savedLoc && savedLoc.trim()) {
        setPatientAddress(savedLoc.trim());
      }

      // Check if family profile is active
      const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        if (parsed.name) {
          setPatientName(parsed.name);
          setPatientRelation(parsed.relation || 'Self');
        }
      }
    } catch (e) {
      console.log('Error loading patient info:', e);
    }
  };

  const selectedDuration = useMemo(() => {
    return (
      nursingDurations.find((d) => d.id === selectedDurationId) ||
      nursingDurations[0]
    );
  }, [selectedDurationId]);

  // LIVE PRICE CALCULATION
  const priceCalculation = useMemo(() => {
    const base = selectedDuration.basePrice;
    const gst = Math.round(base * 0.18);
    const total = base + gst;

    return {
      base,
      gst,
      total,
      totalFormatted: `₹${total.toLocaleString('en-IN')}`,
      baseFormatted: `₹${base.toLocaleString('en-IN')}`,
      gstFormatted: `₹${gst.toLocaleString('en-IN')}`,
    };
  }, [selectedDuration]);

  const togglePurpose = (purpose) => {
    if (selectedPurposes.includes(purpose)) {
      if (selectedPurposes.length === 1) {
        Alert.alert('Required', 'Please select at least 1 nursing care requirement.');
        return;
      }
      setSelectedPurposes(selectedPurposes.filter((p) => p !== purpose));
    } else {
      setSelectedPurposes([...selectedPurposes, purpose]);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!patientName.trim()) {
      Alert.alert('Incomplete Form', 'Please enter patient full name.');
      return;
    }
    if (!patientPhone.trim()) {
      Alert.alert('Incomplete Form', 'Please enter contact phone number.');
      return;
    }
    if (!patientAddress.trim()) {
      Alert.alert('Incomplete Form', 'Please enter home visit address.');
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const bookingId = `NURSE-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const assignedNurse = certifiedNurses[Math.floor(Math.random() * certifiedNurses.length)];

        const bookingRecord = {
          id: bookingId,
          bookingId,
          serviceName: `Home Nurse Care (${selectedDuration.durationText})`,
          duration: selectedDuration.durationText,
          purposes: selectedPurposes,
          description: careDescription.trim() || 'General post-op & vital monitoring support.',
          patient: {
            name: patientName,
            relation: patientRelation,
            age: patientAge,
            gender: patientGender,
            phone: patientPhone,
            address: patientAddress,
          },
          schedule: {
            startDate,
            preferredTime,
          },
          assignedNurse: {
            name: assignedNurse.name,
            qualification: assignedNurse.qualification,
            experience: assignedNurse.experience,
            phone: '+91 98765 12345',
          },
          payment: {
            method: paymentMethod,
            amount: priceCalculation.totalFormatted,
            status: paymentMethod === 'PayOnArrival' ? 'Pending (Pay on Arrival)' : 'Paid Online (Verified)',
          },
          bookedAt: new Date().toLocaleString('en-IN'),
          status: 'Confirmed & Nurse Assigned',
        };

        const existing = await AsyncStorage.getItem('@unnathi_nurse_bookings');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(bookingRecord);
        await AsyncStorage.setItem('@unnathi_nurse_bookings', JSON.stringify(list));

        setIsProcessing(false);
        setConfirmedBooking(bookingRecord);
        setSuccessModalVisible(true);
      } catch (e) {
        setIsProcessing(false);
        console.log('Error saving nurse booking:', e);
        Alert.alert('Booking Error', 'Could not complete booking. Please try again.');
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Book Home Nurse</Text>
          <Text style={styles.headerSubtitle}>
            Certified & Verified Nurses (1 Hr, 12 Hrs, 1-30 Days)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.helplineBtn}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('tel:+918212568888')}
        >
          <Ionicons name="call" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            BENEFIT / TRUST BANNER
        ================================================== */}
        <View style={styles.trustBanner}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.trustText}>INC / KSNC Registered Nurses</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="time" size={16} color="#059669" />
            <Text style={styles.trustText}>Arrival in 45-60 Mins</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="medkit" size={16} color={colors.secondary} />
            <Text style={styles.trustText}>Sterile Kits & BP Kit Included</Text>
          </View>
        </View>

        {/* ==================================================
            SECTION 1: SELECT DURATION & SHIFT
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Select Care Duration</Text>
              <Text style={styles.sectionSub}>
                Choose hourly visit, 12-hr shift, or full day/multi-day care
              </Text>
            </View>
          </View>

          <View style={styles.durationsWrap}>
            {nursingDurations.map((dur) => {
              const isSelected = selectedDurationId === dur.id;
              return (
                <TouchableOpacity
                  key={dur.id}
                  style={[
                    styles.durationCard,
                    isSelected && styles.durationCardActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedDurationId(dur.id)}
                >
                  <View style={styles.durationCardTop}>
                    <View
                      style={[
                        styles.durationBadge,
                        isSelected && styles.durationBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationBadgeText,
                          isSelected && styles.durationBadgeTextActive,
                        ]}
                      >
                        {dur.badge}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.durationPrice,
                        isSelected && styles.durationPriceActive,
                      ]}
                    >
                      ₹{dur.basePrice.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.durationLabel,
                      isSelected && styles.durationLabelActive,
                    ]}
                  >
                    {dur.label}
                  </Text>
                  <Text
                    style={[
                      styles.durationDesc,
                      isSelected && styles.durationDescActive,
                    ]}
                  >
                    {dur.description}
                  </Text>

                  {isSelected && (
                    <View style={styles.selectedCheckRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={styles.selectedCheckText}>Selected Package</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ==================================================
            SECTION 2: NURSING PURPOSE & CARE DESCRIPTION
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Nursing Purpose & Requirements</Text>
              <Text style={styles.sectionSub}>
                What is the primary reason for appointing the nurse?
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Select Requirement Tags:</Text>
          <View style={styles.purposesWrap}>
            {nursingPurposes.map((p) => {
              const isSelected = selectedPurposes.includes(p.label);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.purposeChip,
                    isSelected && styles.purposeChipActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => togglePurpose(p.label)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : p.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.purposeChipText,
                      isSelected && styles.purposeChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DETAILED DESCRIPTION BOX */}
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            Detailed Care Description & Patient Condition:
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="e.g. Patient underwent knee surgery. Needs assistance with wound dressing, IV drip administration, mobility support, and vital signs monitoring every 4 hours..."
            placeholderTextColor="#94A3B8"
            value={careDescription}
            onChangeText={setCareDescription}
          />
        </View>

        {/* ==================================================
            SECTION 3: PATIENT & VISIT DETAILS
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Patient & Home Address</Text>
              <Text style={styles.sectionSub}>
                Where should the certified nurse arrive?
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Patient Full Name:</Text>
          <TextInput
            style={styles.textInput}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Patient full name"
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Relation:</Text>
              <TextInput
                style={styles.textInput}
                value={patientRelation}
                onChangeText={setPatientRelation}
                placeholder="Self / Father / Mother"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fieldLabel}>Age & Gender:</Text>
              <TextInput
                style={styles.textInput}
                value={`${patientAge} Yrs, ${patientGender}`}
                onChangeText={(text) => {
                  const parts = text.split(',');
                  setPatientAge(parts[0] || '32');
                  if (parts[1]) setPatientGender(parts[1].trim());
                }}
                placeholder="Age, Gender"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Contact Phone Number:</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="phone-pad"
            value={patientPhone}
            onChangeText={setPatientPhone}
            placeholder="Mobile number for nurse contact"
          />

          <Text style={styles.fieldLabel}>Home Visit Address & Landmark:</Text>
          <TextInput
            style={[styles.textInput, { height: 55 }]}
            multiline
            value={patientAddress}
            onChangeText={setPatientAddress}
            placeholder="Complete street address, flat number, landmark"
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Start Date:</Text>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="e.g. Today / Tomorrow"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fieldLabel}>Preferred Shift / Time:</Text>
              <TextInput
                style={styles.textInput}
                value={preferredTime}
                onChangeText={setPreferredTime}
                placeholder="Morning 8 AM / Night 8 PM"
              />
            </View>
          </View>
        </View>

        {/* ==================================================
            SECTION 4: PAYMENT METHOD & PRICE SUMMARY
        ================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Payment & Checkout</Text>
              <Text style={styles.sectionSub}>
                Instant digital payment or Pay on Nurse Arrival
              </Text>
            </View>
          </View>

          {/* PAYMENT METHOD CHOICES */}
          <View style={styles.paymentOptionsWrap}>
            {[
              { id: 'UPI', label: 'UPI (GPay / PhonePe)', icon: 'phone-portrait-outline' },
              { id: 'Card', label: 'Debit / Credit Card', icon: 'card-outline' },
              { id: 'PayOnArrival', label: 'Pay on Nurse Arrival', icon: 'cash-outline' },
            ].map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOptionCard,
                    isSelected && styles.paymentOptionCardActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon}
                    size={17}
                    color={isSelected ? colors.primary : colors.slate}
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      isSelected && styles.paymentOptionTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRICE BREAKDOWN BOX */}
          <View style={styles.billBox}>
            <Text style={styles.billBoxTitle}>Payment Breakdown</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>
                {selectedDuration.label} Base Charge:
              </Text>
              <Text style={styles.billVal}>{priceCalculation.baseFormatted}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>
                Sterile Medical PPE Kit & Consumables:
              </Text>
              <Text style={[styles.billVal, { color: '#059669' }]}>FREE</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>GST & Service Tax (18%):</Text>
              <Text style={styles.billVal}>{priceCalculation.gstFormatted}</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>Total Amount Payable:</Text>
              <Text style={styles.billTotalVal}>{priceCalculation.totalFormatted}</Text>
            </View>
          </View>

          {/* CONFIRM & PAY CTA */}
          <TouchableOpacity
            style={styles.confirmPayBtn}
            activeOpacity={0.88}
            onPress={handleConfirmAndPay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.confirmPayBtnText}>
                  {paymentMethod === 'PayOnArrival'
                    ? `Confirm Booking (${priceCalculation.totalFormatted})`
                    : `Pay ${priceCalculation.totalFormatted} & Book Nurse`}
                </Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ==================================================
          SUCCESS CONFIRMATION MODAL
      ================================================== */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Home Nurse Booked!</Text>
            <Text style={styles.successSub}>
              A certified home nurse has been assigned to your patient and will arrive on schedule.
            </Text>

            {/* ORDER SUMMARY */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID:</Text>
                <Text style={styles.summaryVal}>{confirmedBooking?.bookingId}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryVal}>{confirmedBooking?.duration}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Patient:</Text>
                <Text style={styles.summaryVal}>
                  {confirmedBooking?.patient.name} ({confirmedBooking?.patient.relation})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Assigned Nurse:</Text>
                <Text style={[styles.summaryVal, { color: colors.primary, fontWeight: '800' }]}>
                  {confirmedBooking?.assignedNurse.name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment:</Text>
                <Text style={[styles.summaryVal, { color: '#059669' }]}>
                  {confirmedBooking?.payment.amount} ({confirmedBooking?.payment.status})
                </Text>
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <TouchableOpacity
              style={styles.nurseCallBtn}
              activeOpacity={0.88}
              onPress={() => Linking.openURL('tel:+919876512345')}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.nurseCallBtnText}>Call Assigned Nurse Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.doneBtnText}>Back to Home Screen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
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
    marginRight: 8,
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
  helplineBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // TRUST BANNER
  trustBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    flex: 1,
    minWidth: '46%',
  },
  trustText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.secondary,
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // DURATIONS
  durationsWrap: {
    gap: 8,
  },
  durationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  durationCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.primary,
  },
  durationCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationBadgeActive: {
    backgroundColor: colors.lightTeal,
  },
  durationBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.slate,
    letterSpacing: 0.5,
  },
  durationBadgeTextActive: {
    color: colors.primary,
  },
  durationPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  durationPriceActive: {
    color: colors.primary,
  },
  durationLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  durationLabelActive: {
    color: colors.secondary,
  },
  durationDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  durationDescActive: {
    color: '#065F46',
  },
  selectedCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  selectedCheckText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  // PURPOSES
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 6,
    marginTop: 4,
  },
  purposesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  purposeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  purposeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  purposeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  purposeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    height: 75,
    fontSize: 12,
    color: colors.text,
    textAlignVertical: 'top',
  },

  // PATIENT FORM
  formRow: {
    flexDirection: 'row',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 12.5,
    color: colors.text,
    marginBottom: 8,
  },

  // PAYMENT OPTIONS
  paymentOptionsWrap: {
    gap: 6,
    marginBottom: 12,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  paymentOptionCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.primary,
  },
  paymentOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  paymentOptionTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // BILL BOX
  billBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 6,
  },
  billBoxTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  billVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  billTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },

  // CONFIRM & PAY BUTTON
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  confirmPayBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // SUCCESS MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    maxWidth: '65%',
  },
  nurseCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 8,
  },
  nurseCallBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doneBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default NurseBookingScreen;
