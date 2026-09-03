import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { videoDoctors, videoSpecialties } from '../../../data/videoDoctors';
import colors from '../../../theme/colors';

const LANGUAGES_LIST = ['All', 'English', 'Kannada', 'Hindi', 'Telugu', 'Malayalam'];

const VideoConsultationScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [minExperience, setMinExperience] = useState('all'); // 'all' | '5' | '10' | '15'
  const [maxFee, setMaxFee] = useState('all'); // 'all' | '500' | '700'
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [sortBy, setSortBy] = useState('earliest'); // 'earliest' | 'rating' | 'experience' | 'fee'

  // Selected Doctor for Profile Quick View Modal
  const [profileDoctor, setProfileDoctor] = useState(null);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSpecialty !== 'all') count++;
    if (selectedLanguage !== 'All') count++;
    if (minExperience !== 'all') count++;
    if (maxFee !== 'all') count++;
    if (onlyAvailableToday) count++;
    if (sortBy !== 'earliest') count++;
    return count;
  }, [selectedSpecialty, selectedLanguage, minExperience, maxFee, onlyAvailableToday, sortBy]);

  const resetFilters = () => {
    setSelectedSpecialty('all');
    setSelectedLanguage('All');
    setMinExperience('all');
    setMaxFee('all');
    setOnlyAvailableToday(false);
    setSortBy('earliest');
  };

  // Filtered & Sorted Doctors
  const filteredDoctors = useMemo(() => {
    let result = videoDoctors.filter((doc) => {
      // 1. Search
      const matchesSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
        doc.languages.some((l) => l.toLowerCase().includes(search.toLowerCase())) ||
        doc.about.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Specialty
      if (selectedSpecialty !== 'all' && doc.specialtyKey !== selectedSpecialty) {
        return false;
      }

      // 3. Language
      if (selectedLanguage !== 'All' && !doc.languages.includes(selectedLanguage)) {
        return false;
      }

      // 4. Experience
      if (minExperience !== 'all') {
        const expNum = parseInt(minExperience, 10);
        if (doc.experienceYears < expNum) return false;
      }

      // 5. Fee
      if (maxFee !== 'all') {
        const feeLimit = parseInt(maxFee, 10);
        if (doc.fee > feeLimit) return false;
      }

      // 6. Availability today
      if (onlyAvailableToday && !doc.availableToday) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'experience') {
        return b.experienceYears - a.experienceYears;
      }
      if (sortBy === 'fee') {
        return a.fee - b.fee;
      }
      // 'earliest' default
      if (a.availableToday && !b.availableToday) return -1;
      if (!a.availableToday && b.availableToday) return 1;
      return b.rating - a.rating;
    });

    return result;
  }, [search, selectedSpecialty, selectedLanguage, minExperience, maxFee, onlyAvailableToday, sortBy]);

  const renderDoctor = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* CARD HEADER: BADGE & ONLINE STATUS */}
        <View style={styles.cardHeader}>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>
              {item.availableToday ? 'Accepting Video Consultations' : 'Available Tomorrow'}
            </Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{item.discount}</Text>
          </View>
        </View>

        {/* DOCTOR MAIN ROW */}
        <TouchableOpacity
          style={styles.doctorMainRow}
          activeOpacity={0.88}
          onPress={() => setProfileDoctor(item)}
        >
          <Image source={{ uri: item.image }} style={styles.avatar} />

          <View style={styles.doctorInfoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.doctorName}>{item.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>

            <Text style={styles.specialtyText}>{item.specialty}</Text>
            <Text style={styles.qualificationText} numberOfLines={1}>
              {item.qualification}
            </Text>

            {/* EXPERIENCE & RATING CHIPS */}
            <View style={styles.metricsRow}>
              <View style={styles.experienceChip}>
                <Ionicons name="ribbon-outline" size={12} color="#D97706" />
                <Text style={styles.experienceChipText}>{item.experience}</Text>
              </View>

              <View style={styles.ratingChip}>
                <Ionicons name="star" size={12} color="#FFA000" />
                <Text style={styles.ratingChipText}>{item.rating}</Text>
                <Text style={styles.reviewsCountText}>({item.videoConsultCount}+ Calls)</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* LANGUAGES SPOKEN */}
        <View style={styles.languagesRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.secondary} />
          <Text style={styles.languagesLabel}>Speaks:</Text>
          <Text style={styles.languagesText} numberOfLines={1}>
            {item.languages.join(', ')}
          </Text>
        </View>

        {/* NEXT AVAILABLE SLOT & CONSULTATION FEE */}
        <View style={styles.slotAndFeeRow}>
          <View style={styles.slotBox}>
            <Ionicons name="videocam" size={13} color={colors.primary} />
            <Text style={styles.slotText}>{item.nextSlot}</Text>
          </View>

          <View style={styles.feeBox}>
            <Text style={styles.mrpText}>₹{item.mrpFee}</Text>
            <Text style={styles.feeAmount}>₹{item.fee}</Text>
          </View>
        </View>

        {/* DUAL ACTION BUTTONS: VIEW BIO & BOOK VIDEO CONSULTATION */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.bioButton}
            activeOpacity={0.82}
            onPress={() => setProfileDoctor(item)}
          >
            <Ionicons name="information-circle-outline" size={16} color={colors.secondary} />
            <Text style={styles.bioButtonText}>Doctor Bio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookVideoButton}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('VideoBooking', {
                doctor: item,
              })
            }
          >
            <Ionicons name="videocam" size={16} color="#FFFFFF" />
            <Text style={styles.bookVideoButtonText}>Book Video Slot</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
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
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Video Consultation</Text>
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.headerSubtitle}>Consult Top Certified Doctors Online</Text>
        </View>

        <TouchableOpacity
          style={[styles.filterHeaderBtn, activeFiltersCount > 0 && styles.filterHeaderBtnActive]}
          activeOpacity={0.8}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.secondary}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================
          HERO PROMO BANNER
      ================================================== */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <View style={styles.heroTag}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            <Text style={styles.heroTagText}>UNNATHI TELEHEALTH</Text>
          </View>
          <Text style={styles.heroTitle}>Connect with Specialist in 15 Mins</Text>
          <Text style={styles.heroDesc}>
            100% Private HD Video Call • Verified e-Prescription • Free Follow-up for 3 Days
          </Text>
        </View>
      </View>

      {/* ==================================================
          SEARCH BAR & FILTER CHIP
      ================================================== */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor, specialty, language..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterTriggerPill, activeFiltersCount > 0 && styles.filterTriggerPillActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="filter"
            size={14}
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.secondary}
          />
          <Text
            style={[
              styles.filterTriggerPillText,
              activeFiltersCount > 0 && styles.filterTriggerPillTextActive,
            ]}
          >
            {activeFiltersCount > 0 ? `${activeFiltersCount} Filters` : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================
          SPECIALTY SELECTOR PILLS
      ================================================== */}
      <View style={styles.specialtyContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesScroll}
        >
          {videoSpecialties.map((spec) => {
            const isSelected = selectedSpecialty === spec.id;
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
                <Ionicons
                  name={spec.icon}
                  size={15}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.specialtyPillText,
                    isSelected && styles.specialtyPillTextActive,
                  ]}
                >
                  {spec.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ==================================================
          RESULTS COUNT & SORT BAR
      ================================================== */}
      <View style={styles.resultsHeaderRow}>
        <Text style={styles.resultsCountText}>
          {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available for Video Call
        </Text>
        <Text style={styles.sortedByText}>
          Sorted: {sortBy === 'earliest' ? 'Earliest Slot' : sortBy === 'rating' ? 'Highest Rated' : sortBy === 'experience' ? 'Most Experienced' : 'Lowest Fee'}
        </Text>
      </View>

      {/* ==================================================
          DOCTORS LIST
      ================================================== */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Online Doctors Found</Text>
            <Text style={styles.emptySubtitle}>
              Try changing the specialty or reset your language and experience filters.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearch('');
                setSelectedSpecialty('all');
                resetFilters();
              }}
            >
              <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ==================================================
          DOCTOR BIO / QUICK PROFILE MODAL
      ================================================== */}
      <Modal
        visible={!!profileDoctor}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileDoctor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Doctor Information</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setProfileDoctor(null)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {profileDoctor && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.modalProfileHeader}>
                  <Image source={{ uri: profileDoctor.image }} style={styles.modalAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.modalDocName}>{profileDoctor.name}</Text>
                    <Text style={styles.modalDocSpec}>{profileDoctor.specialty}</Text>
                    <Text style={styles.modalDocQual}>{profileDoctor.qualification}</Text>
                    <View style={styles.modalExpBadge}>
                      <Ionicons name="ribbon" size={12} color="#D97706" />
                      <Text style={styles.modalExpBadgeText}>{profileDoctor.experience}</Text>
                    </View>
                  </View>
                </View>

                {/* STATS */}
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatCol}>
                    <Text style={styles.modalStatVal}>{profileDoctor.rating} ★</Text>
                    <Text style={styles.modalStatSub}>{profileDoctor.reviewCount} Reviews</Text>
                  </View>
                  <View style={styles.modalStatDiv} />
                  <View style={styles.modalStatCol}>
                    <Text style={styles.modalStatVal}>{profileDoctor.videoConsultCount}+</Text>
                    <Text style={styles.modalStatSub}>Video Calls</Text>
                  </View>
                  <View style={styles.modalStatDiv} />
                  <View style={styles.modalStatCol}>
                    <Text style={[styles.modalStatVal, { color: colors.primary }]}>₹{profileDoctor.fee}</Text>
                    <Text style={styles.modalStatSub}>Consult Fee</Text>
                  </View>
                </View>

                {/* ABOUT */}
                <Text style={styles.modalSectionTitle}>About Doctor</Text>
                <Text style={styles.modalAboutText}>{profileDoctor.about}</Text>

                {/* SERVICES */}
                {profileDoctor.services && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.modalSectionTitle}>Tele-Health Inclusions</Text>
                    {profileDoctor.services.map((s, idx) => (
                      <View key={idx} style={styles.modalServiceItem}>
                        <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                        <Text style={styles.modalServiceText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* PROCEED BUTTON */}
                <TouchableOpacity
                  style={styles.modalBookBtn}
                  activeOpacity={0.88}
                  onPress={() => {
                    const doc = profileDoctor;
                    setProfileDoctor(null);
                    navigation.navigate('VideoBooking', { doctor: doc });
                  }}
                >
                  <Ionicons name="videocam" size={18} color="#FFFFFF" />
                  <Text style={styles.modalBookBtnText}>Proceed to Book Video Slot</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================
          FILTERS & SORT BOTTOM SHEET / MODAL
      ================================================== */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheetCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Filter & Sort Video Doctors</Text>
                <Text style={styles.modalHeaderSub}>Refine by Specialization, Language & Fee</Text>
              </View>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetTextBtn}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* 1. DOCTOR SPECIALIZATION */}
              <Text style={styles.filterGroupTitle}>Doctor Specialization</Text>
              <View style={styles.filterOptionsGrid}>
                {videoSpecialties.map((spec) => {
                  const isSelected = selectedSpecialty === spec.id;
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={[
                        styles.filterOptionPill,
                        { flexDirection: 'row', alignItems: 'center' },
                        isSelected && styles.filterOptionPillActive,
                      ]}
                      onPress={() => setSelectedSpecialty(spec.id)}
                    >
                      <Ionicons
                        name={spec.icon}
                        size={13}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextActive,
                        ]}
                      >
                        {spec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. LANGUAGE SPOKEN */}
              <Text style={styles.filterGroupTitle}>Language Spoken</Text>
              <View style={styles.filterOptionsGrid}>
                {LANGUAGES_LIST.map((lang) => {
                  const isSelected = selectedLanguage === lang;
                  return (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setSelectedLanguage(lang)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. EXPERIENCE */}
              <Text style={styles.filterGroupTitle}>Doctor's Experience</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Any Experience', value: 'all' },
                  { label: '5+ Years', value: '5' },
                  { label: '10+ Years', value: '10' },
                  { label: '15+ Years', value: '15' },
                ].map((opt) => {
                  const isSelected = minExperience === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setMinExperience(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. FEE RANGE */}
              <Text style={styles.filterGroupTitle}>Consultation Fee</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Any Fee', value: 'all' },
                  { label: 'Under ₹500', value: '500' },
                  { label: 'Under ₹700', value: '700' },
                ].map((opt) => {
                  const isSelected = maxFee === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setMaxFee(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. SORT BY */}
              <Text style={styles.filterGroupTitle}>Sort Results By</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Earliest Slot', value: 'earliest' },
                  { label: 'Highest Rated', value: 'rating' },
                  { label: 'Most Experienced', value: 'experience' },
                  { label: 'Fee: Low to High', value: 'fee' },
                ].map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setSortBy(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 6. ONLY AVAILABLE TODAY TOGGLE */}
              <TouchableOpacity
                style={styles.toggleRow}
                activeOpacity={0.8}
                onPress={() => setOnlyAvailableToday(!onlyAvailableToday)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Available Today Only</Text>
                  <Text style={styles.toggleSub}>Show doctors taking instant video appointments today</Text>
                </View>
                <View
                  style={[
                    styles.toggleSwitch,
                    onlyAvailableToday && styles.toggleSwitchActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      onlyAvailableToday && styles.toggleKnobActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              activeOpacity={0.88}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyFilterBtnText}>
                Show {filteredDoctors.length} Online Doctors
              </Text>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.secondary,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginLeft: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  filterHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterHeaderBtnActive: {
    backgroundColor: colors.secondary,
  },
  filterBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.coral,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // HERO BANNER
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 14,
  },
  heroContent: {},
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    gap: 4,
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  heroDesc: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
    fontWeight: '500',
  },

  // SEARCH BAR
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },
  filterTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  filterTriggerPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterTriggerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  filterTriggerPillTextActive: {
    color: '#FFFFFF',
  },

  // SPECIALTIES SCROLL
  specialtyContainer: {
    paddingVertical: 6,
  },
  specialtiesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  specialtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 5,
  },
  specialtyPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  specialtyPillTextActive: {
    color: '#FFFFFF',
  },

  // RESULTS HEADER
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 6,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  sortedByText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // LIST & CARD
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  discountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },

  // DOCTOR MAIN ROW
  doctorMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  doctorInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  qualificationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  experienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  experienceChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  reviewsCountText: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // LANGUAGES
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 5,
  },
  languagesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  languagesText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
  },

  // SLOT & FEE
  slotAndFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  slotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  feeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  mrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },

  // CARD ACTIONS
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bioButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  bookVideoButton: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bookVideoButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // EMPTY
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // MODAL OVERLAY
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // PROFILE QUICK MODAL
  profileModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  modalDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  modalDocSpec: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  modalDocQual: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  modalExpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  modalExpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  modalStatCol: {
    alignItems: 'center',
  },
  modalStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  modalStatSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalStatDiv: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 4,
  },
  modalAboutText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
    marginBottom: 8,
  },
  modalServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalServiceText: {
    fontSize: 11,
    color: colors.text,
  },
  modalBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  modalBookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // FILTER SHEET
  filterSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  resetTextBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.coral,
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionPillActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.primary,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },

  applyFilterBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default VideoConsultationScreen;