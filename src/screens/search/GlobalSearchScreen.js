import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import WebFooter from '../../components/web/WebFooter';

const searchData = [
  // 1. DOCTOR CONSULTATIONS & SPECIALISTS
  {
    id: 'doctor-general',
    category: 'Doctors',
    title: 'Find Doctors & Specialists',
    description: 'Book in-clinic consultation with 50+ verified specialists',
    keywords: 'doctor doctors physician general medicine fever cold cough headache consultation clinic specialist dr appointment slots',
    icon: 'person',
    backgroundColor: '#F0FDFA',
    iconColor: colors.primary,
    badgeText: 'Instant Slots',
    badgeColor: '#CCFBF1',
    route: 'DoctorList',
  },
  {
    id: 'doctor-cardio',
    category: 'Doctors',
    title: 'Cardiologist & Heart Care',
    description: 'ECG, Echo, BP management & heart specialists (Dr. Rajesh Sharma)',
    keywords: 'cardiologist heart ecg echo blood pressure hypertension cardiac chest pain dr rajesh sharma',
    icon: 'heart',
    backgroundColor: '#FEF2F2',
    iconColor: '#DC2626',
    badgeText: 'Top Rated',
    badgeColor: '#FEE2E2',
    route: 'DoctorList',
  },
  {
    id: 'doctor-derma',
    category: 'Doctors',
    title: 'Dermatologist & Skin Care',
    description: 'Acne, allergies, hair fall & cosmetic dermatology (Dr. Priya Rao)',
    keywords: 'dermatologist skin hair acne allergy rash eczema cosmetic glow dr priya rao',
    icon: 'sparkles',
    backgroundColor: '#FAF5FF',
    iconColor: '#9333EA',
    badgeText: 'Specialist',
    badgeColor: '#F3E8FF',
    route: 'DoctorList',
  },
  {
    id: 'doctor-pedia',
    category: 'Doctors',
    title: 'Pediatrician & Child Health',
    description: 'Newborn care, vaccinations & pediatric nutrition (Dr. Ananya Reddy)',
    keywords: 'pediatrician child baby newborn vaccination immunization fever infant dr ananya reddy',
    icon: 'happy',
    backgroundColor: '#FFFBEB',
    iconColor: '#D97706',
    badgeText: 'Child Care',
    badgeColor: '#FEF3C7',
    route: 'DoctorList',
  },
  {
    id: 'video-consult',
    category: 'Doctors',
    title: 'Online Video Consultation',
    description: 'Consult top doctors via 10-minute HD video call with digital Rx',
    keywords: 'video consultation online doctor video call teleconsultation instant call prescription digital rx',
    icon: 'videocam',
    backgroundColor: '#EFF6FF',
    iconColor: '#2563EB',
    badgeText: '10 Min Connect',
    badgeColor: '#DBEAFE',
    route: 'VideoConsultation',
  },

  // 2. PHARMACY & MEDICINES
  {
    id: 'pharmacy-main',
    category: 'Medicines',
    title: 'Online Pharmacy & Medicines',
    description: 'Order genuine medicines with flat 20% OFF & express delivery',
    keywords: 'pharmacy medicine medicines order tablets syrup capsules painkiller antibiotic dolo 650 paracetamol azithromycin discount 20% off delivery',
    icon: 'medkit',
    backgroundColor: '#FFF7ED',
    iconColor: '#EA580C',
    badgeText: '20% OFF',
    badgeColor: '#FFEDD5',
    route: 'Pharmacy',
  },
  {
    id: 'pharmacy-return',
    category: 'Medicines',
    title: 'Medicine Return & Refund',
    description: 'Easy return policy for unused sealed medicines with reason feedback',
    keywords: 'return medicine refund exchange product return issue wrong tablet expired sealed return order pharmacy refund',
    icon: 'swap-horizontal',
    backgroundColor: '#FFF1F2',
    iconColor: '#E11D48',
    badgeText: 'Doorstep Pickup',
    badgeColor: '#FFE4E6',
    route: 'Pharmacy',
  },

  // 3. LAB & BLOOD TESTS
  {
    id: 'lab-tests',
    category: 'Labs & Scans',
    title: 'Diagnostic Lab & Blood Tests',
    description: 'CBC, HbA1c, Lipid Profile, Thyroid with Free Home Sample Collection',
    keywords: 'lab tests blood test cbc hba1c thyroid lipid profile sugar fasting urine test pathology diagnostics report doorstep sample',
    icon: 'flask',
    backgroundColor: '#ECFDF5',
    iconColor: '#059669',
    badgeText: 'Free Home Pickup',
    badgeColor: '#D1FAE5',
    route: 'LabTests',
  },
  {
    id: 'lab-full-body',
    category: 'Labs & Scans',
    title: 'Full Body Health Checkup',
    description: '72+ vital tests (Liver, Kidney, Heart, Diabetes & Vitamins)',
    keywords: 'full body checkup health package executive comprehensive preventive master health test',
    icon: 'fitness',
    backgroundColor: '#F0FDF4',
    iconColor: '#16A34A',
    badgeText: '50% OFF Pack',
    badgeColor: '#DCFCE7',
    route: 'LabTests',
  },

  // 4. RADIOLOGY & ADVANCED 3T SCANS
  {
    id: 'radiology-scans',
    category: 'Labs & Scans',
    title: 'Radiology & Advanced 3T Scans',
    description: 'Book 3T MRI, 128-Slice CT Scan, 4D Ultrasound, Digital X-Ray & Dexa',
    keywords: 'radiology scans 3t mri scan 128 ct scan brain spine abdomen knee xray digital x-ray ultrasound sonography mammography dexa pet ct diagnostic center hospital only',
    icon: 'radio',
    backgroundColor: '#E0F2FE',
    iconColor: '#0284C7',
    badgeText: 'Hospital Only',
    badgeColor: '#BAE6FD',
    route: 'RadiologyLabs',
  },
  {
    id: 'radiologist-consult',
    category: 'Labs & Scans',
    title: 'Consult Radiologist Specialist',
    description: 'Get expert 2nd opinion and verified digital report interpretation',
    keywords: 'radiologist doctor 2nd opinion scan interpretation mri report ct scan report radiologist consultation',
    icon: 'eye',
    backgroundColor: '#F5F3FF',
    iconColor: '#7C3AED',
    badgeText: 'Expert Opinion',
    badgeColor: '#EDE9FE',
    route: 'RadiologistList',
  },

  // 5. HOSPITALS & SURGERIES
  {
    id: 'hospitals-list',
    category: 'Hospitals',
    title: 'NABH Accredited Hospitals & ER',
    description: 'Find top multi-specialty hospitals with 24/7 ICU & emergency trauma care',
    keywords: 'hospital hospitals nabh jci icu emergency admission beds trauma cardiac neuro manipal apollo columbia asia narayana',
    icon: 'business',
    backgroundColor: '#F3E8FF',
    iconColor: '#7E22CE',
    badgeText: '24/7 ICU',
    badgeColor: '#E9D5FF',
    route: 'HospitalList',
  },
  {
    id: 'hospital-care-surgeries',
    category: 'Hospitals',
    title: 'Hospital Care & Surgeries',
    description: 'Cataract, Knee Replacement, Hernia, Laparoscopy & Maternity packages',
    keywords: 'surgery surgeries hospital care surgical package knee replacement cataract kidney stone gall bladder hernia maternity delivery c-section',
    icon: 'bandage',
    backgroundColor: '#FFF7ED',
    iconColor: '#C2410C',
    badgeText: 'All-Inclusive',
    badgeColor: '#FFEDD5',
    route: 'HospitalCare',
  },
  {
    id: 'surgery-quote',
    category: 'Hospitals',
    title: 'Free Surgery Cost Calculator',
    description: 'Get instant hospital cost estimates with zero out-of-pocket assistance',
    keywords: 'surgery quote cost estimate hospital price surgical estimate insurance approval cost calculator',
    icon: 'calculator',
    backgroundColor: '#F0FDF4',
    iconColor: '#15803D',
    badgeText: 'Free Estimate',
    badgeColor: '#DCFCE7',
    route: 'SurgeryQuoteRequest',
  },

  // 6. CARE SERVICES & INSURANCE
  {
    id: 'nurse-booking',
    category: 'Care Services',
    title: 'Home Nursing & Attendant Care',
    description: 'Certified nurses for elderly care, post-op dressings, IV & injections',
    keywords: 'nurse home nursing attendant elder care elderly bedridden injection iv drip dressing post surgery caregiver patient care',
    icon: 'shield-checkmark',
    backgroundColor: '#F0FDFA',
    iconColor: colors.primary,
    badgeText: 'Certified Staff',
    badgeColor: '#CCFBF1',
    route: 'NurseBooking',
  },
  {
    id: 'health-insurance',
    category: 'Care Services',
    title: 'Health Insurance & Cashless Claims',
    description: '100% cashless hospitalization support & pre-authorization assistance',
    keywords: 'insurance health insurance mediclaim cashless claim star health hdfc ergo policy tpa reimbursement hospitalization coverage',
    icon: 'shield',
    backgroundColor: '#EFF6FF',
    iconColor: '#1D4ED8',
    badgeText: 'Cashless Support',
    badgeColor: '#DBEAFE',
    route: 'HealthInsurance',
  },
  {
    id: 'health-records',
    category: 'Care Services',
    title: 'Digital Health Records & Reports',
    description: 'Access digital prescriptions, lab test results, scan images & vaccine cards',
    keywords: 'records health records medical records prescriptions lab reports scan reports ehr emr files pdf download',
    icon: 'document-text',
    backgroundColor: '#F8FAFC',
    iconColor: '#475569',
    badgeText: 'Encrypted',
    badgeColor: '#E2E8F0',
    route: 'HealthRecords',
  },
  {
    id: 'health-monitor-vitals',
    category: 'Care Services',
    title: 'Health Vitals Monitor',
    description: 'Track Blood Sugar, Blood Pressure (BP), SpO2, Heart Rate & BMI',
    keywords: 'vitals health monitor blood sugar fasting bp blood pressure spo2 pulse bmi tracker glucose log',
    icon: 'pulse',
    backgroundColor: '#FEF2F2',
    iconColor: '#E11D48',
    badgeText: 'Live Tracker',
    badgeColor: '#FFE4E6',
    route: 'HealthMonitor',
  },
  {
    id: 'my-appointments',
    category: 'Care Services',
    title: 'My Appointments & Bookings',
    description: 'Track upcoming doctor visits, lab collections & radiology scan tokens',
    keywords: 'appointment appointments bookings my bookings reschedule cancel slip status token laboratory scan schedule',
    icon: 'calendar',
    backgroundColor: '#FFFBEB',
    iconColor: '#B45309',
    badgeText: 'Manage Slots',
    badgeColor: '#FEF3C7',
    route: 'Bookings',
  },
  {
    id: 'chatbot-ai',
    category: 'Care Services',
    title: 'AI Health Doctor & Tablet Scanner',
    description: 'Scan prescription photos, check tablet uses & get doctor recommendations',
    keywords: 'chatbot ai assistant ask ai prescription scan camera tablet scanner symptom checker recommend doctor medicine info',
    icon: 'sparkles',
    backgroundColor: '#F0FDFA',
    iconColor: colors.primary,
    badgeText: 'AI Powered',
    badgeColor: '#CCFBF1',
    route: 'Chatbot',
  },
  {
    id: 'emergency-sos',
    category: 'Care Services',
    title: 'Emergency SOS & Ambulance (108)',
    description: 'One-tap 108 ambulance dispatch and 24x7 doctor helpline calling',
    keywords: 'emergency sos ambulance 108 24x7 doctor helpline call urgent accident trauma help',
    icon: 'alert-circle',
    backgroundColor: '#FEF2F2',
    iconColor: '#DC2626',
    badgeText: '24x7 Emergency',
    badgeColor: '#FEE2E2',
    route: 'Emergency',
  },
  {
    id: 'wallet-points',
    category: 'Care Services',
    title: 'Health Wallet & Care Points',
    description: 'Manage wallet cash, earn cashback & redeem loyalty care points',
    keywords: 'wallet care points money balance topup cashback reward coins payment refund',
    icon: 'wallet',
    backgroundColor: '#ECFDF5',
    iconColor: '#047857',
    badgeText: 'Instant Cashback',
    badgeColor: '#D1FAE5',
    route: 'Wallet',
  },
];

const CATEGORIES = ['All', 'Doctors', 'Medicines', 'Labs & Scans', 'Hospitals', 'Care Services'];

const GlobalSearchScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [query, setQuery] = useState(route?.params?.query || '');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setQuery(route.params.query);
    }
  }, [route?.params?.query]);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();

    return searchData.filter((item) => {
      // Category match
      const categoryMatch =
        selectedCategory === 'All' || item.category === selectedCategory;

      if (!categoryMatch) return false;

      // Text match
      if (!text) return true;

      const searchableText = `${item.title} ${item.description} ${item.keywords} ${item.category}`.toLowerCase();
      return searchableText.includes(text);
    });
  }, [query, selectedCategory]);

  const openScreen = (screenRoute) => {
    navigation.navigate(screenRoute);
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => openScreen(item.route)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
          <Ionicons name={item.icon} size={24} color={item.iconColor} />
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.badgeText && (
              <View style={[styles.badge, { backgroundColor: item.badgeColor || '#F1F5F9' }]}>
                <Text style={[styles.badgeText, { color: item.iconColor }]}>{item.badgeText}</Text>
              </View>
            )}
          </View>

          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.categoryTagRow}>
            <Text style={styles.categoryTagText}>{item.category}</Text>
            <View style={styles.actionPrompt}>
              <Text style={styles.actionPromptText}>Open Service</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDesktopWeb && styles.webContainer]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* MOBILE HEADER (Only shown on mobile) */}
      {!isDesktopWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Search Healthcare</Text>
            <Text style={styles.headerSubtitle}>Doctors, Medicines, Labs, Scans & Care</Text>
          </View>

          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearHeaderBtn}>
              <Text style={styles.clearHeaderText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* MOBILE SEARCH BAR INPUT (Hidden on desktop web to eliminate duplicate search bar) */}
      {!isDesktopWeb && (
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search doctors, medicines, 3T MRI, tests..."
            placeholderTextColor="#94A3B8"
            autoFocus={!route?.params?.query}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {isDesktopWeb ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.webScrollContent}>
          <View style={styles.webInnerContainer}>
            {/* SEARCH HEADER */}
            <View style={styles.webBreadcrumbHeader}>
              <View style={styles.webTitleRow}>
                <View>
                  <Text style={styles.webPageTitle}>
                    {query.trim() ? `Search Results for "${query}"` : `${selectedCategory} Directory`}
                  </Text>
                  <Text style={styles.webPageSubtitle}>
                    Verified doctors, branded medicines, diagnostic pathology tests, MRI/CT scans & nursing services
                  </Text>
                </View>
                <View style={styles.webResultCountBadge}>
                  <Text style={styles.webResultCountText}>{results.length} Services Available</Text>
                </View>
              </View>
            </View>

            {/* CATEGORY FILTER PILLS */}
            <View style={styles.categoryPillsContainerWeb}>
              <View style={styles.categoryPillsRowWeb}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DESKTOP 2-COLUMN GRID OF RESULTS */}
            {results.length > 0 ? (
              <View style={styles.webGrid}>
                {results.map((item) => (
                  <View key={item.id} style={styles.webCardWrapper}>
                    {renderItem({ item })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={40} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No matching services found</Text>
                <Text style={styles.emptyText}>
                  Try searching for doctors, medicines (Dolo, Paracetamol), 3T MRI, CT scans, blood tests, or home nursing.
                </Text>
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={() => {
                    setQuery('');
                    setSelectedCategory('All');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyResetBtnText}>View All Services</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* DESKTOP WEB FOOTER */}
          <WebFooter navigation={navigation} />
        </ScrollView>
      ) : (
        /* MOBILE VIEW */
        <>
          {/* CATEGORY FILTER PILLS */}
          <View style={styles.categoryPillsContainer}>
            {Platform.OS === 'web' ? (
              <View style={[styles.categoryPillsRow, { flexWrap: 'wrap' }]}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* RESULT COUNT HEADER */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {query.trim() ? `Search Results for "${query}"` : `${selectedCategory} Directory`}
            </Text>
            <Text style={styles.resultCountBadge}>{results.length} Services</Text>
          </View>

          {/* RESULTS LIST */}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={40} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No matching services found</Text>
                <Text style={styles.emptyText}>
                  Try searching for doctors, medicines (Dolo, Paracetamol), 3T MRI, CT scans, blood tests, or home nursing.
                </Text>
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={() => {
                    setQuery('');
                    setSelectedCategory('All');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyResetBtnText}>View All Services</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 65,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  clearHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // SEARCH INPUT
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    color: '#1E293B',
  },

  // CATEGORY PILLS
  categoryPillsContainer: {
    marginTop: 10,
    marginBottom: 4,
  },
  categoryPillsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },

  // RESULT HEADER
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  resultCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  // LIST & CARD
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  itemDescription: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  categoryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  categoryTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // DESKTOP WEB SPECIFIC STYLES
  webContainer: {
    backgroundColor: '#F1F2F4',
  },
  webScrollContent: {
    flexGrow: 1,
    backgroundColor: '#F1F2F4',
  },
  webInnerContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
  },
  webBreadcrumbHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  webBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  webBreadcrumbLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0071DC',
  },
  webBreadcrumbCurrent: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  webBreadcrumbQuery: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  webTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  webPageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  webPageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  webResultCountBadge: {
    backgroundColor: '#EDF4FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.lightTeal,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  webResultCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.teal,
  },
  categoryPillsContainerWeb: {
    marginBottom: 18,
  },
  categoryPillsRowWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  webGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webCardWrapper: {
    flexBasis: '48.8%',
    flexGrow: 1,
    minWidth: 300,
  },
});

export default GlobalSearchScreen;