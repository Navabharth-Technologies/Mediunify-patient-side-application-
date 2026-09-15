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
import colors from '../../../theme/colors';
import { showAlert } from '../../../utils/alert';
import { useCart } from '../../../context/CartContext';
import {
  ayurvedicDoctors,
  panchakarmaTherapies,
  herbalProducts,
  doshaQuestions,
  doshaInsights,
} from '../../../data/ayurvedaData';
import WebFooter from '../../../components/web/WebFooter';

const AyurvedaWellnessScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;
  const { addToCart } = useCart() || {};

  // Tabs: 'CONSULT' | 'THERAPIES' | 'HERBS' | 'DOSHA'
  const [activeTab, setActiveTab] = useState('CONSULT');

  // Booking Modal State
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState(null); // Doctor or Therapy
  const [bookingType, setBookingType] = useState('doctor'); // 'doctor' | 'therapy'
  const [patientName, setPatientName] = useState('Ramesh (Self)');
  const [patientPhone, setPatientPhone] = useState('+91 98450 12345');
  const [selectedDate, setSelectedDate] = useState('Tomorrow, 10:30 AM');
  const [healthConcern, setHealthConcern] = useState('Stress, Joint Pain & Wellness');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAYMENT_METHODS_AYU = [
    { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'phone-portrait-outline', color: '#2E7D32' },
    { id: 'CARD', label: 'Credit / Debit Card', icon: 'card-outline', color: '#1565C0' },
    { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline', color: '#6A1B9A' },
    { id: 'WALLET', label: 'Health Wallet Balance', icon: 'wallet-outline', color: '#00695C' },
    { id: 'CLINIC', label: 'Pay at Clinic / Centre', icon: 'cash-outline', color: '#E65100' },
  ];

  // Dosha Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [calculatedDosha, setCalculatedDosha] = useState(null);

  const handleOpenDoctorBooking = (doc) => {
    setBookingType('doctor');
    setSelectedItemForBooking(doc);
    setBookingModalVisible(true);
  };

  const handleOpenTherapyBooking = (therapy) => {
    setBookingType('therapy');
    setSelectedItemForBooking(therapy);
    setBookingModalVisible(true);
  };

  const handleAddToCart = (product) => {
    if (addToCart) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        quantity: 1,
        image: product.image,
      });
    }
    showAlert('Added to Cart 🌿', `"${product.name}" has been added to your healthcare cart.`);
  };

  const handleConfirmBooking = async () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      showAlert('Required', 'Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isDoc = bookingType === 'doctor';
      const bookingId = `AYU-${Date.now().toString().slice(-6)}`;
      const newBooking = {
        id: bookingId,
        tokenNumber: `AYU-${Math.floor(100 + Math.random() * 900)}`,
        type: isDoc ? 'Ayurvedic Consultation' : 'Panchakarma Therapy',
        serviceType: 'ayurveda',
        doctor: isDoc
          ? {
              name: selectedItemForBooking?.name || 'Dr. Vaidya Madhavan Nambiar',
              specialty: selectedItemForBooking?.specialty || 'Ayurvedic Physician',
              clinicName: selectedItemForBooking?.clinicName || 'Kottakkal Arya Vaidya Sala Partner Clinic',
              clinicAddress: selectedItemForBooking?.clinicAddress || 'Saraswathipuram, Mysore',
              fee: selectedItemForBooking?.fee || 400,
              image: selectedItemForBooking?.image,
            }
          : {
              name: 'Sanjeevani Ayurvedic Wellness Centre',
              specialty: `Panchakarma: ${selectedItemForBooking?.title || 'Therapy'}`,
              clinicName: 'Sanjeevani Wellness Center',
              clinicAddress: 'Gokulam 2nd Stage, Mysore',
              fee: selectedItemForBooking?.price || 1299,
              image: selectedItemForBooking?.image,
            },
        date: selectedDate,
        time: selectedDate.includes('AM') ? '10:30 AM' : '04:30 PM',
        status: 'Confirmed',
        paidAmount: isDoc ? (selectedItemForBooking?.fee || 400) : (selectedItemForBooking?.price || 1299),
        paymentStatus: selectedPaymentMethod === 'Pay at Clinic' || selectedPaymentMethod === 'Pay at Clinic / Centre'
          ? 'Pay at Clinic / Centre'
          : `Paid Online via ${selectedPaymentMethod}`,
        patient: {
          name: patientName.trim(),
          phone: patientPhone.trim(),
          concern: healthConcern,
        },
      };

      // Save to @unnathi_ayurveda_bookings
      const existingJson = await AsyncStorage.getItem('@unnathi_ayurveda_bookings');
      const existingList = existingJson ? JSON.parse(existingJson) : [];
      existingList.unshift(newBooking);
      await AsyncStorage.setItem('@unnathi_ayurveda_bookings', JSON.stringify(existingList));

      // Also save into standard appointments list for cross-screen visibility
      const apptsJson = await AsyncStorage.getItem('@unnathi_appointments');
      const apptsList = apptsJson ? JSON.parse(apptsJson) : [];
      apptsList.unshift(newBooking);
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(apptsList));

      setIsSubmitting(false);
      setBookingModalVisible(false);

      showAlert(
        'Booking Confirmed! 🌿',
        `Your appointment for ${isDoc ? selectedItemForBooking?.name : selectedItemForBooking?.title} is confirmed for ${selectedDate}. Token: ${newBooking.tokenNumber}.`,
        [
          { text: 'View Bookings', onPress: () => navigation?.navigate('Bookings') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (e) {
      setIsSubmitting(false);
      showAlert('Error', 'Could not save booking. Please try again.');
    }
  };

  const handleSelectQuizOption = (qId, dosha) => {
    const next = { ...quizAnswers, [qId]: dosha };
    setQuizAnswers(next);

    // If all 3 answered, compute dominant dosha
    if (Object.keys(next).length === doshaQuestions.length) {
      const counts = { Vata: 0, Pitta: 0, Kapha: 0 };
      Object.values(next).forEach((d) => {
        counts[d] = (counts[d] || 0) + 1;
      });
      let best = 'Vata';
      let maxCount = -1;
      Object.entries(counts).forEach(([k, v]) => {
        if (v > maxCount) {
          maxCount = v;
          best = k;
        }
      });
      setCalculatedDosha(best);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Mobile Top Header */}
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
            <Text style={styles.mobileHeaderTitle}>Ayurveda & Wellness</Text>
            <Text style={styles.mobileHeaderSub}>Holistic Healing & Panchakarma</Text>
          </View>
          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => navigation?.navigate('Cart')}
            activeOpacity={0.75}
          >
            <Ionicons name="cart-outline" size={22} color="#059669" />
          </TouchableOpacity>
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
                <View style={styles.ayushBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#059669" />
                  <Text style={styles.ayushBadgeText}>AYUSH CERTIFIED VAIDYAS</Text>
                </View>
                <View style={styles.organicBadge}>
                  <Ionicons name="leaf" size={12} color="#15803D" />
                  <Text style={styles.organicBadgeText}>100% Classical Ayurveda</Text>
                </View>
              </View>

              <Text style={styles.heroHeading}>
                Ancient Healing Wisdom.{'\n'}
                <Text style={styles.heroHeadingAccent}>Personalized for You.</Text>
              </Text>

              <Text style={styles.heroSubHeading}>
                Experience authentic pulse diagnosis (Nadi Pariksha), traditional Kerala Panchakarma therapies, and certified herbal remedies from renowned Ayurvedic practitioners in Mysore & Bangalore.
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>18+ Yrs</Text>
                  <Text style={styles.statLbl}>Senior Vaidyas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>5 Classical</Text>
                  <Text style={styles.statLbl}>Panchakarma Therapies</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>4.9 ★</Text>
                  <Text style={styles.statLbl}>Patient Satisfaction</Text>
                </View>
              </View>
            </View>

            {isDesktopWeb && (
              <View style={styles.heroRightCol}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600' }}
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
              { id: 'CONSULT', label: 'Doctor Consultations', icon: 'person' },
              { id: 'THERAPIES', label: 'Panchakarma Therapies', icon: 'body' },
              { id: 'HERBS', label: 'Herbal Store', icon: 'leaf' },
              { id: 'DOSHA', label: 'Dosha Assessment Quiz', icon: 'pulse' },
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
                    color={active ? '#FFFFFF' : '#059669'}
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
            TAB 1: DOCTOR CONSULTATIONS
        ============================================================ */}
        {activeTab === 'CONSULT' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Consult Certified Ayurvedic Vaidyas</Text>
                <Text style={styles.sectionSubtitle}>
                  Specialized Nadi Pariksha (Pulse Diagnosis), Chronic Ailments & Holistic Rejuvenation
                </Text>
              </View>
            </View>

            <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopThreeColGrid]}>
              {ayurvedicDoctors.map((doc) => (
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

                  <View style={styles.docClinicBox}>
                    <Ionicons name="location-outline" size={14} color="#059669" />
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
                      <Text style={styles.feeLabel}>Consultation Fee</Text>
                      <Text style={styles.feePrice}>₹{doc.fee}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.bookDocBtn}
                      onPress={() => handleOpenDoctorBooking(doc)}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.bookDocBtnText}>Book Appointment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            TAB 2: PANCHAKARMA THERAPIES
        ============================================================ */}
        {activeTab === 'THERAPIES' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Authentic Panchakarma Therapies</Text>
                <Text style={styles.sectionSubtitle}>
                  Administered by certified Ayurvedic therapists in serene clinical environments
                </Text>
              </View>
            </View>

            <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopTwoColGrid]}>
              {panchakarmaTherapies.map((pkg) => (
                <View key={pkg.id} style={styles.therapyCard}>
                  <Image source={{ uri: pkg.image }} style={styles.therapyImg} />
                  <View style={styles.therapyBody}>
                    <View style={styles.therapyBadgeRow}>
                      <View style={[styles.therapyBadgePill, { backgroundColor: pkg.badgeColor || '#059669' }]}>
                        <Text style={styles.therapyBadgeText}>{pkg.badge}</Text>
                      </View>
                      <View style={styles.durationPill}>
                        <Ionicons name="time-outline" size={12} color="#475569" />
                        <Text style={styles.durationPillText}>{pkg.duration}</Text>
                      </View>
                    </View>

                    <Text style={styles.therapyTitle}>{pkg.title}</Text>
                    <Text style={styles.therapySub}>{pkg.subtitle}</Text>

                    <View style={styles.benefitsList}>
                      {pkg.benefits.map((b, i) => (
                        <View key={i} style={styles.benefitItem}>
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text style={styles.benefitText}>{b}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.therapyFooter}>
                      <View>
                        <View style={styles.priceRow}>
                          <Text style={styles.currentPrice}>₹{pkg.price}</Text>
                          <Text style={styles.origPrice}>₹{pkg.originalPrice}</Text>
                          <Text style={styles.discountText}>{pkg.discount}</Text>
                        </View>
                        <Text style={styles.sessionsText}>Rec: {pkg.sessionsRecommended}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.bookTherapyBtn}
                        onPress={() => handleOpenTherapyBooking(pkg)}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.bookTherapyBtnText}>Book Session</Text>
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
            TAB 3: HERBAL STORE
        ============================================================ */}
        {activeTab === 'HERBS' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Classical Ayurvedic Formulations</Text>
                <Text style={styles.sectionSubtitle}>
                  100% authentic rasayanas, herbal churnas & medicated oils delivered in 60 minutes
                </Text>
              </View>
            </View>

            <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopThreeColGrid]}>
              {herbalProducts.map((prod) => (
                <View key={prod.id} style={styles.herbalCard}>
                  <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>{prod.badge}</Text>
                  </View>
                  <Image source={{ uri: prod.image }} style={styles.productImg} resizeMode="cover" />
                  <View style={styles.productInfo}>
                    <Text style={styles.productCat}>{prod.category}</Text>
                    <Text style={styles.productName} numberOfLines={2}>{prod.name}</Text>
                    <Text style={styles.productBrand}>{prod.brand}</Text>
                    <Text style={styles.productDosage}>Dosage: {prod.dosage}</Text>

                    <View style={styles.productFooterRow}>
                      <View>
                        <View style={styles.priceRow}>
                          <Text style={styles.currentPrice}>₹{prod.price}</Text>
                          <Text style={styles.origPrice}>₹{prod.mrp}</Text>
                        </View>
                        <Text style={styles.discountText}>{prod.discount}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.addCartBtn}
                        onPress={() => handleAddToCart(prod)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.addCartBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            TAB 4: DOSHA QUIZ
        ============================================================ */}
        {activeTab === 'DOSHA' && (
          <View style={styles.sectionWrap}>
            <View style={styles.doshaQuizHeader}>
              <View style={styles.doshaPill}>
                <Ionicons name="sparkles" size={14} color="#059669" />
                <Text style={styles.doshaPillText}>Prakriti Analysis</Text>
              </View>
              <Text style={styles.sectionTitle}>Know Your Ayurvedic Body Constitution</Text>
              <Text style={styles.sectionSubtitle}>
                Answer these 3 clinical questions to discover your dominant Dosha (Vata, Pitta, or Kapha) and receive personalized Ayurvedic dietary and lifestyle recommendations.
              </Text>
            </View>

            <View style={styles.questionsContainer}>
              {doshaQuestions.map((q) => (
                <View key={q.id} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>{q.title}</Text>
                  <View style={styles.optionsList}>
                    {q.options.map((opt, idx) => {
                      const isSelected = quizAnswers[q.id] === opt.dosha;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                          onPress={() => handleSelectQuizOption(q.id, opt.dosha)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Dosha Result Card */}
            {calculatedDosha && doshaInsights[calculatedDosha] && (
              <View style={styles.doshaResultCard}>
                <View style={styles.doshaResultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  <View>
                    <Text style={styles.doshaResultTitle}>
                      Your Dominant Constitution: {doshaInsights[calculatedDosha].title}
                    </Text>
                    <Text style={styles.doshaResultSub}>
                      {doshaInsights[calculatedDosha].summary}
                    </Text>
                  </View>
                </View>

                <View style={styles.doshaRecsBox}>
                  <Text style={styles.doshaRecsHeading}>Personalized Lifestyle & Diet Guidance:</Text>
                  {doshaInsights[calculatedDosha].recommendations.map((rec, i) => (
                    <View key={i} style={styles.recItemRow}>
                      <Ionicons name="leaf-outline" size={14} color="#059669" />
                      <Text style={styles.recItemText}>{rec}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.consultDoshaBtn}
                  onPress={() => setActiveTab('CONSULT')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="person" size={16} color="#FFFFFF" />
                  <Text style={styles.consultDoshaBtnText}>
                    Consult Vaidya to Balance Your {calculatedDosha}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Web Footer */}
        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ============================================================
          BOOKING MODAL
      ============================================================ */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.confidentialBadgePill}>
                  <Ionicons name="leaf" size={11} color="#059669" />
                  <Text style={styles.confidentialBadgePillText}>100% AUTHENTIC AYURVEDIC CARE</Text>
                </View>
                <Text style={styles.modalTitle}>
                  {bookingType === 'doctor' ? 'Book Ayurvedic Consultation' : 'Book Panchakarma Therapy'}
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selectedItemForBooking?.name || selectedItemForBooking?.title}
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
              <Text style={styles.inputLabel}>Patient Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter patient name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={patientPhone}
                onChangeText={setPatientPhone}
                keyboardType="phone-pad"
                placeholder="+91 98450 12345"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Primary Health Concern</Text>
              <TextInput
                style={styles.textInput}
                value={healthConcern}
                onChangeText={setHealthConcern}
                placeholder="e.g. Chronic back pain, indigestion, sleep issues"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Preferred Appointment Slot</Text>
              <View style={styles.slotPickerRow}>
                {['Tomorrow, 10:30 AM', 'Tomorrow, 04:30 PM', 'Day After, 11:00 AM'].map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slotChip, selectedDate === slot && styles.slotChipSelected]}
                    onPress={() => setSelectedDate(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotChipText, selectedDate === slot && styles.slotChipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.pricingSummaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Payable at Clinic</Text>
                  <Text style={styles.summaryValue}>
                    ₹{bookingType === 'doctor' ? (selectedItemForBooking?.fee || 400) : (selectedItemForBooking?.price || 1299)}
                  </Text>
                </View>
                <Text style={styles.summaryNote}>
                  ✓ Zero cancellation fee • Digital prescription included • Instant confirmation
                </Text>
              </View>

              {/* PAYMENT METHOD SELECTION */}
              <Text style={styles.inputLabel}>Select Payment Method</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_METHODS_AYU.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[
                        styles.paymentMethodRow,
                        isSelected && { borderColor: pm.color, backgroundColor: pm.color + '12' },
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
                  Certified BAMS/MD Ayurvedic Vaidyas with authentic herbal medicines and classical Kerala Panchakarma therapies.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={handleConfirmBooking}
                activeOpacity={0.88}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmBookingBtnText}>
                  {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
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
    backgroundColor: '#F8FAFC',
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
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
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
    color: '#059669',
    fontWeight: '600',
  },
  headerCartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // HERO BANNER
  heroBannerWrap: {
    backgroundColor: '#064E3B',
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
  ayushBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ayushBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  organicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  organicBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  heroHeadingAccent: {
    color: '#6EE7B7',
  },
  heroSubHeading: {
    fontSize: 13.5,
    color: '#D1FAE5',
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
    color: '#A7F3D0',
  },
  statLbl: {
    fontSize: 10.5,
    color: '#E6FFFA',
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
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
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
  desktopThreeColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  desktopTwoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // DOCTOR CARD
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#059669',
    marginTop: 2,
  },
  docQual: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  docFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookDocBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // THERAPY CARD
  therapyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flex: 1,
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  therapyImg: {
    width: '100%',
    height: 160,
  },
  therapyBody: {
    padding: 16,
  },
  therapyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  therapyBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  therapyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  therapyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  therapySub: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 10,
  },
  benefitsList: {
    gap: 5,
    marginBottom: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  benefitText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  therapyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  origPrice: {
    fontSize: 11.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  sessionsText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  bookTherapyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  bookTherapyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // HERBAL STORE
  herbalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flex: 1,
    minWidth: 260,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  productBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  productImg: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 3,
  },
  productBrand: {
    fontSize: 11,
    color: '#64748B',
  },
  productDosage: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 10,
  },
  productFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addCartBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // DOSHA QUIZ
  doshaQuizHeader: {
    marginBottom: 20,
  },
  doshaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  doshaPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  questionsContainer: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionItemSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  optionText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 17,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#065F46',
  },

  // DOSHA RESULT CARD
  doshaResultCard: {
    marginTop: 24,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 20,
  },
  doshaResultHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  doshaResultTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
  },
  doshaResultSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 3,
    lineHeight: 18,
  },
  doshaRecsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  doshaRecsHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  recItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  recItemText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  consultDoshaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
  },
  consultDoshaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#059669',
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
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  slotChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  slotChipTextSelected: {
    fontWeight: '800',
    color: '#065F46',
  },
  pricingSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryNote: {
    fontSize: 10,
    color: '#059669',
    marginTop: 6,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmBookingBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBookingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#059669',
    letterSpacing: 0.5,
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

export default AyurvedaWellnessScreen;
