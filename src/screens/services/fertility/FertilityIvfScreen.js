import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fertilitySpecialists,
  fertilityTreatments,
  partnerFertilityCenters,
  fertilityFaqs,
  samplePatientJourneys,
  dedicatedCareCoordinator,
} from '../../../data/fertilityData';
import {
  FertilityDoctorCard,
  FertilityServiceCard,
  ClinicCard,
} from '../../../components/fertility';
import WebFooter from '../../../components/web/WebFooter';

const QUICK_SERVICES = [
  { id: 'specialists', label: 'Find Doctors', icon: 'people', route: 'FertilitySpecialists', color: '#0F766E', bg: '#F0FDFA' },
  { id: 'clinics', label: 'IVF Clinics', icon: 'business', route: 'FertilityClinics', color: '#0284C7', bg: '#F0F9FF' },
  { id: 'care-request', label: 'Care Request', icon: 'document-text', route: 'FertilityCareRequest', color: '#7C3AED', bg: '#FAF5FF' },
  { id: 'trackers', label: 'Cycle Tracker', icon: 'pulse', route: 'MyFertilityJourney', color: '#E11D48', bg: '#FFF1F2' },
  { id: 'tests', label: 'Fertility Tests', icon: 'flask', route: 'FertilityTests', color: '#D97706', bg: '#FFFBEB' },
  { id: 'packages', label: 'IVF Packages', icon: 'card', route: 'IVFPackage', color: '#059669', bg: '#ECFDF5' },
  { id: 'records', label: 'Records Vault', icon: 'folder-open', route: 'FertilityRecords', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'ai', label: 'Fertility AI', icon: 'sparkles', route: 'FertilityAI', color: '#BE123C', bg: '#FFF1F2' },
];

const TRUST_METRICS = [
  { value: '74.2%', label: 'Cumulative Success', icon: 'ribbon-outline', color: '#0F766E' },
  { value: '12,000+', label: 'Happy Families', icon: 'heart-outline', color: '#E11D48' },
  { value: '100%', label: 'Private & Secure', icon: 'shield-checkmark-outline', color: '#0284C7' },
];

const FertilityIvfScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  const activeIui = samplePatientJourneys.iui;
  const coordinator = dedicatedCareCoordinator;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Mobile-Native App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Fertility & IVF Care
          </Text>
          <View style={styles.headerSubRow}>
            <Ionicons name="shield-checkmark" size={11} color="#059669" />
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Personalized, Discreet & Accredited
            </Text>
          </View>
        </View>

        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('FertilityNotifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={19} color="#0F172A" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}
            onPress={() => navigation.navigate('FertilityAI')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={17} color="#0F766E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('FertilitySpecialists')}
          activeOpacity={0.85}
        >
          <Ionicons name="search-outline" size={17} color="#0F766E" />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search doctors, clinics, IVF packages, AMH tests...
          </Text>
          <View style={styles.searchFilterBadge}>
            <Ionicons name="options-outline" size={13} color="#0F766E" />
          </View>
        </TouchableOpacity>

        {/* Compact Mobile Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroPill}>
              <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
              <Text style={styles.heroPillText}>100% PRIVATE • ART ACT 2021</Text>
            </View>
            <View style={styles.heroEmiBadge}>
              <Text style={styles.heroEmiText}>ICMR & ART ACCREDITED</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Compassionate Fertility Care & Science
          </Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            Senior reproductive endocrinologists, ISO-5 cleanrooms & transparent pricing.
          </Text>

          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate('FertilityCareRequest')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroPrimaryBtnText}>Start Care Request</Text>
              <Ionicons name="arrow-forward" size={13} color="#0F766E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate('FertilitySpecialists')}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
              <Text style={styles.heroSecondaryBtnText}>Book Specialist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Cycle Status Card */}
        <TouchableOpacity
          style={styles.activeCycleCard}
          onPress={() => navigation.navigate('IUIJourney')}
          activeOpacity={0.9}
        >
          <View style={styles.activeCycleHeader}>
            <View style={styles.activeCycleBadgeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeCycleBadge}>LIVE JOURNEY • DAY {activeIui.cycleDay}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#0F766E" />
          </View>
          <Text style={styles.activeCycleTitle}>IUI Ovulation Stimulation Protocol</Text>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: '50%' }]} />
          </View>
          <View style={styles.activeCycleFooter}>
            <View style={styles.alertPill}>
              <Ionicons name="alarm-outline" size={11} color="#0F766E" />
              <Text style={styles.alertPillText} numberOfLines={1}>
                Trigger injection (Inj Ovidrel) due tonight at 09:00 PM
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 4x2 Essential Services Grid (Symmetrical Mobile Layout) */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionHeaderTitle}>Essential Fertility Services</Text>
          <View style={styles.servicesGrid}>
            {QUICK_SERVICES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceTile}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.75}
              >
                <View style={[styles.serviceIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.serviceLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trust Metrics Strip */}
        <View style={styles.trustBar}>
          {TRUST_METRICS.map((metric, idx) => (
            <View
              key={metric.label}
              style={[
                styles.trustCol,
                idx < TRUST_METRICS.length - 1 && styles.trustColBorder,
              ]}
            >
              <Ionicons name={metric.icon} size={15} color={metric.color} />
              <Text style={[styles.trustVal, { color: metric.color }]}>{metric.value}</Text>
              <Text style={styles.trustLbl}>{metric.label}</Text>
            </View>
          ))}
        </View>

        {/* Featured Specialists Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Senior Fertility Specialists</Text>
            <Text style={styles.sectionSubtitle}>
              Reproductive Endocrinologists, Andrologists & Embryologists
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('FertilitySpecialists')}
            style={styles.viewAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={12} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {isDesktopWeb ? (
          <View style={[styles.cardGrid, styles.desktopTwoCol]}>
            {fertilitySpecialists.slice(0, 4).map((doc) => (
              <View key={doc.id} style={styles.colHalf}>
                <FertilityDoctorCard
                  doctor={doc}
                  onPress={(d) =>
                    navigation.navigate('FertilityDoctorProfile', { doctor: d })
                  }
                  onBook={(d) =>
                    navigation.navigate('FertilityDoctorProfile', {
                      doctor: d,
                      autoFocusBooking: true,
                    })
                  }
                />
              </View>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollList}
          >
            {fertilitySpecialists.slice(0, 5).map((doc) => (
              <View key={doc.id} style={styles.horizontalDoctorCardWrap}>
                <FertilityDoctorCard
                  doctor={doc}
                  onPress={(d) =>
                    navigation.navigate('FertilityDoctorProfile', { doctor: d })
                  }
                  onBook={(d) =>
                    navigation.navigate('FertilityDoctorProfile', {
                      doctor: d,
                      autoFocusBooking: true,
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Featured IVF Clinics & Hospitals */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Accredited IVF Centers</Text>
            <Text style={styles.sectionSubtitle}>
              Modular ISO Cleanrooms & 70%+ Clinical Pregnancy Rates
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('FertilityClinics')}
            style={styles.viewAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={12} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {isDesktopWeb ? (
          <View style={[styles.cardGrid, styles.desktopTwoCol]}>
            {partnerFertilityCenters.slice(0, 2).map((clinic) => (
              <View key={clinic.id} style={styles.colHalf}>
                <ClinicCard
                  clinic={clinic}
                  onPress={(c, tab) =>
                    navigation.navigate('FertilityClinicProfile', {
                      clinic: c,
                      initialTab: tab || 'overview',
                    })
                  }
                  onCompare={() =>
                    navigation.navigate('CompareClinics', {
                      initialClinics: [partnerFertilityCenters[0], partnerFertilityCenters[1]],
                    })
                  }
                />
              </View>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollList}
          >
            {partnerFertilityCenters.slice(0, 4).map((clinic) => (
              <View key={clinic.id} style={styles.horizontalClinicCardWrap}>
                <ClinicCard
                  clinic={clinic}
                  onPress={(c, tab) =>
                    navigation.navigate('FertilityClinicProfile', {
                      clinic: c,
                      initialTab: tab || 'overview',
                    })
                  }
                  onCompare={() =>
                    navigation.navigate('CompareClinics', {
                      initialClinics: [partnerFertilityCenters[0], partnerFertilityCenters[1]],
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Popular Treatment Pathways */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Treatment Pathways</Text>
            <Text style={styles.sectionSubtitle}>
              Transparent Inclusions, Cryo-Preservation & Ethical Care
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('TreatmentDetails')}
            style={styles.viewAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>Explore</Text>
            <Ionicons name="chevron-forward" size={12} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {isDesktopWeb ? (
          <View style={[styles.cardGrid, styles.desktopTwoCol]}>
            {fertilityTreatments.slice(0, 2).map((treatment) => (
              <View key={treatment.id} style={styles.colHalf}>
                <FertilityServiceCard
                  treatment={treatment}
                  onPress={() => navigation.navigate('TreatmentDetails')}
                  onBook={() =>
                    navigation.navigate('FertilityCareRequest', {
                      selectedTreatment: treatment,
                    })
                  }
                />
              </View>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollList}
          >
            {fertilityTreatments.map((treatment) => (
              <View key={treatment.id} style={styles.horizontalTreatmentCardWrap}>
                <FertilityServiceCard
                  treatment={treatment}
                  onPress={() => navigation.navigate('TreatmentDetails')}
                  onBook={() =>
                    navigation.navigate('FertilityCareRequest', {
                      selectedTreatment: treatment,
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Dedicated Care Coordinator Banner */}
        <View style={styles.coordinatorCard}>
          <Image source={{ uri: coordinator.avatar }} style={styles.coordinatorImg} />
          <View style={styles.coordinatorInfo}>
            <View style={styles.coordBadge}>
              <Text style={styles.coordBadgeText}>COMPLIMENTARY CARE BUDDY</Text>
            </View>
            <Text style={styles.coordName}>{coordinator.name}</Text>
            <Text style={styles.coordRole} numberOfLines={2}>
              Dedicated patient navigator for scan schedules, injection alerts & insurance assistance.
            </Text>
            <TouchableOpacity
              style={styles.coordChatBtn}
              onPress={() => navigation.navigate('FertilityCoordinator')}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubbles" size={13} color="#FFFFFF" />
              <Text style={styles.coordChatBtnText}>Chat with Swathi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Assistant Banner */}
        <TouchableOpacity
          style={styles.aiBannerCard}
          onPress={() => navigation.navigate('FertilityAI')}
          activeOpacity={0.9}
        >
          <View style={styles.aiBannerIconWrap}>
            <Ionicons name="sparkles" size={20} color="#0F766E" />
          </View>
          <View style={styles.aiBannerInfo}>
            <Text style={styles.aiBannerTitle}>Have questions about AMH or IVF?</Text>
            <Text style={styles.aiBannerSub} numberOfLines={2}>
              Ask MediUnify AI for instant, empathetic guidance on tests, diets, and protocols.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#0F766E" />
        </TouchableOpacity>

        {/* Patient FAQs */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <Text style={styles.sectionSubtitle}>
              Evidence-based answers to common fertility concerns
            </Text>
          </View>
        </View>

        <View style={styles.faqList}>
          {fertilityFaqs.map((faq, index) => {
            const isExpanded = expandedFaqIndex === index;
            const itemKey = faq.id || `faq-item-${index}`;
            const questionText = faq.question || faq.q;
            const answerText = faq.answer || faq.a;
            return (
              <TouchableOpacity
                key={itemKey}
                style={styles.faqItem}
                onPress={() =>
                  setExpandedFaqIndex(isExpanded ? -1 : index)
                }
                activeOpacity={0.8}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestion}>{questionText}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#64748B"
                  />
                </View>
                {isExpanded && <Text style={styles.faqAnswer}>{answerText}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  desktopContainer: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
  },
  searchFilterBadge: {
    padding: 3,
    borderRadius: 5,
    backgroundColor: '#F0FDFA',
  },
  heroBanner: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  heroPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroEmiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  heroEmiText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#CCFBF1',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#CCFBF1',
    lineHeight: 15,
    marginBottom: 12,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroPrimaryBtn: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroPrimaryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroSecondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeCycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activeCycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeCycleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  activeCycleBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.3,
  },
  activeCycleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  progressBarWrap: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F766E',
    borderRadius: 2,
  },
  activeCycleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  alertPillText: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },
  servicesSection: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceTile: {
    width: '23.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 8,
  },
  serviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 12,
  },
  trustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  trustCol: {
    alignItems: 'center',
    flex: 1,
  },
  trustColBorder: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  trustVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  trustLbl: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  cardGrid: {
    marginBottom: 14,
  },
  desktopTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  colHalf: {
    width: '50%',
    paddingHorizontal: 8,
  },
  horizontalScrollList: {
    paddingRight: 16,
    gap: 12,
    marginBottom: 16,
  },
  horizontalDoctorCardWrap: {
    width: 285,
  },
  horizontalClinicCardWrap: {
    width: 305,
  },
  horizontalTreatmentCardWrap: {
    width: 280,
  },
  coordinatorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  coordinatorImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  coordinatorInfo: {
    flex: 1,
  },
  coordBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  coordBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#059669',
  },
  coordName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  coordRole: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 14,
  },
  coordChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  coordChatBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 16,
    gap: 10,
  },
  aiBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerInfo: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  aiBannerSub: {
    fontSize: 10.5,
    color: '#334155',
    marginTop: 1,
    lineHeight: 14,
  },
  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  faqItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
    lineHeight: 15,
  },
});

export default FertilityIvfScreen;
