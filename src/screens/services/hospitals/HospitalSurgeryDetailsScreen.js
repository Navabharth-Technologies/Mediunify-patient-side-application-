import React, { useMemo, useState } from 'react';
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
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import WebFooter from '../../../components/web/WebFooter';
import {
  getSurgeryHospitalById,
  surgerySpecialties,
} from '../../../data/surgeryHospitalsData';

const HospitalSurgeryDetailsScreen = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const { hospitalId, initialSpecialty } = route.params || {};
  const hospital = getSurgeryHospitalById(hospitalId);

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(
    initialSpecialty || 'all'
  );
  const [expandedSurgeryId, setExpandedSurgeryId] = useState(null);

  // Filter surgeries for this hospital
  const filteredSurgeries = useMemo(() => {
    return hospital.availableSurgeries.filter((surg) => {
      // 1. Search
      const query = search.toLowerCase();
      const matchesSearch =
        surg.name.toLowerCase().includes(query) ||
        surg.technique.toLowerCase().includes(query) ||
        surg.categoryLabel.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Specialty
      if (selectedSpecialty !== 'all' && surg.specialty !== selectedSpecialty) {
        return false;
      }

      return true;
    });
  }, [hospital, search, selectedSpecialty]);

  const openHospitalGps = () => {
    const lat = hospital.latitude;
    const lng = hospital.longitude;
    const label = encodeURIComponent(`${hospital.name}, ${hospital.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const handleRequestQuote = (surgery) => {
    navigation.navigate('SurgeryQuoteRequest', {
      hospital,
      surgery,
    });
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {hospital.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            Surgical Care & Procedures Catalog
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerCallBtn}
          activeOpacity={0.8}
          onPress={() => Linking.openURL(`tel:${hospital.phone}`)}
        >
          <Ionicons name="call" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DESKTOP BREADCRUMBS */}
        {isDesktopWeb && (
          <View style={styles.breadcrumbsRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HospitalCare')}>
              <Text style={styles.breadcrumbLink}>Hospitals & Surgeries</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbCurrent}>{hospital.name}</Text>
          </View>
        )}

        {/* ==================================================
            HOSPITAL HERO PROFILE CARD
        ================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.accreditTag}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              <Text style={styles.accreditTagText}>{hospital.accreditation}</Text>
            </View>

            <View style={styles.hoursTag}>
              <Ionicons name="time" size={13} color={colors.secondary} />
              <Text style={styles.hoursTagText}>{hospital.openHours}</Text>
            </View>
          </View>

          <Text style={styles.heroHospitalName}>{hospital.name}</Text>
          <Text style={styles.heroTagline}>{hospital.tagline}</Text>

          {/* ADDRESS */}
          <View style={styles.addressRow}>
            <Ionicons name="location" size={15} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.addressText}>{hospital.address}</Text>
          </View>

          {/* STATS GRID */}
          <View style={styles.statsGrid}>
            <View style={styles.statCol}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFA000" />
                <Text style={styles.statBold}>{hospital.rating}</Text>
              </View>
              <Text style={styles.statLabel}>({hospital.reviewCount} Reviews)</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statBold}>{hospital.icuBeds}</Text>
              <Text style={styles.statLabel}>Critical Care</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={[styles.statBold, { color: colors.primary }]}>
                {hospital.otCount}
              </Text>
              <Text style={styles.statLabel}>Surgical OTs</Text>
            </View>
          </View>

          {/* ACTION BUTTONS (CALL / DIRECTIONS) */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.heroCallBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${hospital.phone}`)}
            >
              <Ionicons name="call" size={15} color={colors.secondary} />
              <Text style={styles.heroCallBtnText}>Call Surgery Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroDirectionsBtn}
              activeOpacity={0.8}
              onPress={openHospitalGps}
            >
              <Ionicons name="navigate" size={15} color={colors.primary} />
              <Text style={styles.heroDirectionsBtnText}>Directions (GPS)</Text>
            </TouchableOpacity>
          </View>

          {/* CASHLESS INSURANCE TPA SUPPORTED */}
          <View style={styles.insuranceSection}>
            <Text style={styles.insuranceTitle}>Cashless Insurance & TPA Partners:</Text>
            <View style={styles.insuranceTagsWrap}>
              {hospital.cashlessInsurance.map((ins, i) => (
                <View key={i} style={styles.insuranceTag}>
                  <Ionicons name="checkmark-circle" size={11} color="#059669" />
                  <Text style={styles.insuranceTagText}>{ins}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ==================================================
            SEARCH SURGERIES IN THIS HOSPITAL
        ================================================== */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search surgeries in ${hospital.name.split(' ')[0]}...`}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ==================================================
            SPECIALTY SELECTOR PILLS
        ================================================== */}
        {Platform.OS === 'web' ? (
          <View style={styles.specialtiesWrap}>
            {surgerySpecialties.map((spec) => {
              const isSelected = selectedSpecialty === spec.id;
              const countInHosp =
                spec.id === 'all'
                  ? hospital.availableSurgeries.length
                  : hospital.availableSurgeries.filter((s) => s.specialty === spec.id).length;

              if (spec.id !== 'all' && countInHosp === 0) return null;

              return (
                <TouchableOpacity
                  key={spec.id}
                  style={[
                    styles.specialtyPill,
                    isSelected && styles.specialtyPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSpecialty(spec.id)}
                >
                  <Text
                    style={[
                      styles.specialtyPillText,
                      isSelected && styles.specialtyPillTextActive,
                    ]}
                  >
                    {spec.name} ({countInHosp})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScroll}
          >
            {surgerySpecialties.map((spec) => {
              const isSelected = selectedSpecialty === spec.id;
              const countInHosp =
                spec.id === 'all'
                  ? hospital.availableSurgeries.length
                  : hospital.availableSurgeries.filter((s) => s.specialty === spec.id).length;

              if (spec.id !== 'all' && countInHosp === 0) return null;

              return (
                <TouchableOpacity
                  key={spec.id}
                  style={[
                    styles.specialtyPill,
                    isSelected && styles.specialtyPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSpecialty(spec.id)}
                >
                  <Text
                    style={[
                      styles.specialtyPillText,
                      isSelected && styles.specialtyPillTextActive,
                    ]}
                  >
                    {spec.name} ({countInHosp})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ==================================================
            SURGERY PROCEDURES LIST
        ================================================== */}
        <View style={styles.surgeriesListSection}>
          <Text style={styles.sectionHeaderTitle}>
            Available Procedures ({filteredSurgeries.length})
          </Text>
          <Text style={styles.sectionHeaderSub}>
            Select a surgery to request a customized hospital quote & insurance check.
          </Text>

          {filteredSurgeries.map((surg) => {
            const isExpanded = expandedSurgeryId === surg.id;

            return (
              <View key={surg.id} style={styles.surgeryCard}>
                {/* SURGERY TITLE & TECHNIQUE */}
                <View style={styles.surgeryCardHeader}>
                  <View style={styles.surgeryCategoryBadge}>
                    <Text style={styles.surgeryCategoryText}>{surg.categoryLabel}</Text>
                  </View>
                  <View style={styles.stayBadge}>
                    <Ionicons name="bed" size={11} color={colors.secondary} />
                    <Text style={styles.stayBadgeText}>{surg.stayRequired}</Text>
                  </View>
                </View>

                <Text style={styles.surgeryName}>{surg.name}</Text>

                {/* TECHNIQUE & RECOVERY */}
                <View style={styles.procedureMetaBox}>
                  <View style={styles.procedureMetaRow}>
                    <Ionicons name="sparkles" size={13} color={colors.primary} />
                    <Text style={styles.procedureMetaLabel}>Technique: </Text>
                    <Text style={styles.procedureMetaVal}>{surg.technique}</Text>
                  </View>
                  <View style={styles.procedureMetaRow}>
                    <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
                    <Text style={styles.procedureMetaLabel}>Anesthesia: </Text>
                    <Text style={styles.procedureMetaVal}>{surg.anesthesia}</Text>
                  </View>
                  <View style={styles.procedureMetaRow}>
                    <Ionicons name="walk" size={13} color="#059669" />
                    <Text style={styles.procedureMetaLabel}>Recovery: </Text>
                    <Text style={styles.procedureMetaVal}>{surg.recovery}</Text>
                  </View>
                </View>

                {/* EXPANDABLE INCLUSIONS */}
                {isExpanded && (
                  <View style={styles.inclusionsBox}>
                    <Text style={styles.inclusionsTitle}>Surgery Package Inclusions:</Text>
                    {surg.inclusions.map((inc, i) => (
                      <View key={i} style={styles.inclusionItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text style={styles.inclusionItemText}>{inc}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.toggleInclusionsBtn}
                  onPress={() =>
                    setExpandedSurgeryId(isExpanded ? null : surg.id)
                  }
                >
                  <Text style={styles.toggleInclusionsText}>
                    {isExpanded ? 'Hide Package Inclusions ▲' : 'View Package Inclusions ▼'}
                  </Text>
                </TouchableOpacity>

                {/* FOOTER: QUOTE BADGE & REQUEST QUOTE BUTTON */}
                <View style={styles.surgeryCardFooter}>
                  <View style={styles.quoteStatusBox}>
                    <Text style={styles.quoteStatusLabel}>Price & Package Cost</Text>
                    <Text style={styles.quoteStatusValue}>
                      Provided by Hospital Desk
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.requestQuoteBtn}
                    activeOpacity={0.88}
                    onPress={() => handleRequestQuote(surg)}
                  >
                    <Ionicons name="calculator-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.requestQuoteBtnText}>Get Price Quote</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {isDesktopWeb && (
          <View style={{ width: '100%', marginTop: 40, marginHorizontal: -16 }}>
            <WebFooter />
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '600',
  },
  breadcrumbSlash: {
    fontSize: 12,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
  headerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accreditTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  accreditTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  hoursTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  hoursTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  heroHospitalName: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.secondary,
  },
  heroTagline: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 5,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  heroCallBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  heroCallBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondary,
  },
  heroDirectionsBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  heroDirectionsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },

  // INSURANCE TAGS
  insuranceSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  insuranceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 6,
  },
  insuranceTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  insuranceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  insuranceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },

  // SEARCH BOX
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
    color: colors.text,
  },

  // SPECIALTY PILLS
  specialtiesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 10,
    rowGap: 8,
  },
  specialtyPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  specialtyPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  specialtyPillTextActive: {
    color: '#FFFFFF',
  },

  // SURGERIES LIST
  surgeriesListSection: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },

  surgeryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  surgeryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  surgeryCategoryBadge: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  surgeryCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  stayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  stayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  surgeryName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },

  procedureMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 8,
  },
  procedureMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  procedureMetaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  procedureMetaVal: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },

  inclusionsBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 8,
  },
  inclusionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  inclusionItemText: {
    fontSize: 11,
    color: '#14532D',
    flex: 1,
  },

  toggleInclusionsBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  toggleInclusionsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  surgeryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quoteStatusBox: {
    flex: 1,
  },
  quoteStatusLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  quoteStatusValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  requestQuoteBtn: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  requestQuoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HospitalSurgeryDetailsScreen;
