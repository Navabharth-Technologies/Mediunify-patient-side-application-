import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Linking,
  Platform,
  Modal,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const SURGERY_LIST = [
  'General Surgery Consultation',
  'Cataract Surgery',
  'Gallbladder Stone Removal (Laparoscopic)',
  'Hernia Repair (Mesh / Laparoscopic)',
  'Knee Replacement (Robotic / Total)',
  'Kidney Stone Removal (Laser RIRS/PCNL)',
  'Appendectomy (Laser / Laparoscopic)',
  'Piles, Fissure & Fistula (Laser)',
  'Lasik Eye Laser Surgery',
  'ACL & Meniscus Reconstruction',
  'Gynecological Laparoscopic Care',
  'Bariatric & Weight Loss Surgery',
  'ENT & Sinus (FESS) Surgery',
];

const CITY_LIST = [
  'Bangalore',
  'Mysore',
  'Hyderabad',
  'Chennai',
  'Mumbai',
  'Delhi NCR',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Mangalore',
];

const HospitalCareScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;
  const isTablet = width >= 600 && width < 992;

  // Form State
  const [selectedSurgery, setSelectedSurgery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Dropdown Modals
  const [surgeryModalVisible, setSurgeryModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedPhone = await AsyncStorage.getItem('userPhone');
        if (storedName) setName(storedName);
        if (storedPhone) setMobileNumber(storedPhone);
      } catch (e) {}
    };
    loadStoredUser();
  }, []);

  const handleBookAppointment = async () => {
    if (!name.trim()) {
      showAlert('Name Required', 'Please enter your full name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 10) {
      showAlert('Valid Mobile Required', 'Please enter a valid 10-digit mobile number to receive your callback.');
      return;
    }

    setLoading(true);
    try {
      const consultationLead = {
        surgery: selectedSurgery || 'General Surgery Consultation',
        city: selectedCity,
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem('@unnathi_surgery_lead', JSON.stringify(consultationLead));
      setLoading(false);
      setBookingSuccess(true);
      showAlert(
        'Consultation Booked! 🩺',
        `Thank you ${name.trim()}! Your request for ${selectedSurgery || 'Surgery Consultation'} in ${selectedCity} has been received. Our dedicated Care Coordinator will call ${mobileNumber.trim()} within 15 minutes.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (e) {
      setLoading(false);
      showAlert('Booking Received', 'Thank you! Our surgery specialist will call you shortly.');
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+918045685554').catch(() => {
      showAlert('Helpline', 'Please dial +91-8045685554 to reach our Surgery Desk.');
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent('Hi, I would like to consult with a surgery specialist on MediUnify.');
    Linking.openURL(`https://wa.me/917353101441?text=${text}`).catch(() => {
      showAlert('WhatsApp', 'Please message +91-7353101441 on WhatsApp.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* MOBILE TOP HEADER */}
      {Platform.OS !== 'web' || width < 768 ? (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('Home');
              }
            }}
            activeOpacity={0.8}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mobileHeaderTitle}>Hospital & Surgery</Text>
            <Text style={styles.mobileHeaderSub}>India's Fastest Growing Surgery Network</Text>
          </View>
        </View>
      ) : (
        /* DESKTOP BREADCRUMB */
        <View style={styles.desktopBreadcrumbWrap}>
          <View style={styles.desktopBreadcrumbInner}>
            <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.7}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            <Text style={styles.breadcrumbCurrent}>Services</Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            <Text style={styles.breadcrumbActive}>Hospital & Surgery Care</Text>

            <View style={{ flex: 1 }} />

            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#00B894" />
              <Text style={styles.verifiedBadgeText}>100% Verified Surgery Network</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainBody, isDesktopWeb && styles.desktopContainer]}>
          <View style={[styles.layoutRow, isDesktopWeb && styles.layoutRowDesktop]}>
            {/* ============================================================
                LEFT COLUMN: HERO BANNER + WHY ASSURED SECTION
            ============================================================ */}
            <View style={[styles.leftColumn, isDesktopWeb && styles.leftColumnDesktop]}>
              {/* 1. HERO NETWORK BANNER CARD */}
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>India’s fastest growing surgery network</Text>
                <Text style={styles.heroSubtitle}>
                  Trusted across India for safe, guided surgery care.
                </Text>

                {/* Doctor Visual with Surrounding 4 Badges */}
                <View style={styles.doctorVisualSection}>
                  {/* Central Circular Backdrop & Doctor Image */}
                  <View style={styles.doctorCircleBackdrop}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
                      }}
                      style={styles.doctorImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* 4 Floating Badges Around Doctor */}
                  {/* Top Left: 2,00,000+ Surgeries */}
                  <View style={[styles.floatingBadge, styles.badgeTopLeft]}>
                    <View style={styles.badgeIconWrap}>
                      <Ionicons name="person" size={16} color="#1E3A8A" />
                    </View>
                    <View>
                      <Text style={styles.badgeBoldText}>2,00,000+</Text>
                      <Text style={styles.badgeSubText}>Surgeries</Text>
                    </View>
                  </View>

                  {/* Top Right: 10,000+ Surgeons */}
                  <View style={[styles.floatingBadge, styles.badgeTopRight]}>
                    <View style={styles.badgeIconWrap}>
                      <Ionicons name="medkit" size={16} color="#1E3A8A" />
                    </View>
                    <View>
                      <Text style={styles.badgeBoldText}>10,000+</Text>
                      <Text style={styles.badgeSubText}>Surgeons</Text>
                    </View>
                  </View>

                  {/* Bottom Left: 25+ Cities */}
                  <View style={[styles.floatingBadge, styles.badgeBottomLeft]}>
                    <View style={styles.badgeIconWrap}>
                      <Ionicons name="business" size={16} color="#1E3A8A" />
                    </View>
                    <View>
                      <Text style={styles.badgeBoldText}>25+</Text>
                      <Text style={styles.badgeSubText}>Cities</Text>
                    </View>
                  </View>

                  {/* Bottom Right: 1,000+ Hospitals */}
                  <View style={[styles.floatingBadge, styles.badgeBottomRight]}>
                    <View style={styles.badgeIconWrap}>
                      <Ionicons name="fitness" size={16} color="#1E3A8A" />
                    </View>
                    <View>
                      <Text style={styles.badgeBoldText}>1,000+</Text>
                      <Text style={styles.badgeSubText}>Hospitals</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. WHY PRACTO ASSURED / WHY MEDIUNIFY ASSURED CARD */}
              <View style={styles.assuredCard}>
                <Text style={styles.assuredSectionHeader}>Why Practo Assured?</Text>

                {/* Sub-header 1: Practo Assured Benefits */}
                <Text style={styles.assuredSubHeader}>Practo Assured Benefits</Text>

                {/* Grid of 3 Benefits */}
                <View style={styles.benefitsGrid}>
                  {/* Card 1: 4+/5 Hospital Excellence */}
                  <View style={styles.benefitItemCard}>
                    <View style={styles.benefitTopRow}>
                      <Ionicons name="star" size={20} color="#1E3A8A" />
                      <Text style={styles.benefitScoreText}>4+/5</Text>
                    </View>
                    <Text style={styles.benefitItemTitle}>Hospital Excellence Rating</Text>
                    <Text style={styles.benefitItemDesc}>
                      First score of its kind in India, evaluating a hospital's infrastructure, equipment, and facilities through an auditing process.
                    </Text>
                  </View>

                  {/* Card 2: 1,000+ Assured Hospitals */}
                  <View style={styles.benefitItemCard}>
                    <View style={styles.benefitTopRow}>
                      <Ionicons name="business-outline" size={20} color="#1E3A8A" />
                      <Text style={styles.benefitScoreText}>1,000+</Text>
                    </View>
                    <Text style={styles.benefitItemTitle}>Assured Hospitals</Text>
                    <Text style={styles.benefitItemDesc}>
                      Carefully Vetted & Quality-Verified Facilities Across Multiple Cities
                    </Text>
                  </View>

                  {/* Card 3: 15+ Years of Expertise */}
                  <View style={styles.benefitItemCard}>
                    <View style={styles.benefitTopRow}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#1E3A8A" />
                      <Text style={styles.benefitScoreText}>15+</Text>
                    </View>
                    <Text style={styles.benefitItemTitle}>Years of Expertise</Text>
                    <Text style={styles.benefitItemDesc}>
                      Proven Expertise & Safe Outcomes
                    </Text>
                  </View>
                </View>

                {/* Sub-header 2: Practo's Assured Network */}
                <Text style={[styles.assuredSubHeader, { marginTop: 24 }]}>Practo's Assured Network</Text>

                {/* 3 Column Stat Strip */}
                <View style={styles.networkStatsStrip}>
                  <View style={styles.networkStatCol}>
                    <Text style={styles.networkStatNum}>1 Crore+</Text>
                    <Text style={styles.networkStatLabel}>Patients</Text>
                  </View>
                  <View style={styles.networkStatDivider} />
                  <View style={styles.networkStatCol}>
                    <Text style={styles.networkStatNum}>10,000+</Text>
                    <Text style={styles.networkStatLabel}>Surgeons</Text>
                  </View>
                  <View style={styles.networkStatDivider} />
                  <View style={styles.networkStatCol}>
                    <Text style={styles.networkStatNum}>25+</Text>
                    <Text style={styles.networkStatLabel}>Cities</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ============================================================
                RIGHT COLUMN: CONSULTATION BOOKING FORM & DIRECT CONTACTS
            ============================================================ */}
            <View style={[styles.rightColumn, isDesktopWeb && styles.rightColumnDesktop]}>
              {/* BOOKING CARD */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Book your consultation today</Text>
                <Text style={styles.formSubtitle}>Get a Call Back Within 15 Minutes</Text>

                <View style={styles.formBody}>
                  {/* Field 1: Surgery Selector */}
                  <TouchableOpacity
                    style={styles.dropdownField}
                    onPress={() => setSurgeryModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dropdownFieldText,
                        !selectedSurgery && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedSurgery || 'Surgery'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>

                  {/* Field 2: City Selector */}
                  <TouchableOpacity
                    style={styles.dropdownField}
                    onPress={() => setCityModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownFieldText} numberOfLines={1}>
                      {selectedCity || 'Bangalore'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>

                  {/* Field 3: Name */}
                  <View style={styles.inputField}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Name"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  {/* Field 4: Mobile Number */}
                  <View style={styles.inputField}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Mobile Number"
                      placeholderTextColor="#94A3B8"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleBookAppointment}
                    activeOpacity={0.9}
                    disabled={loading}
                  >
                    <Text style={styles.submitBtnText}>
                      {loading ? 'Submitting...' : 'Book Appointment'}
                    </Text>
                  </TouchableOpacity>

                  {/* T&C Disclaimer */}
                  <Text style={styles.termsText}>
                    By submitting the form, you agree to Practo's <Text style={styles.termsLink}>T&C</Text>
                  </Text>
                </View>
              </View>

              {/* OR DIVIDER */}
              <View style={styles.orDividerContainer}>
                <View style={styles.orDividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orDividerLine} />
              </View>

              {/* DIRECT CONTACT CARD */}
              <View style={styles.contactCard}>
                {/* Contact Row 1: Reach Out to Us (Phone) */}
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.phoneIconWrap}>
                      <Ionicons name="call" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.contactLabel}>Reach Out to Us</Text>
                  </View>
                  <Text style={styles.contactNumber}>+91-8045685554</Text>
                </TouchableOpacity>

                <View style={styles.contactDivider} />

                {/* Contact Row 2: Chat with Us (WhatsApp) */}
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleWhatsApp}
                  activeOpacity={0.8}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.whatsappIconWrap}>
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.contactLabel}>Chat with Us</Text>
                  </View>
                  <Text style={styles.contactNumber}>+91-7353101441</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* WEB FOOTER */}
        {Platform.OS === 'web' && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* ============================================================
          SURGERY SELECTION MODAL
      ============================================================ */}
      <Modal
        visible={surgeryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSurgeryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSurgeryModalVisible(false)}
        >
          <View style={styles.modalContentCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Surgery Procedure</Text>
              <TouchableOpacity onPress={() => setSurgeryModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={true}>
              {SURGERY_LIST.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalListItem,
                    selectedSurgery === item && styles.modalListItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSurgery(item);
                    setSurgeryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalListItemText,
                      selectedSurgery === item && styles.modalListItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedSurgery === item && (
                    <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          CITY SELECTION MODAL
      ============================================================ */}
      <Modal
        visible={cityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCityModalVisible(false)}
        >
          <View style={styles.modalContentCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={true}>
              {CITY_LIST.map((city, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalListItem,
                    selectedCity === city && styles.modalListItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCity(city);
                    setCityModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalListItemText,
                      selectedCity === city && styles.modalListItemTextSelected,
                    ]}
                  >
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F4F7FC',
  },
  mainBody: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  desktopContainer: {
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // MOBILE HEADER
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // DESKTOP BREADCRUMB
  desktopBreadcrumbWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  desktopBreadcrumbInner: {
    maxWidth: 1240,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: '#64748B',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },

  // LAYOUT
  layoutRow: {
    flexDirection: 'column',
    gap: 24,
  },
  layoutRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  leftColumn: {
    width: '100%',
    gap: 24,
  },
  leftColumnDesktop: {
    flex: 1.35,
  },
  rightColumn: {
    width: '100%',
    gap: 16,
  },
  rightColumnDesktop: {
    flex: 0.9,
    maxWidth: 420,
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: Platform.OS === 'web' ? 20 : 0,
  },

  // 1. HERO NETWORK BANNER CARD
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Doctor Graphic with surrounding badges
  doctorVisualSection: {
    width: '100%',
    maxWidth: 480,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  doctorCircleBackdrop: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#1E3A8A',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3B82F6',
  },
  doctorImage: {
    width: 210,
    height: 230,
    marginTop: 10,
  },

  // 4 Badges
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  badgeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeBoldText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    lineHeight: 16,
  },
  badgeSubText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 13,
  },

  badgeTopLeft: {
    top: 20,
    left: 10,
  },
  badgeTopRight: {
    top: 20,
    right: 10,
  },
  badgeBottomLeft: {
    bottom: 25,
    left: 15,
  },
  badgeBottomRight: {
    bottom: 25,
    right: 15,
  },

  // 2. WHY PRACTO ASSURED SECTION
  assuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  assuredSectionHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
  },
  assuredSubHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitItemCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 180 : '100%',
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#DCEEFF',
    borderRadius: 12,
    padding: 16,
  },
  benefitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  benefitScoreText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  benefitItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 18,
  },
  benefitItemDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },

  // Network 3-Column Strip
  networkStatsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#DCEEFF',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  networkStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  networkStatNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  networkStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  networkStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#CBD5E1',
  },

  // RIGHT COLUMN: FORM CARD
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  formBody: {
    gap: 14,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownFieldText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  submitBtn: {
    backgroundColor: '#1E293B',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '600',
  },

  // OR DIVIDER
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    paddingHorizontal: 12,
  },

  // DIRECT CONTACT CARD
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  contactNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalListItemSelected: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  modalListItemText: {
    fontSize: 14,
    color: '#334155',
  },
  modalListItemTextSelected: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
});

export default HospitalCareScreen;