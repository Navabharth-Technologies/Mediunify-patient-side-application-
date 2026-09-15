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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../../utils/alert';
import {
  fertilitySpecialists,
  fertilityTreatments,
  partnerFertilityCenters,
  emiPlans,
  fertilityFaqs,
} from '../../../data/fertilityData';
import WebFooter from '../../../components/web/WebFooter';

const FertilityIvfScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  // Tabs: 'TREATMENTS' | 'DOCTORS' | 'CENTERS' | 'FINANCING' | 'FAQS'
  const [activeTab, setActiveTab] = useState('TREATMENTS');

  // Booking Modal State
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null); // Doctor or Treatment
  const [bookingCategory, setBookingCategory] = useState('consult'); // 'consult' | 'treatment'
  const [partnerName, setPartnerName] = useState('Ananya & Ramesh');
  const [contactPhone, setContactPhone] = useState('+91 98450 12345');
  const [preferredSlot, setPreferredSlot] = useState('Tomorrow, 11:00 AM');
  const [consultType, setConsultType] = useState('In-Clinic'); // 'In-Clinic' | 'Private Video Call'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAYMENT_METHODS_IVF = [
    { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'phone-portrait-outline', color: '#7C3AED' },
    { id: 'CARD', label: 'Credit / Debit Card', icon: 'card-outline', color: '#DB2777' },
    { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline', color: '#0369A1' },
    { id: 'WALLET', label: 'Health Wallet Balance', icon: 'wallet-outline', color: '#059669' },
    { id: 'CLINIC', label: 'Pay at Clinic (EMI Available)', icon: 'cash-outline', color: '#D97706' },
  ];

  // EMI Calculator State
  const [selectedEmiTreatment, setSelectedEmiTreatment] = useState(fertilityTreatments[1]); // Default IVF
  const [selectedTenureMonths, setSelectedTenureMonths] = useState(18);

  const calculateMonthlyEmi = (price, months) => {
    if (!months || months <= 0) return price;
    return Math.round(price / months);
  };

  const handleOpenBooking = (item, cat) => {
    setSelectedTarget(item);
    setBookingCategory(cat);
    setBookingModalVisible(true);
  };

  const handleConfirmConsultation = async () => {
    if (!partnerName.trim() || !contactPhone.trim()) {
      showAlert('Required', 'Please enter your name and confidential phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isDoc = bookingCategory === 'doctor';
      const bookingId = `IVF-${Date.now().toString().slice(-6)}`;
      const newBooking = {
        id: bookingId,
        tokenNumber: `FERT-${Math.floor(100 + Math.random() * 900)}`,
        type: isDoc ? 'Fertility Specialist Consult' : `Fertility Care: ${selectedTarget?.title || 'Treatment'}`,
        serviceType: 'fertility',
        doctor: isDoc
          ? {
              name: selectedTarget?.name || 'Dr. Priya V. Shenoy',
              specialty: selectedTarget?.specialty || 'Reproductive Medicine Specialist',
              clinicName: selectedTarget?.clinicName || 'Nova IVF & Fertility Care Centre',
              clinicAddress: selectedTarget?.clinicAddress || 'Gokulam, Mysore',
              fee: selectedTarget?.fee || 600,
              image: selectedTarget?.image,
            }
          : {
              name: 'Nova IVF & Fertility Institute',
              specialty: `Reproductive Treatment: ${selectedTarget?.title || 'IVF Cycle'}`,
              clinicName: 'Nova IVF Centre',
              clinicAddress: 'Gokulam 3rd Stage, Mysore',
              fee: selectedTarget?.price || 4999,
              image: selectedTarget?.image,
            },
        date: preferredSlot,
        time: preferredSlot.includes('AM') ? '11:00 AM' : '04:00 PM',
        status: 'Confirmed',
        paidAmount: isDoc ? (selectedTarget?.fee || 600) : (selectedTarget?.price || 4999),
        paymentStatus: selectedPaymentMethod === 'Pay at Clinic'
          ? 'Pay at Clinic (0% EMI Available)'
          : `Paid Online via ${selectedPaymentMethod}`,
        consultMode: consultType,
        patient: {
          name: partnerName.trim(),
          phone: contactPhone.trim(),
          confidential: true,
        },
      };

      // Save to @unnathi_fertility_bookings
      const existingJson = await AsyncStorage.getItem('@unnathi_fertility_bookings');
      const existingList = existingJson ? JSON.parse(existingJson) : [];
      existingList.unshift(newBooking);
      await AsyncStorage.setItem('@unnathi_fertility_bookings', JSON.stringify(existingList));

      // Also save into standard appointments list
      const apptsJson = await AsyncStorage.getItem('@unnathi_appointments');
      const apptsList = apptsJson ? JSON.parse(apptsJson) : [];
      apptsList.unshift(newBooking);
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(apptsList));

      setIsSubmitting(false);
      setBookingModalVisible(false);

      showAlert(
        'Consultation Confirmed 🛡️',
        `Your confidential fertility appointment has been scheduled for ${preferredSlot}. Token: ${newBooking.tokenNumber}. Our care coordinator will call discreetly to confirm.`,
        [
          { text: 'View Bookings', onPress: () => navigation?.navigate('Bookings') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (e) {
      setIsSubmitting(false);
      showAlert('Error', 'Could not save appointment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Mobile Header */}
      {!isDesktopWeb && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.mobileHeaderCenter}>
            <Text style={styles.mobileHeaderTitle}>Fertility & IVF Care</Text>
            <Text style={styles.mobileHeaderSub}>Compassionate Reproductive Medicine</Text>
          </View>
          <View style={styles.confidentialPillSmall}>
            <Ionicons name="lock-closed" size={11} color="#DB2777" />
            <Text style={styles.confidentialPillSmallText}>100% Private</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            HERO BANNER
        ============================================================ */}
        <View style={styles.heroBannerWrap}>
          <View style={[styles.heroBannerContainer, isDesktopWeb && styles.desktopHeroBanner]}>
            <View style={styles.heroLeftCol}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.privacyBadge}>
                  <Ionicons name="lock-closed" size={13} color="#9D174D" />
                  <Text style={styles.privacyBadgeText}>100% STRICT CONFIDENTIALITY</Text>
                </View>
                <View style={styles.successBadge}>
                  <Ionicons name="ribbon" size={13} color="#BE185D" />
                  <Text style={styles.successBadgeText}>Up to 73% Success Rate</Text>
                </View>
              </View>

              <Text style={styles.heroHeading}>
                Your Dream of Parenthood,{'\n'}
                <Text style={styles.heroHeadingAccent}>Nurtured with Advanced Science.</Text>
              </Text>

              <Text style={styles.heroSubHeading}>
                Trusted reproductive endocrinologists, ISO-certified cleanroom embryology labs, transparent treatment costs, and flexible 0% interest monthly EMI plans across Mysore and Bangalore.
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>71.8%</Text>
                  <Text style={styles.statLbl}>Clinical Pregnancy Rate</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>15,000+</Text>
                  <Text style={styles.statLbl}>Parenthood Journeys</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>0% EMI</Text>
                  <Text style={styles.statLbl}>Flexible Financing</Text>
                </View>
              </View>
            </View>

            {isDesktopWeb && (
              <View style={styles.heroRightCol}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600' }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </View>

        {/* ============================================================
            NAVIGATION TABS
        ============================================================ */}
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsRow, isDesktopWeb && styles.desktopTabsRow]}
          >
            {[
              { id: 'TREATMENTS', label: 'Treatments & Packages', icon: 'heart' },
              { id: 'DOCTORS', label: 'Fertility Specialists', icon: 'medkit' },
              { id: 'CENTERS', label: 'Partner Clinics & Labs', icon: 'business' },
              { id: 'FINANCING', label: '0% EMI Calculator', icon: 'calculator' },
              { id: 'FAQS', label: 'Patient FAQs', icon: 'help-circle' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={active ? '#FFFFFF' : '#DB2777'}
                  />
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ============================================================
            TAB 1: TREATMENTS & PACKAGES
        ============================================================ */}
        {activeTab === 'TREATMENTS' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Advanced Reproductive Treatments</Text>
                <Text style={styles.sectionSubtitle}>
                  Transparent packages with blastocyst culture, ICSI, and genetic testing options
                </Text>
              </View>
            </View>

            <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopTwoColGrid]}>
              {fertilityTreatments.map((treat) => (
                <View key={treat.id} style={styles.treatmentCard}>
                  <View style={styles.treatmentHeader}>
                    <View style={styles.treatmentBadgeRow}>
                      <View style={[styles.treatmentBadgePill, { backgroundColor: treat.badgeColor || '#DB2777' }]}>
                        <Text style={styles.treatmentBadgeText}>{treat.badge}</Text>
                      </View>
                      <View style={styles.durationPill}>
                        <Ionicons name="calendar-outline" size={12} color="#475569" />
                        <Text style={styles.durationPillText}>{treat.duration}</Text>
                      </View>
                    </View>

                    <Text style={styles.treatmentTitle}>{treat.title}</Text>
                    <Text style={styles.treatmentSub}>{treat.subtitle}</Text>
                  </View>

                  <View style={styles.treatmentBody}>
                    <Text style={styles.inclusionsHeading}>Package Inclusions:</Text>
                    <View style={styles.inclusionsList}>
                      {treat.inclusions.map((inc, i) => (
                        <View key={i} style={styles.incItem}>
                          <Ionicons name="checkmark-circle" size={14} color="#DB2777" />
                          <Text style={styles.incText}>{inc}</Text>
                        </View>
                      ))}
                    </View>

                    {treat.emiAvailable && (
                      <View style={styles.emiHighlightBox}>
                        <Ionicons name="card-outline" size={15} color="#BE185D" />
                        <Text style={styles.emiHighlightText}>
                          Zero Cost EMI Starts At: <Text style={{ fontWeight: '800' }}>{treat.emiStartsAt}</Text>
                        </Text>
                      </View>
                    )}

                    <View style={styles.treatmentFooter}>
                      <View>
                        <View style={styles.priceRow}>
                          <Text style={styles.currentPrice}>₹{treat.price.toLocaleString('en-IN')}</Text>
                          <Text style={styles.origPrice}>₹{treat.originalPrice.toLocaleString('en-IN')}</Text>
                        </View>
                        <Text style={styles.discountText}>{treat.discount}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.bookTreatmentBtn}
                        onPress={() => handleOpenBooking(treat, 'treatment')}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.bookTreatmentBtnText}>Book Consultation</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            TAB 2: FERTILITY SPECIALISTS
        ============================================================ */}
        {activeTab === 'DOCTORS' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Senior Reproductive Endocrinologists</Text>
                <Text style={styles.sectionSubtitle}>
                  Internationally trained fertility physicians, clinical embryologists, and andrology surgeons
                </Text>
              </View>
            </View>

            <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopThreeColGrid]}>
              {fertilitySpecialists.map((doc) => (
                <View key={doc.id} style={styles.doctorCard}>
                  <View style={styles.docHeaderRow}>
                    <Image source={{ uri: doc.image }} style={styles.docAvatar} />
                    <View style={styles.docInfoCol}>
                      <View style={styles.ratingBadgeRow}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.ratingBadgeText}>{doc.rating}</Text>
                        </View>
                        <Text style={styles.reviewsCountText}>({doc.reviewsCount} reviews)</Text>
                      </View>
                      <Text style={styles.docName}>{doc.name}</Text>
                      <Text style={styles.docSpecialty}>{doc.specialty}</Text>
                      <Text style={styles.docQual}>{doc.qualification}</Text>
                    </View>
                  </View>

                  <View style={styles.successRateBadgeBox}>
                    <Ionicons name="trophy-outline" size={14} color="#BE185D" />
                    <Text style={styles.successRateBadgeText}>{doc.successRate}</Text>
                  </View>

                  <View style={styles.docClinicBox}>
                    <Ionicons name="location-outline" size={14} color="#DB2777" />
                    <Text style={styles.docClinicText} numberOfLines={2}>
                      {doc.clinicName} • {doc.clinicAddress}
                    </Text>
                  </View>

                  <View style={styles.specialtiesPillsRow}>
                    {doc.specializations.map((spec, i) => (
                      <View key={i} style={styles.specPill}>
                        <Text style={styles.specPillText}>{spec}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.docFooterRow}>
                    <View>
                      <Text style={styles.feeLabel}>Confidential Consult</Text>
                      <Text style={styles.feePrice}>₹{doc.fee}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.bookDocBtn}
                      onPress={() => handleOpenBooking(doc, 'doctor')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.bookDocBtnText}>Book Slot</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            TAB 3: PARTNER CLINICS & ACCREDITED LABS
        ============================================================ */}
        {activeTab === 'CENTERS' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Accredited Partner Fertility Centers</Text>
                <Text style={styles.sectionSubtitle}>
                  ISAR & NABH accredited centers equipped with Class 10,000 modular embryology laboratories
                </Text>
              </View>
            </View>

            <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopThreeColGrid]}>
              {partnerFertilityCenters.map((center) => (
                <View key={center.id} style={styles.centerCard}>
                  <View style={styles.centerTop}>
                    <Ionicons name="business" size={28} color="#DB2777" />
                    <View style={styles.successPill}>
                      <Text style={styles.successPillText}>{center.successRate} Success</Text>
                    </View>
                  </View>

                  <Text style={styles.centerName}>{center.name}</Text>
                  <Text style={styles.centerAddress}>{center.address}</Text>

                  <View style={styles.certsRow}>
                    {center.certifications.map((cert, i) => (
                      <View key={i} style={styles.certBadge}>
                        <Ionicons name="shield-checkmark" size={11} color="#059669" />
                        <Text style={styles.certBadgeText}>{cert}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.featuresBox}>
                    <Text style={styles.featuresHeading}>Facility Highlights:</Text>
                    {center.features.map((f, i) => (
                      <View key={i} style={styles.featRow}>
                        <Ionicons name="sparkles" size={12} color="#DB2777" />
                        <Text style={styles.featText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.visitCenterBtn}
                    onPress={() => handleOpenBooking({ name: center.name, title: center.name, fee: 600 }, 'doctor')}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.visitCenterBtnText}>Book Visit to This Center</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            TAB 4: 0% EMI FINANCING CALCULATOR
        ============================================================ */}
        {activeTab === 'FINANCING' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Zero Interest (0% EMI) Financing</Text>
                <Text style={styles.sectionSubtitle}>
                  Make world-class fertility care stress-free with zero deposit and zero interest monthly installments
                </Text>
              </View>
            </View>

            <View style={[styles.calculatorCard, isDesktopWeb && styles.desktopCalcCard]}>
              <View style={styles.calcLeftCol}>
                <Text style={styles.calcStepTitle}>1. Select Fertility Treatment</Text>
                <View style={styles.treatPickerList}>
                  {fertilityTreatments.map((t) => {
                    const isSelected = selectedEmiTreatment.id === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.treatPickerItem, isSelected && styles.treatPickerItemSelected]}
                        onPress={() => setSelectedEmiTreatment(t)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.treatPickerItemName, isSelected && styles.treatPickerItemNameSelected]}>
                            {t.title}
                          </Text>
                          <Text style={styles.treatPickerItemPrice}>₹{t.price.toLocaleString('en-IN')}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color="#DB2777" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.calcStepTitle, { marginTop: 20 }]}>2. Select Repayment Tenure</Text>
                <View style={styles.tenurePickerRow}>
                  {emiPlans.map((plan) => {
                    const isSelected = selectedTenureMonths === plan.tenureMonths;
                    return (
                      <TouchableOpacity
                        key={plan.tenureMonths}
                        style={[styles.tenureBtn, isSelected && styles.tenureBtnSelected]}
                        onPress={() => setSelectedTenureMonths(plan.tenureMonths)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.tenureMonthsText, isSelected && styles.tenureMonthsTextSelected]}>
                          {plan.tenureMonths} Months
                        </Text>
                        <Text style={[styles.tenureRateText, isSelected && styles.tenureRateTextSelected]}>
                          0% Interest
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.calcRightCol}>
                <View style={styles.emiResultBox}>
                  <Text style={styles.emiResultLabel}>Estimated Monthly EMI</Text>
                  <Text style={styles.emiResultAmount}>
                    ₹{calculateMonthlyEmi(selectedEmiTreatment.price, selectedTenureMonths).toLocaleString('en-IN')}
                    <Text style={styles.emiMonthSuffix}> /month</Text>
                  </Text>
                  <View style={styles.emiBadgeRow}>
                    <View style={styles.zeroCostBadge}>
                      <Text style={styles.zeroCostBadgeText}>0% Interest • ₹0 Processing Fee</Text>
                    </View>
                  </View>

                  <View style={styles.emiBreakdownList}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Treatment Package Cost:</Text>
                      <Text style={styles.breakdownVal}>₹{selectedEmiTreatment.price.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Loan Tenure:</Text>
                      <Text style={styles.breakdownVal}>{selectedTenureMonths} Months</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Instant Pre-Approval:</Text>
                      <Text style={[styles.breakdownVal, { color: '#059669' }]}>Under 15 Mins</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.applyEmiBtn}
                    onPress={() => handleOpenBooking(selectedEmiTreatment, 'treatment')}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.applyEmiBtnText}>Apply for 0% EMI Pre-Approval</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================
            TAB 5: PATIENT FAQS
        ============================================================ */}
        {activeTab === 'FAQS' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <Text style={styles.sectionSubtitle}>
                  Answers to common questions about treatment confidentiality, timeline, and financing
                </Text>
              </View>
            </View>

            <View style={styles.faqsList}>
              {fertilityFaqs.map((faq, i) => (
                <View key={i} style={styles.faqCard}>
                  <View style={styles.faqQuestionRow}>
                    <Ionicons name="help-circle" size={20} color="#DB2777" />
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  </View>
                  <Text style={styles.faqAnswerText}>{faq.a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Web Footer */}
        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ============================================================
          CONFIDENTIAL BOOKING MODAL
      ============================================================ */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 520 }]}>
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.confidentialModalPill}>
                  <Ionicons name="lock-closed" size={11} color="#DB2777" />
                  <Text style={styles.confidentialModalPillText}>100% DISCRETE & CONFIDENTIAL</Text>
                </View>
                <Text style={styles.modalTitle}>Book Fertility Consultation</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selectedTarget?.name || selectedTarget?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBookingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Patient / Couple Name</Text>
              <TextInput
                style={styles.textInput}
                value={partnerName}
                onChangeText={setPartnerName}
                placeholder="Enter couple or individual name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Confidential Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                placeholder="+91 98450 12345"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Consultation Mode</Text>
              <View style={styles.modeToggleRow}>
                {['In-Clinic', 'Private Video Call'].map((m) => {
                  const isSelected = consultType === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modeBtn, isSelected && styles.modeBtnSelected]}
                      onPress={() => setConsultType(m)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={m === 'In-Clinic' ? 'business-outline' : 'videocam-outline'}
                        size={15}
                        color={isSelected ? '#DB2777' : '#64748B'}
                      />
                      <Text style={[styles.modeBtnText, isSelected && styles.modeBtnTextSelected]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Preferred Date & Time</Text>
              <View style={styles.slotPickerRow}>
                {['Tomorrow, 11:00 AM', 'Tomorrow, 04:00 PM', 'Day After, 10:30 AM'].map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slotChip, preferredSlot === slot && styles.slotChipSelected]}
                    onPress={() => setPreferredSlot(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotChipText, preferredSlot === slot && styles.slotChipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* PAYMENT METHOD SELECTION */}
              <Text style={styles.inputLabel}>Select Payment Method</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_METHODS_IVF.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[
                        styles.paymentMethodRow,
                        isSelected && { borderColor: pm.color, backgroundColor: pm.color + '10' },
                      ]}
                      onPress={() => setSelectedPaymentMethod(pm.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.paymentRadio, isSelected && { borderColor: pm.color }]}>
                        {isSelected && <View style={[styles.paymentRadioDot, { backgroundColor: pm.color }]} />}
                      </View>
                      <Ionicons name={pm.icon} size={18} color={isSelected ? pm.color : '#64748B'} />
                      <Text style={[styles.paymentMethodLabel, isSelected && { color: pm.color, fontWeight: '700' }]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.privacyAssuranceBox}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.privacyAssuranceText}>
                  Your privacy is sacred to us. No SMS broadcast, discrete bill descriptions, and encrypted personal records.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={handleConfirmConsultation}
                activeOpacity={0.88}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmBookingBtnText}>
                  {isSubmitting ? 'Securing Slot...' : 'Confirm Private Consultation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF8F9',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // MOBILE HEADER
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FCE7F3',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeaderCenter: {
    flex: 1,
    marginLeft: 12,
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileHeaderSub: {
    fontSize: 11,
    color: '#DB2777',
    fontWeight: '600',
  },
  confidentialPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidentialPillSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BE185D',
  },

  // HERO BANNER
  heroBannerWrap: {
    backgroundColor: '#831843',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroBannerContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  desktopHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroRightCol: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9D174D',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  successBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#831843',
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  heroHeadingAccent: {
    color: '#FBCFE8',
  },
  heroSubHeading: {
    fontSize: 13.5,
    color: '#FCE7F3',
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 620,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FBCFE8',
  },
  statLbl: {
    fontSize: 10.5,
    color: '#FDF2F8',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // TABS
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FCE7F3',
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  desktopTabsRow: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  tabBtnActive: {
    backgroundColor: '#DB2777',
    borderColor: '#DB2777',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#BE185D',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  // SECTION WRAP
  sectionWrap: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },

  // GRIDS
  cardsGrid: {
    gap: 16,
  },
  desktopTwoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  desktopThreeColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // TREATMENT CARD
  treatmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    overflow: 'hidden',
    flex: 1,
    minWidth: 320,
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  treatmentHeader: {
    padding: 16,
    backgroundColor: '#FDF2F8',
    borderBottomWidth: 1,
    borderBottomColor: '#FCE7F3',
  },
  treatmentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  treatmentBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  treatmentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  treatmentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  treatmentSub: {
    fontSize: 11.5,
    color: '#BE185D',
    fontWeight: '600',
    marginTop: 2,
  },
  treatmentBody: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  inclusionsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inclusionsList: {
    gap: 6,
    marginBottom: 14,
  },
  incItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  incText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  emiHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF2F8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 14,
  },
  emiHighlightText: {
    fontSize: 11,
    color: '#9D174D',
  },
  treatmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  origPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE185D',
  },
  bookTreatmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DB2777',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  bookTreatmentBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // DOCTOR CARD
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    padding: 16,
    flex: 1,
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  docHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  docAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
  },
  docInfoCol: {
    flex: 1,
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewsCountText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSpecialty: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#BE185D',
    marginTop: 2,
  },
  docQual: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  successRateBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  successRateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9D174D',
  },
  docClinicBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginVertical: 10,
  },
  docClinicText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
  specialtiesPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  specPill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9D174D',
  },
  docFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
  },
  feeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  feePrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  bookDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DB2777',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookDocBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // CENTER CARD
  centerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    padding: 18,
    flex: 1,
    minWidth: 300,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  centerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  successPill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  successPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE185D',
  },
  centerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  centerAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 10,
  },
  certsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  featuresBox: {
    backgroundColor: '#FDF8F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 4,
  },
  featuresHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#831843',
    marginBottom: 4,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featText: {
    fontSize: 11,
    color: '#475569',
  },
  visitCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DB2777',
    paddingVertical: 10,
    borderRadius: 10,
  },
  visitCenterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 0% EMI CALCULATOR
  calculatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    padding: 24,
    gap: 24,
  },
  desktopCalcCard: {
    flexDirection: 'row',
  },
  calcLeftCol: {
    flex: 1.2,
  },
  calcRightCol: {
    flex: 1,
    justifyContent: 'center',
  },
  calcStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  treatPickerList: {
    gap: 8,
  },
  treatPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treatPickerItemSelected: {
    backgroundColor: '#FDF2F8',
    borderColor: '#DB2777',
  },
  treatPickerItemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  treatPickerItemNameSelected: {
    color: '#BE185D',
  },
  treatPickerItemPrice: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tenurePickerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tenureBtn: {
    flex: 1,
    minWidth: 90,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  tenureBtnSelected: {
    backgroundColor: '#FDF2F8',
    borderColor: '#DB2777',
  },
  tenureMonthsText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  tenureMonthsTextSelected: {
    color: '#BE185D',
  },
  tenureRateText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  tenureRateTextSelected: {
    color: '#BE185D',
  },
  emiResultBox: {
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
  },
  emiResultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9D174D',
    textTransform: 'uppercase',
  },
  emiResultAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#831843',
    marginVertical: 6,
  },
  emiMonthSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9D174D',
  },
  emiBadgeRow: {
    marginBottom: 16,
  },
  zeroCostBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  zeroCostBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#831843',
  },
  emiBreakdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  breakdownVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  applyEmiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DB2777',
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyEmiBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // FAQS
  faqsList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    padding: 16,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
    paddingLeft: 30,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FCE7F3',
  },
  confidentialModalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  confidentialModalPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#BE185D',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#DB2777',
    fontWeight: '600',
    maxWidth: 280,
  },
  modalCloseBtn: {
    padding: 4,
  },
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
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeBtnSelected: {
    backgroundColor: '#FDF2F8',
    borderColor: '#DB2777',
  },
  modeBtnText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  modeBtnTextSelected: {
    color: '#BE185D',
    fontWeight: '800',
  },
  slotPickerRow: {
    gap: 6,
    marginTop: 4,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipSelected: {
    backgroundColor: '#FDF2F8',
    borderColor: '#DB2777',
  },
  slotChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  slotChipTextSelected: {
    fontWeight: '800',
    color: '#BE185D',
  },
  privacyAssuranceBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  privacyAssuranceText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
  },
  confirmBookingBtn: {
    backgroundColor: '#DB2777',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBookingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // PAYMENT METHOD STYLES
  paymentMethodsWrap: {
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
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
  paymentRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});

export default FertilityIvfScreen;
