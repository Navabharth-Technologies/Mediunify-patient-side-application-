import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { partnerFertilityCenters, fertilitySpecialists } from '../../../data/fertilityData';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const TABS = [
  { id: 'doctors', label: 'Available Doctors', icon: 'people' },
  { id: 'overview', label: 'About & Facilities', icon: 'business' },
  { id: 'procedures', label: 'Procedures & Tech', icon: 'flask' },
  { id: 'packages', label: 'Packages & EMI', icon: 'card' },
];

const FertilityClinicProfileScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const clinic = route?.params?.clinic || partnerFertilityCenters[0];
  const initialTab = route?.params?.initialTab || 'doctors';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedDocFilter, setSelectedDocFilter] = useState('all'); // 'all' | 'today'

  // Robust doctor association by clinicId, doctorIds list, or clinicName match
  const associatedDoctors = useMemo(() => {
    return fertilitySpecialists.filter((d) => {
      if (d.clinicId && clinic.id && d.clinicId === clinic.id) return true;
      if (clinic.doctorIds && clinic.doctorIds.includes(d.id)) return true;
      if (
        clinic.doctorsList &&
        clinic.doctorsList.some((docName) =>
          d.name.toLowerCase().includes(docName.toLowerCase())
        )
      ) {
        return true;
      }
      if (
        d.clinicName &&
        clinic.name &&
        (d.clinicName.toLowerCase().includes(clinic.name.toLowerCase()) ||
          clinic.name.toLowerCase().includes(d.clinicName.toLowerCase()) ||
          d.clinicName.toLowerCase().includes(clinic.name.split(' ')[0].toLowerCase()))
      ) {
        return true;
      }
      return false;
    });
  }, [clinic]);

  const displayedDoctors = useMemo(() => {
    if (selectedDocFilter === 'today') {
      return associatedDoctors.filter((d) => d.availableToday);
    }
    return associatedDoctors;
  }, [associatedDoctors, selectedDocFilter]);

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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {clinic.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {associatedDoctors.length} Specialists Available
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => showAlert('Share', `Sharing ${clinic.name}`)}
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
        {/* Cover Image */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: clinic.image }} style={styles.coverImage} />
          <View style={styles.coverOverlayBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.coverOverlayText}>ICMR Registered & Verified</Text>
          </View>
        </View>

        {/* Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{clinic.rating}</Text>
              <Text style={styles.reviewsText}>({clinic.reviewsCount} reviews)</Text>
            </View>
            <View style={styles.successBadge}>
              <Ionicons name="ribbon" size={13} color="#E11D48" />
              <Text style={styles.successText}>{clinic.successRate} Clinical Success</Text>
            </View>
          </View>

          <Text style={styles.clinicName}>{clinic.name}</Text>
          <Text style={styles.clinicTagline}>{clinic.tagline}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color="#64748B" />
            <Text style={styles.locationText}>{clinic.address}</Text>
          </View>

          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactChip}
              onPress={() => Linking.openURL(`tel:${clinic.phone}`)}
            >
              <Ionicons name="call-outline" size={13} color="#0F172A" />
              <Text style={styles.contactChipText}>{clinic.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactChip, { backgroundColor: '#FEF2F2' }]}
              onPress={() => Linking.openURL(`tel:${clinic.emergencyContact}`)}
            >
              <Ionicons name="alert-circle-outline" size={13} color="#DC2626" />
              <Text style={[styles.contactChipText, { color: '#DC2626' }]}>24/7 Helpline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badgeCount = tab.id === 'doctors' ? associatedDoctors.length : null;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isActive ? tab.icon : `${tab.icon}-outline`}
                  size={15}
                  color={isActive ? '#0F766E' : '#64748B'}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {badgeCount !== null && (
                  <View
                    style={[styles.tabBadge, isActive && styles.tabBadgeActive]}
                  >
                    <Text
                      style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}
                    >
                      {badgeCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ==================================================
            TAB 1: AVAILABLE DOCTORS LIST
        ================================================== */}
        {activeTab === 'doctors' && (
          <View style={styles.tabContentSection}>
            {/* Header & Filter Row */}
            <View style={styles.docHeaderContainer}>
              <View>
                <Text style={styles.sectionTitle}>
                  Specialists Practicing at this Clinic
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {associatedDoctors.length} Verified Reproductive Endocrinologists, Andrologists & Embryologists
                </Text>
              </View>

              <View style={styles.filterChipGroup}>
                <TouchableOpacity
                  style={[
                    styles.subFilterPill,
                    selectedDocFilter === 'all' && styles.subFilterPillActive,
                  ]}
                  onPress={() => setSelectedDocFilter('all')}
                >
                  <Text
                    style={[
                      styles.subFilterText,
                      selectedDocFilter === 'all' && styles.subFilterTextActive,
                    ]}
                  >
                    All ({associatedDoctors.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.subFilterPill,
                    selectedDocFilter === 'today' && styles.subFilterPillActive,
                  ]}
                  onPress={() => setSelectedDocFilter('today')}
                >
                  <Ionicons
                    name="flash"
                    size={11}
                    color={selectedDocFilter === 'today' ? '#0F766E' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.subFilterText,
                      selectedDocFilter === 'today' && styles.subFilterTextActive,
                    ]}
                  >
                    Available Today
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Doctors Cards List */}
            {displayedDoctors.length > 0 ? (
              displayedDoctors.map((doc) => (
                <View key={doc.id} style={styles.richDocCard}>
                  <View style={styles.richDocTopRow}>
                    <View style={styles.docImageContainer}>
                      <Image source={{ uri: doc.image }} style={styles.richDocImage} />
                      <View
                        style={[
                          styles.onlineIndicator,
                          doc.availableToday ? styles.indicatorOnline : styles.indicatorNextDay,
                        ]}
                      />
                    </View>

                    <View style={styles.richDocMain}>
                      <View style={styles.docNameBadgeRow}>
                        <Text style={styles.richDocName}>{doc.name}</Text>
                        <Ionicons name="checkmark-circle" size={15} color="#059669" />
                      </View>
                      <Text style={styles.richDocSpecialty}>{doc.specialty}</Text>
                      <Text style={styles.richDocQual} numberOfLines={2}>
                        {doc.qualification}
                      </Text>

                      <View style={styles.docStatsRow}>
                        <View style={styles.docStatPill}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.docStatText}>{doc.rating}</Text>
                          <Text style={styles.docStatSub}>({doc.reviewsCount})</Text>
                        </View>
                        <View style={styles.docStatPill}>
                          <Ionicons name="briefcase-outline" size={12} color="#0284C7" />
                          <Text style={styles.docStatText}>{doc.experienceYears}+ Yrs</Text>
                        </View>
                        <View style={[styles.docStatPill, { backgroundColor: '#FFF1F2' }]}>
                          <Ionicons name="ribbon-outline" size={12} color="#E11D48" />
                          <Text style={[styles.docStatText, { color: '#E11D48' }]}>
                            {doc.successRate.split(' ')[0]} Success
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Specializations Tags */}
                  <View style={styles.specTagsWrap}>
                    {doc.specializations.slice(0, 3).map((tag, idx) => (
                      <View key={idx} style={styles.specTagPill}>
                        <Text style={styles.specTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Consultation Fee & Slots */}
                  <View style={styles.slotsBanner}>
                    <View style={styles.feeInfoCol}>
                      <Text style={styles.feeLabel}>Consultation Fee</Text>
                      <Text style={styles.feeValue}>₹{doc.fee}</Text>
                    </View>
                    <View style={styles.slotsCol}>
                      <View style={styles.slotsHeaderRow}>
                        <Ionicons
                          name={doc.availableToday ? 'time' : 'calendar-outline'}
                          size={12}
                          color={doc.availableToday ? '#059669' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.slotsNotice,
                            doc.availableToday && { color: '#059669', fontWeight: '700' },
                          ]}
                        >
                          {doc.availableToday ? 'Available Today:' : 'Next Available:'}
                        </Text>
                      </View>
                      <View style={styles.slotChipsRow}>
                        {doc.slots.slice(0, 3).map((slot, sIdx) => (
                          <View key={sIdx} style={styles.slotChip}>
                            <Text style={styles.slotChipText}>{slot}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.viewProfileBtn}
                      onPress={() =>
                        navigation.navigate('FertilityDoctorProfile', { doctor: doc })
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="person-outline" size={14} color="#0F766E" />
                      <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookDocBtn}
                      onPress={() =>
                        navigation.navigate('FertilityDoctorProfile', {
                          doctor: doc,
                          autoFocusBooking: true,
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="calendar" size={15} color="#FFFFFF" />
                      <Text style={styles.bookDocBtnText}>Book Consultation</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyDocBox}>
                <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyDocTitle}>No Doctors Available for this Filter</Text>
                <Text style={styles.emptyDocSub}>
                  Switch to "All" to view the complete specialist team practicing at this clinic.
                </Text>
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => setSelectedDocFilter('all')}
                >
                  <Text style={styles.resetFilterText}>Show All Specialists</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ==================================================
            TAB 2: ABOUT & FACILITIES
        ================================================== */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentSection}>
            {/* Quick Doctors Teaser Banner */}
            <TouchableOpacity
              style={styles.doctorsTeaserBanner}
              onPress={() => setActiveTab('doctors')}
              activeOpacity={0.85}
            >
              <View style={styles.teaserLeft}>
                <View style={styles.teaserIconBox}>
                  <Ionicons name="medical" size={20} color="#0F766E" />
                </View>
                <View>
                  <Text style={styles.teaserTitle}>
                    {associatedDoctors.length} Doctors Available at this Clinic
                  </Text>
                  <Text style={styles.teaserSub}>
                    {associatedDoctors.map((d) => d.name).slice(0, 2).join(', ')}
                  </Text>
                </View>
              </View>
              <View style={styles.teaserAction}>
                <Text style={styles.teaserActionText}>View Doctors</Text>
                <Ionicons name="chevron-forward" size={15} color="#0F766E" />
              </View>
            </TouchableOpacity>

            {/* Accreditations */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Quality Accreditations & ART Registry</Text>
              <View style={styles.badgeWrap}>
                {clinic.certifications.map((cert, index) => (
                  <View key={index} style={styles.certPill}>
                    <Ionicons name="shield-checkmark" size={13} color="#059669" />
                    <Text style={styles.certPillText}>{cert}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Embryology Lab & Clinical Facilities */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Embryology Lab & Cleanroom Infrastructure</Text>
              <View style={styles.facilitiesList}>
                {clinic.facilities.map((fac, idx) => (
                  <View key={idx} style={styles.facItem}>
                    <Ionicons name="checkmark-done-circle" size={16} color="#0F766E" />
                    <Text style={styles.facText}>{fac}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cashless Insurance Partners */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Cashless Insurance & 0% EMI Desk</Text>
              <View style={styles.insurancePillRow}>
                {clinic.insuranceCashless.map((ins, idx) => (
                  <View key={idx} style={styles.insurancePill}>
                    <Ionicons name="card-outline" size={13} color="#0284C7" />
                    <Text style={styles.insuranceText}>{ins}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ==================================================
            TAB 3: PROCEDURES & TECH
        ================================================== */}
        {activeTab === 'procedures' && (
          <View style={styles.tabContentSection}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Clinical Procedures Offered</Text>
              <Text style={styles.sectionSubtitle}>
                Standardized protocols performed in Class 10,000 embryology cleanrooms.
              </Text>
              <View style={styles.procGrid}>
                {clinic.procedures.map((proc, idx) => (
                  <View key={idx} style={styles.procChip}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#0F766E" />
                    <Text style={styles.procText}>{proc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ==================================================
            TAB 4: PACKAGES & EMI
        ================================================== */}
        {activeTab === 'packages' && (
          <View style={styles.tabContentSection}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Transparent Pricing & Financing</Text>
              <View style={styles.packagePricingBox}>
                <View style={styles.packageRow}>
                  <Text style={styles.packageRowLabel}>Initial Couple Evaluation</Text>
                  <Text style={styles.packageRowVal}>
                    Starts at ₹{clinic.startingPackagePrice.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.packageRowDivider} />
                <View style={styles.packageRow}>
                  <Text style={styles.packageRowLabel}>Comprehensive IVF + ICSI Cycle</Text>
                  <Text style={[styles.packageRowVal, { color: '#0F766E', fontSize: 16 }]}>
                    ₹{clinic.ivfPackagePrice.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.packageRowDivider} />
                <View style={styles.packageRow}>
                  <Text style={styles.packageRowLabel}>0% Interest EMI</Text>
                  <Text style={styles.packageRowVal}>
                    From ₹{Math.round(clinic.ivfPackagePrice / 18).toLocaleString('en-IN')}/mo
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.calcEmiActionBtn}
                onPress={() => navigation.navigate('IVFPackage')}
                activeOpacity={0.85}
              >
                <Ionicons name="calculator-outline" size={16} color="#0F766E" />
                <Text style={styles.calcEmiActionText}>Open 0% EMI Calculator</Text>
                <Ionicons name="arrow-forward" size={14} color="#0F766E" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.careRequestBtn}
          onPress={() =>
            navigation.navigate('FertilityCareRequest', { preferredClinic: clinic })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="document-text-outline" size={16} color="#0F766E" />
          <Text style={styles.careRequestBtnText}>Care Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.consultBtn}
          onPress={() => {
            if (activeTab !== 'doctors') {
              setActiveTab('doctors');
            } else if (associatedDoctors.length > 0) {
              navigation.navigate('FertilityDoctorProfile', {
                doctor: associatedDoctors[0],
                autoFocusBooking: true,
              });
            }
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar" size={16} color="#FFFFFF" />
          <Text style={styles.consultBtnText}>
            {activeTab === 'doctors' ? 'Book With Top Specialist' : 'View Available Doctors'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  desktopContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  coverWrap: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  coverOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  coverOverlayText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  reviewsText: {
    fontSize: 11,
    color: '#B45309',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  clinicName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  clinicTagline: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  contactChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0F766E',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#CCFBF1',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#0F766E',
  },
  tabContentSection: {
    padding: 16,
  },
  docHeaderContainer: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  filterChipGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  subFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subFilterPillActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  subFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  subFilterTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  richDocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  richDocTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  docImageContainer: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  richDocImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  indicatorOnline: {
    backgroundColor: '#10B981',
  },
  indicatorNextDay: {
    backgroundColor: '#F59E0B',
  },
  richDocMain: {
    flex: 1,
  },
  docNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  richDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  richDocSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 2,
  },
  richDocQual: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  docStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  docStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  docStatSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  specTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  specTagPill: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  specTagText: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: '600',
  },
  slotsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  feeInfoCol: {
    justifyContent: 'center',
  },
  feeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotsCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  slotsNotice: {
    fontSize: 10,
    color: '#64748B',
  },
  slotChipsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  slotChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipText: {
    fontSize: 9,
    color: '#334155',
    fontWeight: '600',
  },
  docActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0F766E',
    backgroundColor: '#FFFFFF',
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  bookDocBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0F766E',
  },
  bookDocBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyDocBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyDocTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyDocSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  resetFilterBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F766E',
    borderRadius: 8,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doctorsTeaserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  teaserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  teaserIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaserTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  teaserSub: {
    fontSize: 11,
    color: '#334155',
    marginTop: 1,
  },
  teaserAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  teaserActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  certPillText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  facilitiesList: {
    marginTop: 10,
    gap: 8,
  },
  facItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  facText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  insurancePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  insurancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  insuranceText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  procGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  procChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  procText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  packagePricingBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  packageRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  packageRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  packageRowDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  calcEmiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  calcEmiActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  careRequestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0F766E',
    backgroundColor: '#FFFFFF',
  },
  careRequestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  consultBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F766E',
  },
  consultBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FertilityClinicProfileScreen;
