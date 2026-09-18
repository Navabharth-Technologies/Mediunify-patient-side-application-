import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'consultation', label: 'Consultations' },
  { id: 'medicines', label: 'Meds & Labs' },
  { id: 'care', label: 'Home Care & Scans' },
  { id: 'wellness', label: 'Wellness' },
];

const ALL_SERVICES = [
  {
    id: 'doctors',
    category: 'consultation',
    title: 'Doctors & Clinics',
    subtitle: 'Book in-clinic appointments with 50+ verified specialists across Mysuru',
    icon: 'person',
    iconColor: '#00B894',
    iconBg: '#E6F8F4',
    badge: 'Instant Slots',
    badgeBg: '#CCFBF1',
    badgeColor: '#0D9488',
    route: 'DoctorList',
  },
  {
    id: 'videocall',
    category: 'consultation',
    title: 'Online Video Consultation',
    subtitle: 'Connect with top doctors via instant HD video call with digital prescription',
    icon: 'videocam',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    badge: '10-Min Connect',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
    route: 'VideoConsultation',
  },
  {
    id: 'pharmacy',
    category: 'medicines',
    title: 'Pharmacy & Medicines',
    subtitle: '100% genuine branded & affordable Jan Aushadhi generic medicines',
    icon: 'medkit',
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
    badge: 'Flat 20% OFF',
    badgeBg: '#FFEDD5',
    badgeColor: '#C2410C',
    route: 'Pharmacy',
  },
  {
    id: 'lab',
    category: 'medicines',
    title: 'Lab Tests & Health Checkups',
    subtitle: 'Diagnostic blood tests & comprehensive packages with doorstep sample collection',
    icon: 'flask',
    iconColor: '#0D9488',
    iconBg: '#F0FDFA',
    badge: 'Home Collection',
    badgeBg: '#CCFBF1',
    badgeColor: '#0F766E',
    route: 'LabTests',
  },
  {
    id: 'radiology',
    category: 'care',
    title: 'Radiology & Cardiology Scans',
    subtitle: '2D Echo, 12-Lead ECG, MRI, CT Scan, Ultrasound & X-Ray at accredited labs',
    icon: 'scan',
    iconColor: '#7C3AED',
    iconBg: '#FAF5FF',
    badge: 'Fast Reports',
    badgeBg: '#F3E8FF',
    badgeColor: '#6D28D9',
    route: 'RadiologyLabs',
  },
  {
    id: 'hospitals',
    category: 'consultation',
    title: 'Hospitals & Surgery Care',
    subtitle: 'Top NABH partner hospitals, cashless surgeries & admission assistance',
    icon: 'business',
    iconColor: '#1E3A8A',
    iconBg: '#EFF6FF',
    badge: 'Cashless Help',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    route: 'HospitalCare',
  },
  {
    id: 'nurse',
    category: 'care',
    title: 'Home Nursing Care',
    subtitle: 'Certified nursing attendants, post-op recovery, injections & elderly care at home',
    icon: 'home',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    badge: 'Verified Staff',
    badgeBg: '#D1FAE5',
    badgeColor: '#047857',
    route: 'NurseBooking',
  },
  {
    id: 'equipment',
    category: 'care',
    title: 'Medical Equipment Rental',
    subtitle: 'Hospital beds, oxygen concentrators, wheelchairs & BiPAP on rent or purchase',
    icon: 'fitness',
    iconColor: '#9333EA',
    iconBg: '#FAF5FF',
    badge: 'Sanitized & Tested',
    badgeBg: '#F3E8FF',
    badgeColor: '#7E22CE',
    route: 'EquipmentRental',
  },
  {
    id: 'fertility',
    category: 'care',
    title: 'Fertility & IVF Care',
    subtitle: 'Confidential IVF, IUI, fertility screening & advanced reproductive guidance',
    icon: 'heart',
    iconColor: '#DB2777',
    iconBg: '#FDF2F8',
    badge: '100% Confidential',
    badgeBg: '#FCE7F3',
    badgeColor: '#BE185D',
    route: 'FertilityIvf',
  },
  {
    id: 'ayurveda',
    category: 'wellness',
    title: 'Ayurveda & Wellness',
    subtitle: 'Certified Ayurvedic doctors, Panchakarma therapies & herbal health solutions',
    icon: 'leaf',
    iconColor: '#16A34A',
    iconBg: '#F0FDF4',
    badge: '100% Natural',
    badgeBg: '#DCFCE7',
    badgeColor: '#15803D',
    route: 'AyurvedaWellness',
  },
  {
    id: 'emergency',
    category: 'care',
    title: '24x7 Emergency & Ambulance',
    subtitle: 'Immediate GPS-tracked ambulance dispatch & critical helpline support',
    icon: 'warning',
    iconColor: '#DC2626',
    iconBg: '#FEF2F2',
    badge: '24/7 Available',
    badgeBg: '#FEE2E2',
    badgeColor: '#B91C1C',
    route: 'Emergency',
  },
  {
    id: 'insurance',
    category: 'wellness',
    title: 'Health Insurance & Claims',
    subtitle: 'Compare health insurance policies & cashless hospitalization claim assistance',
    icon: 'shield-checkmark',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    badge: 'Cashless Support',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
    route: 'HealthInsurance',
  },
  {
    id: 'healthmonitor',
    category: 'wellness',
    title: 'Health Vitals Monitor',
    subtitle: 'Track Blood Pressure, Blood Sugar, Heart Rate & BMI with personalized trends',
    icon: 'pulse',
    iconColor: '#E11D48',
    iconBg: '#FFF1F2',
    badge: 'Free Vitals Tool',
    badgeBg: '#FFE4E6',
    badgeColor: '#BE123C',
    route: 'HealthMonitor',
  },
];

const AllServicesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredServices = useMemo(() => {
    return ALL_SERVICES.filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' || service.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        service.title.toLowerCase().includes(q) ||
        service.subtitle.toLowerCase().includes(q) ||
        service.badge.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>All Healthcare Services</Text>
          <Text style={styles.headerSub}>Complete directory of healthcare solutions</Text>
        </View>
        <TouchableOpacity
          style={styles.emergencyQuickBtn}
          onPress={() => navigation.navigate('Emergency')}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={16} color="#DC2626" />
          <Text style={styles.emergencyQuickText}>24x7</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services (e.g., Doctor, Pharmacy, Scans...)"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORY FILTER CHIPS */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SERVICES LIST */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsInfoRow}>
          <Text style={styles.resultsCountText}>
            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
          </Text>
          {selectedCategory !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedCategory('all')}
              activeOpacity={0.7}
            >
              <Text style={styles.resetFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptySub}>
              Try searching with different keywords like Doctor, Lab, or Pharmacy
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate(service.route)}
              activeOpacity={0.85}
            >
              {/* Left Icon Container */}
              <View style={[styles.serviceIconWrap, { backgroundColor: service.iconBg }]}>
                <Ionicons name={service.icon} size={24} color={service.iconColor} />
              </View>

              {/* Center Content */}
              <View style={styles.serviceTextCol}>
                <View style={styles.serviceTitleRow}>
                  <Text style={styles.serviceTitle} numberOfLines={1}>
                    {service.title}
                  </Text>
                  <View style={[styles.serviceBadge, { backgroundColor: service.badgeBg }]}>
                    <Text style={[styles.serviceBadgeText, { color: service.badgeColor }]}>
                      {service.badge}
                    </Text>
                  </View>
                </View>
                <Text style={styles.serviceSubtitle} numberOfLines={2}>
                  {service.subtitle}
                </Text>
              </View>

              {/* Right Chevron */}
              <View style={styles.chevronWrap}>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
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
    paddingTop: 12,
    paddingBottom: 14,
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
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  emergencyQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  emergencyQuickText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
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
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  categoryScrollWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryChipActive: {
    backgroundColor: '#00B894',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  resetFilterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 6,
  },
  serviceTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  serviceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  chevronWrap: {
    paddingLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
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
    maxWidth: 260,
  },
  emptyResetBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#00B894',
    borderRadius: 20,
  },
  emptyResetBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AllServicesScreen;
