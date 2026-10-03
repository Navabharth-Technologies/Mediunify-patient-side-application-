import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// All currently active & available MediUnify Mobile services
// Strictly excludes any deleted, placeholder, or disabled flows
const ALL_SERVICES = [
  {
    id: 'chatbot',
    title: 'AI Chat Bot',
    icon: 'chatbubbles',
    iconColor: '#0D9488',
    iconBg: '#F0FDFA',
    route: 'Chatbot',
    keywords: 'ai chatbot bot assistant symptom health advice 24/7',
  },
  {
    id: 'videocall',
    title: 'Video Consultation',
    icon: 'videocam',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    route: 'VideoConsultation',
    keywords: 'video call consultation teleconsult online doctor hd call',
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy',
    icon: 'medkit',
    iconColor: '#00B894',
    iconBg: '#E6F8F5',
    route: 'Pharmacy',
    keywords: 'order medicine pharmacy prescription pills generic drugs medicines',
  },
  {
    id: 'lab',
    title: 'Lab Tests',
    icon: 'flask',
    iconColor: '#00C2CB',
    iconBg: '#E0F7FA',
    route: 'LabTests',
    keywords: 'lab tests blood test diagnostics health checkup urine sample collection',
  },
  {
    id: 'radiology',
    title: 'Scan & X-Ray',
    icon: 'scan',
    iconColor: '#0284C7',
    iconBg: '#E0F2FE',
    route: 'RadiologyLabs',
    keywords: 'scan x-ray radiology mri ct scan ultrasound 2d echo ecg cardiology',
  },
  {
    id: 'doctors',
    title: 'Doctor Visit',
    icon: 'person',
    iconColor: '#0D9488',
    iconBg: '#CCFBF1',
    route: 'DoctorList',
    keywords: 'doctor visit in-clinic appointment clinic specialist consultation',
  },
  {
    id: 'nurse',
    title: 'Home Nursing',
    icon: 'home',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    route: 'NurseBooking',
    keywords: 'home nursing caregiver attendant elderly care injections post-op',
  },
  {
    id: 'surgery',
    title: 'Surgery Care',
    icon: 'business',
    iconColor: '#1E3A8A',
    iconBg: '#EFF6FF',
    route: 'HospitalCare',
    keywords: 'surgery care hospital admission nabh cashless operation procedure',
  },
  {
    id: 'equipment',
    title: 'Equipment Rental',
    icon: 'fitness',
    iconColor: '#0D9488',
    iconBg: '#F0FDFA',
    route: 'EquipmentRental',
    keywords: 'medical equipment rental hospital bed oxygen concentrator wheelchair bipap',
  },
  {
    id: 'ayurveda',
    title: 'Ayurveda & Wellness',
    icon: 'leaf',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    route: 'AyurvedaWellness',
    keywords: 'ayurveda wellness herbal natural therapy panchakarma holistic',
  },
  {
    id: 'insurance',
    title: 'Health Insurance',
    icon: 'shield-checkmark',
    iconColor: '#3B82F6',
    iconBg: '#EFF6FF',
    route: 'HealthInsurance',
    keywords: 'health insurance policy claim cashless hospitalization medical cover',
  },
  {
    id: 'healthmonitor',
    title: 'Health Monitor',
    icon: 'pulse',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    route: 'HealthMonitor',
    keywords: 'health monitor vitals blood pressure sugar heart rate bmi tracker',
  },
  {
    id: 'emergency',
    title: 'Emergency SOS',
    icon: 'warning',
    iconColor: '#EF4444',
    iconBg: '#FEE2E2',
    route: 'Emergency',
    keywords: 'emergency ambulance sos 24x7 urgent helpline critical dispatch',
  },
  {
    id: 'healthrecords',
    title: 'Health Records',
    icon: 'folder-open',
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    route: 'HealthRecords',
    keywords: 'health records prescriptions medical reports history documents',
  },
];

const AllServicesScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [storedCity, setStoredCity] = useState('');

  // Location synchronization from Home Screen (Source of Truth)
  useEffect(() => {
    let isMounted = true;
    const fetchCity = async () => {
      try {
        const saved =
          (await AsyncStorage.getItem('@mediunify_selected_city')) ||
          (await AsyncStorage.getItem('@unnathi_user_location'));
        if (isMounted && saved) {
          setStoredCity(saved);
        }
      } catch (e) {
        // Fallback default
      }
    };
    fetchCity();
    return () => {
      isMounted = false;
    };
  }, []);

  // Home Screen is the source of truth for location
  const activeCity =
    route?.params?.city ||
    route?.params?.location ||
    storedCity ||
    'Mysuru';

  // Responsive grid calculation for Mobile & Tablet (iOS, Android, iPad, Android Tablet)
  const isTablet = width >= 768;
  const numColumns = width >= 900 ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isTablet ? 24 : 16;
  const gap = isTablet ? 14 : 12;
  const cardWidth = Math.floor(
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns
  );

  // Filter services by search keywords
  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ALL_SERVICES;
    return ALL_SERVICES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Navigate to existing service workflow
  const handleServicePress = (service) => {
    navigation.navigate(service.route, {
      city: activeCity,
      location: activeCity,
    });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER: ← All Services with Home Screen Location badge */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>All Services</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={13} color="#007D69" />
            <Text style={styles.locationBadgeText} numberOfLines={1}>
              {activeCity}
            </Text>
          </View>
        </View>
      </View>

      {/* SEARCH BAR (reusing existing lightweight search) */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all services..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SERVICES GRID */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Count summary */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredServices.length}{' '}
            {filteredServices.length === 1 ? 'service available' : 'services available'}
          </Text>
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Text style={styles.clearSearchLink}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching service found</Text>
            <Text style={styles.emptySub}>
              Try searching for Doctor, Medicine, Lab Tests, Scan, or Nursing
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => setSearchQuery('')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyResetBtnText}>View All Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.gridContainer, { gap }]}>
            {filteredServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  { width: cardWidth },
                  isTablet && styles.serviceCardTablet,
                ]}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.72}
              >
                {/* Clean Icon Container */}
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: service.iconBg },
                    isTablet && styles.iconBoxTablet,
                  ]}
                >
                  <Ionicons
                    name={service.icon}
                    size={isTablet ? 30 : 26}
                    color={service.iconColor}
                  />
                </View>

                {/* Short Service Name */}
                <Text
                  style={[
                    styles.serviceName,
                    isTablet && styles.serviceNameTablet,
                  ]}
                  numberOfLines={2}
                >
                  {service.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: Platform.OS === 'ios' ? 40 : 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
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
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F8F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    maxWidth: 140,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007D69',
  },
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  clearSearchLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007D69',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
    minHeight: 116,
  },
  serviceCardTablet: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    minHeight: 136,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconBoxTablet: {
    width: 60,
    height: 60,
    borderRadius: 18,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 18,
  },
  serviceNameTablet: {
    fontSize: 15,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyResetBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: '#007D69',
    borderRadius: 20,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AllServicesScreen;
