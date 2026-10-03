import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { videoDoctors, videoSpecialties, SPECIALIZATION_CATEGORIES } from '../../../data/videoDoctors';
import inPersonDoctors, { doctorSpecialties as inPersonSpecialties } from '../../../data/doctors';
import colors from '../../../theme/colors';
import WebFooter from '../../../components/web/WebFooter';
import DoctorBookingModal from '../../../components/booking/DoctorBookingModal';

const LANGUAGES_LIST = ['All', 'English', 'Kannada', 'Hindi', 'Telugu', 'Malayalam'];

const VideoConsultationScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;
  const isTablet = width >= 600;
  const scrollViewRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const DOCTORS_PER_PAGE = 4;

  const initialSearch = route?.params?.query || route?.params?.search || '';
  const [search, setSearch] = useState(initialSearch);
  const [consultationMode, setConsultationMode] = useState(route?.params?.mode || 'online'); // 'online' | 'physical'

  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearch(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearch(route.params.search);
    }
  }, [route?.params?.query, route?.params?.search]);

  const [selectedSpecialty, setSelectedSpecialty] = useState(route?.params?.specialty || route?.params?.categoryId || 'all');
  const [sidebarSpecSearch, setSidebarSpecSearch] = useState('');
  const [modalSpecSearch, setModalSpecSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    'general-primary': true,
    'cardiology-group': true,
  });

  useEffect(() => {
    if (route?.params?.specialty !== undefined) {
      setSelectedSpecialty(route.params.specialty);
    } else if (route?.params?.categoryId !== undefined) {
      setSelectedSpecialty(route.params.categoryId);
    }
  }, [route?.params?.specialty, route?.params?.categoryId]);

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Filter & Sort state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [minExperience, setMinExperience] = useState('all'); // 'all' | '5' | '10' | '15'
  const [maxFee, setMaxFee] = useState('all'); // 'all' | '500' | '700'
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'rating' | 'experience' | 'fee' | 'earliest'

  const getSortLabel = (id) => {
    switch (id) {
      case 'rating': return 'Top Rated';
      case 'experience': return 'Experience';
      case 'fee': return 'Lowest Fee';
      case 'earliest': return 'Earliest';
      default: return 'Nearest';
    }
  };

  // Selected Doctor for Profile Quick View Modal
  const [profileDoctor, setProfileDoctor] = useState(null);

  // Selected Doctor for Video Booking Modal
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);

  // Active filters count (excluding sort, as Sort has its own dedicated button)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSpecialty !== 'all') count++;
    if (selectedLanguage !== 'All') count++;
    if (minExperience !== 'all') count++;
    if (maxFee !== 'all') count++;
    if (onlyAvailableToday) count++;
    return count;
  }, [selectedSpecialty, selectedLanguage, minExperience, maxFee, onlyAvailableToday]);

  const resetFilters = () => {
    setSelectedSpecialty('all');
    setSelectedLanguage('All');
    setMinExperience('all');
    setMaxFee('all');
    setOnlyAvailableToday(false);
    setSortBy('nearest');
  };

  // Active Specialties for Video Consultation
  const activeSpecialties = videoSpecialties;

  // Filtered & Sorted Doctors
  const filteredDoctors = useMemo(() => {
    let result = videoDoctors.filter((doc) => {
      // 1. Search
      const matchesSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
        (doc.languages && doc.languages.some((l) => l.toLowerCase().includes(search.toLowerCase()))) ||
        (doc.about && doc.about.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Specialty
      if (selectedSpecialty !== 'all') {
        const specObj = videoSpecialties.find(
          (s) => s.id === selectedSpecialty || s.key === selectedSpecialty
        );
        const catObj = SPECIALIZATION_CATEGORIES.find((c) => c.id === selectedSpecialty);

        const matchesKey =
          doc.specialtyKey === selectedSpecialty ||
          (specObj && (doc.specialtyKey === specObj.key || doc.specialtyKey === specObj.id));

        const matchesName =
          doc.specialty &&
          (doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase() ||
            (specObj &&
              (doc.specialty.toLowerCase().includes(specObj.name.toLowerCase()) ||
                specObj.name.toLowerCase().includes(doc.specialty.toLowerCase()))));

        const matchesCategory =
          (doc.categoryId && doc.categoryId === selectedSpecialty) ||
          (catObj &&
            (doc.categoryId === catObj.id ||
              catObj.specialties.some(
                (s) =>
                  s.key === doc.specialtyKey ||
                  s.id === doc.specialtyKey ||
                  (doc.specialty && doc.specialty.toLowerCase().includes(s.name.toLowerCase()))
              )));

        if (!matchesKey && !matchesName && !matchesCategory) {
          return false;
        }
      }

      // 3. Language
      if (selectedLanguage !== 'All' && doc.languages && !doc.languages.includes(selectedLanguage)) {
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
      if (sortBy === 'nearest') {
        return (a.distanceKm || 99) - (b.distanceKm || 99);
      }
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

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSpecialty, selectedLanguage, minExperience, maxFee, onlyAvailableToday, sortBy]);

  const totalDoctors = filteredDoctors.length;
  const totalPages = Math.max(1, Math.ceil(totalDoctors / DOCTORS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedDoctors = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * DOCTORS_PER_PAGE;
    return filteredDoctors.slice(startIndex, startIndex + DOCTORS_PER_PAGE);
  }, [filteredDoctors, safeCurrentPage]);

  const renderDoctor = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Doctor Info Row */}
        <TouchableOpacity
          style={styles.doctorMainRow}
          activeOpacity={0.88}
          onPress={() => setProfileDoctor(item)}
        >
          <Image source={{ uri: item.image }} style={styles.avatar} />

          <View style={styles.doctorInfoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.doctorName} numberOfLines={1}>{item.name}</Text>
              <Ionicons name="checkmark-circle" size={15} color="#007D69" style={{ marginLeft: 4 }} />
            </View>

            <Text style={styles.specialtyText} numberOfLines={1}>
              {item.specialty} • {item.experience}
            </Text>

            {/* Price, Rating, Next Available Slot */}
            <View style={styles.metricsRow}>
              <Text style={styles.feeAmount}>₹{item.fee}</Text>

              <Text style={styles.metricsBullet}>•</Text>

              <View style={styles.ratingChip}>
                <Ionicons name="star" size={12} color="#FFA000" />
                <Text style={styles.ratingChipText}>{item.rating}</Text>
              </View>

              <Text style={styles.metricsBullet}>•</Text>

              <View style={styles.slotBox}>
                <Ionicons name="videocam" size={12} color={item.availableToday ? '#007D69' : '#0284C7'} />
                <Text style={[styles.slotText, item.availableToday && { color: '#007D69', fontWeight: '700' }]}>
                  {item.availableToday ? 'Today' : 'Tomorrow'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Clear Action Row: View Details & Book Video Call */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.bioButton}
            activeOpacity={0.82}
            onPress={() => setProfileDoctor(item)}
          >
            <Text style={styles.bioButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookVideoButton}
            activeOpacity={0.88}
            onPress={() => setSelectedDoctorForBooking(item)}
          >
            <Ionicons name="videocam" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.bookVideoButtonText}>Book Video Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // DESKTOP LEFT FILTER SIDEBAR
  const renderDesktopSidebar = () => (
    <View style={styles.desktopSidebarCard}>
      {/* 1. Header Row */}
      <View style={styles.sidebarHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="options" size={18} color="#1E3A8A" />
          <Text style={styles.sidebarTitle}>Filters</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.sidebarBadge}>
              <Text style={styles.sidebarBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={resetFilters} activeOpacity={0.7}>
          <Text style={styles.sidebarResetLink}>Reset All</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Availability Today Toggle */}
      <View style={styles.sidebarSection}>
        <TouchableOpacity
          style={styles.sidebarToggleCard}
          onPress={() => setOnlyAvailableToday(!onlyAvailableToday)}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.sidebarDot, onlyAvailableToday && { backgroundColor: '#10B981' }]} />
              <Text style={styles.sidebarToggleTitle}>Available Today</Text>
            </View>
            <Text style={styles.sidebarToggleSub}>Instant 15-min HD video calls</Text>
          </View>
          <View style={[styles.miniSwitch, onlyAvailableToday && styles.miniSwitchActive]}>
            <View style={[styles.miniKnob, onlyAvailableToday && styles.miniKnobActive]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. Doctor Specialization */}
      <View style={styles.sidebarSection}>
        <View style={styles.sidebarSectionHeaderRow}>
          <Text style={styles.sidebarSectionTitle}>Specialization ({videoSpecialties.length - 1})</Text>
          {selectedSpecialty !== 'all' && (
            <TouchableOpacity onPress={() => setSelectedSpecialty('all')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.sidebarClearSpecLink}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* In-sidebar search input */}
        <View style={styles.sidebarSpecSearchBox}>
          <Ionicons name="search-outline" size={13} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.sidebarSpecSearchInput}
            placeholder="Search 80+ specializations..."
            placeholderTextColor="#94A3B8"
            value={sidebarSpecSearch}
            onChangeText={setSidebarSpecSearch}
          />
          {sidebarSpecSearch.length > 0 && (
            <TouchableOpacity onPress={() => setSidebarSpecSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* If searching within specializations */}
        {sidebarSpecSearch.trim() !== '' ? (
          <ScrollView
            style={styles.sidebarSpecScrollList}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {/* Full Category matches in search */}
            {SPECIALIZATION_CATEGORIES
              .filter((c) => c.name.toLowerCase().includes(sidebarSpecSearch.toLowerCase()))
              .map((cat) => {
                const isSelected = selectedSpecialty === cat.id;
                return (
                  <TouchableOpacity
                    key={`cat-${cat.id}`}
                    style={[styles.sidebarSpecialtyRow, styles.sidebarFullCatSearchRow, isSelected && styles.sidebarSpecialtyRowActive]}
                    onPress={() => setSelectedSpecialty(isSelected ? 'all' : cat.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={cat.icon || 'layers-outline'}
                      size={14}
                      color={isSelected ? '#00B894' : '#0D9488'}
                      style={{ width: 16 }}
                    />
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text
                        style={[styles.sidebarSpecialtyText, { fontWeight: '700', color: isSelected ? '#00B894' : '#0F766E' }]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                      <Text style={styles.sidebarSpecCategoryHint} numberOfLines={1}>
                        {cat.specialties.length} specializations
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={14} color="#00B894" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}

            {/* Individual sub-specialty matches */}
            {videoSpecialties
              .filter(
                (s) =>
                  s.id !== 'all' &&
                  (s.name.toLowerCase().includes(sidebarSpecSearch.toLowerCase()) ||
                    (s.categoryName && s.categoryName.toLowerCase().includes(sidebarSpecSearch.toLowerCase())))
              )
              .map((spec) => {
                const isSelected = selectedSpecialty === spec.id || selectedSpecialty === spec.key;
                return (
                  <TouchableOpacity
                    key={spec.id}
                    style={[styles.sidebarSpecialtyRow, isSelected && styles.sidebarSpecialtyRowActive]}
                    onPress={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={spec.icon || 'videocam-outline'}
                      size={13}
                      color={isSelected ? '#00B894' : '#64748B'}
                      style={{ width: 16 }}
                    />
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text
                        style={[styles.sidebarSpecialtyText, isSelected && styles.sidebarSpecialtyTextActive]}
                        numberOfLines={1}
                      >
                        {spec.name}
                      </Text>
                      {spec.categoryName && (
                        <Text style={styles.sidebarSpecCategoryHint} numberOfLines={1}>
                          {spec.categoryName}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={14} color="#00B894" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        ) : (
          /* Categorized Accordion List */
          <ScrollView
            style={styles.sidebarSpecScrollList}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {/* All Specializations Option */}
            <TouchableOpacity
              style={[
                styles.sidebarSpecialtyRow,
                selectedSpecialty === 'all' && styles.sidebarSpecialtyRowActive,
                { marginBottom: 4 },
              ]}
              onPress={() => setSelectedSpecialty('all')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="videocam-outline"
                size={14}
                color={selectedSpecialty === 'all' ? '#00B894' : '#64748B'}
                style={{ width: 18 }}
              />
              <Text
                style={[
                  styles.sidebarSpecialtyText,
                  selectedSpecialty === 'all' && styles.sidebarSpecialtyTextActive,
                ]}
              >
                All Specializations
              </Text>
              {selectedSpecialty === 'all' && (
                <Ionicons name="checkmark-circle" size={14} color="#00B894" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>

            {SPECIALIZATION_CATEGORIES.map((cat) => {
              const isExpanded = !!expandedCategories[cat.id];
              const isFullCatSelected = selectedSpecialty === cat.id;
              const hasActiveChild = cat.specialties.some(
                (s) => s.id === selectedSpecialty || s.key === selectedSpecialty
              );
              const isCategoryActive = isFullCatSelected || hasActiveChild;

              return (
                <View key={cat.id} style={styles.sidebarCategoryGroup}>
                  {/* Category Header Row */}
                  <View
                    style={[
                      styles.sidebarCategoryHeader,
                      isCategoryActive && styles.sidebarCategoryHeaderActive,
                    ]}
                  >
                    {/* Selectable category button to select the whole specialization section */}
                    <TouchableOpacity
                      style={styles.sidebarCategorySelectBtn}
                      onPress={() => {
                        if (isFullCatSelected) {
                          setSelectedSpecialty('all');
                        } else {
                          setSelectedSpecialty(cat.id);
                          if (!isExpanded) {
                            toggleCategory(cat.id);
                          }
                        }
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={cat.icon || 'medkit-outline'}
                        size={15}
                        color={isCategoryActive ? '#00B894' : '#64748B'}
                        style={{ marginRight: 8, width: 16 }}
                      />
                      <Text
                        style={[
                          styles.sidebarCategoryTitle,
                          isCategoryActive && styles.sidebarCategoryTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                      {isFullCatSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color="#00B894"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </TouchableOpacity>

                    {/* Expand/Collapse Chevron Button */}
                    <TouchableOpacity
                      style={styles.sidebarCategoryExpandBtn}
                      onPress={() => toggleCategory(cat.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View style={[styles.sidebarCategoryBadge, isCategoryActive && styles.sidebarCategoryBadgeActive]}>
                        <Text style={[styles.sidebarCategoryCount, isCategoryActive && styles.sidebarCategoryCountActive]}>
                          {cat.specialties.length}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={isCategoryActive ? '#00B894' : '#94A3B8'}
                        style={{ marginLeft: 2 }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Expanded Sub-options (Clean individual sub-specialties) */}
                  {isExpanded && (
                    <View style={styles.sidebarCategoryChildren}>
                      {/* Individual sub-specialties */}
                      {cat.specialties.map((spec) => {
                        const isSelected =
                          selectedSpecialty === spec.id || selectedSpecialty === spec.key;
                        return (
                          <TouchableOpacity
                            key={spec.id}
                            style={[
                              styles.sidebarChildSpecRow,
                              isSelected && styles.sidebarChildSpecRowActive,
                            ]}
                            onPress={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                            activeOpacity={0.75}
                          >
                            <Ionicons
                              name={spec.icon || 'ellipse'}
                              size={12}
                              color={isSelected ? '#00B894' : '#64748B'}
                              style={{ width: 14 }}
                            />
                            <Text
                              style={[
                                styles.sidebarChildSpecText,
                                isSelected && styles.sidebarChildSpecTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {spec.name}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={13}
                                color="#00B894"
                                style={{ marginLeft: 'auto' }}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 4. Consultation Fee */}
      <View style={styles.sidebarSection}>
        <Text style={styles.sidebarSectionTitle}>Consultation Fee</Text>
        <View style={styles.sidebarOptionsCol}>
          {[
            { label: 'All Fees', value: 'all' },
            { label: 'Under ₹500', value: '500' },
            { label: 'Under ₹700', value: '700' },
          ].map((opt) => {
            const isSelected = maxFee === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={styles.sidebarRadioRow}
                onPress={() => setMaxFee(opt.value)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={isSelected ? '#00B894' : '#94A3B8'}
                />
                <Text style={[styles.sidebarOptionText, isSelected && styles.sidebarOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. Doctor Experience */}
      <View style={styles.sidebarSection}>
        <Text style={styles.sidebarSectionTitle}>Experience</Text>
        <View style={styles.sidebarOptionsCol}>
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
                style={styles.sidebarRadioRow}
                onPress={() => setMinExperience(opt.value)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={isSelected ? '#00B894' : '#94A3B8'}
                />
                <Text style={[styles.sidebarOptionText, isSelected && styles.sidebarOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. Language Spoken */}
      <View style={styles.sidebarSection}>
        <Text style={styles.sidebarSectionTitle}>Language Spoken</Text>
        <View style={styles.sidebarLanguageWrap}>
          {LANGUAGES_LIST.map((lang) => {
            const isSelected = selectedLanguage === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.sidebarLangPill, isSelected && styles.sidebarLangPillActive]}
                onPress={() => setSelectedLanguage(lang)}
                activeOpacity={0.75}
              >
                <Text style={[styles.sidebarLangPillText, isSelected && styles.sidebarLangPillTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 7. Sort By */}
      <View style={[styles.sidebarSection, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
        <Text style={styles.sidebarSectionTitle}>Sort Doctors</Text>
        <View style={styles.sidebarOptionsCol}>
          {[
            { label: 'Nearest Doctor', value: 'nearest' },
            { label: 'Highest Rated', value: 'rating' },
            { label: 'Most Experienced', value: 'experience' },
            { label: 'Fee: Low to High', value: 'fee' },
            { label: 'Earliest Slot', value: 'earliest' },
          ].map((opt) => {
            const isSelected = sortBy === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={styles.sidebarRadioRow}
                onPress={() => setSortBy(opt.value)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={isSelected ? '#00B894' : '#94A3B8'}
                />
                <Text style={[styles.sidebarOptionText, isSelected && styles.sidebarOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={isDesktopWeb}
      >
        {/* ==================================================
            HEADER (Mobile Only)
        ================================================== */}
        {!isDesktopWeb && (
          <View style={[styles.header, isTablet && { maxWidth: 780, width: '100%', alignSelf: 'center' }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={colors.secondary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              {Platform.OS === 'ios' ? (
                <View style={styles.headerCenterIos}>
                  <Text
                    style={styles.headerTitleIos}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    Doctor Video Consultations
                  </Text>
                  <Text style={styles.headerSubtitleIos} numberOfLines={1}>
                    Consult Top Certified Doctors
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>
                      Doctor Video Consultations
                    </Text>
                    <View style={[styles.liveDot, { backgroundColor: '#00B894' }]} />
                  </View>
                  <Text style={styles.headerSubtitle}>
                    Consult Top Certified Doctors
                  </Text>
                </View>
              )}
            </View>

            {/* Quick access to My Online Consultations Hub */}
            <TouchableOpacity
              style={styles.myConsultationsHeaderBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyOnlineConsultations')}
            >
              <Ionicons name="videocam-outline" size={15} color="#007D69" style={{ marginRight: 4 }} />
              <Text style={styles.myConsultationsHeaderText}>My Calls</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================
            SEARCH BAR (Desktop & Mobile)
        ================================================== */}
        <View style={[styles.searchBarContainer, isDesktopWeb && styles.searchBarContainerDesktop, isTablet && !isDesktopWeb && { maxWidth: 780, width: '100%', alignSelf: 'center' }]}>
          <View style={[styles.searchBox, isDesktopWeb && styles.searchBoxDesktop]}>
            <Ionicons name="search-outline" size={19} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, isDesktopWeb && { fontSize: 14.5 }]}
              placeholder="Search doctors by name, specialty, or clinic..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4, marginRight: 6 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
            {isDesktopWeb && (
              <TouchableOpacity
                style={styles.desktopSearchActionBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.desktopSearchActionBtnText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ==================================================
            CLEAN CONTROL SECTION: [ Filter ]   [ Sort ]
            (Only ONE Filter button on the entire screen!)
        ================================================== */}
        {!isDesktopWeb && (
          <View style={[styles.controlBarContainer, isTablet && { maxWidth: 780, width: '100%', alignSelf: 'center' }]}>
            <TouchableOpacity
              style={[styles.controlBtn, activeFiltersCount > 0 && styles.controlBtnActive]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={activeFiltersCount > 0 ? '#FFFFFF' : '#007D69'}
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.controlBtnText, activeFiltersCount > 0 && styles.controlBtnTextActive]}>
                Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, sortBy !== 'nearest' && styles.controlBtnActive]}
              onPress={() => setSortModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={16}
                color={sortBy !== 'nearest' ? '#FFFFFF' : '#007D69'}
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.controlBtnText, sortBy !== 'nearest' && styles.controlBtnTextActive]}>
                Sort{sortBy !== 'nearest' ? `: ${getSortLabel(sortBy)}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================
            MAIN CONTENT AREA: DESKTOP 2-COLUMN (VISIBLE FILTER SIDEBAR + DOCTORS LIST)
        ================================================== */}
        <View style={[styles.mainLayoutWrap, isDesktopWeb && styles.mainLayoutWrapDesktop, isTablet && !isDesktopWeb && { maxWidth: 780, width: '100%', alignSelf: 'center' }]}>
          {/* Left Filter Sidebar - Visible on Desktop! */}
          {isDesktopWeb && (
            <View style={styles.desktopSidebarCol}>
              {renderDesktopSidebar()}
            </View>
          )}

          {/* Right Content Column: Results count & Doctors Cards */}
          <View style={[styles.doctorsColWrap, isDesktopWeb && styles.doctorsColWrapDesktop]}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.sectionHeadingTitle}>Available Doctors</Text>
              <Text style={styles.resultsCountText}>
                {totalDoctors} {totalDoctors === 1 ? 'doctor' : 'doctors'}
              </Text>
            </View>

            {selectedSpecialty !== 'all' && (
              <View style={styles.activeSpecChipRow}>
                <View style={styles.activeSpecChip}>
                  <Text style={styles.activeSpecChipLabel}>Specialty:</Text>
                  <Text style={styles.activeSpecChipValue}>
                    {SPECIALIZATION_CATEGORIES.find((c) => c.id === selectedSpecialty)
                      ? SPECIALIZATION_CATEGORIES.find((c) => c.id === selectedSpecialty).name
                      : videoSpecialties.find((s) => s.id === selectedSpecialty || s.key === selectedSpecialty)?.name || selectedSpecialty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedSpecialty('all')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 6 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#00B894" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.clearAllFiltersText}>Reset Filter</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredDoctors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="videocam-off-outline"
                  size={54}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyTitle}>
                  No Online Doctors Found
                </Text>
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
            ) : (
              <>
                <View style={styles.doctorsCardsList}>
                  {paginatedDoctors.map((doc) => (
                    <View key={`video-${doc.id}`}>
                      {renderDoctor({ item: doc })}
                    </View>
                  ))}
                </View>

                {/* PAGINATION (5 DOCTORS PER PAGE) */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[styles.pageNavBtn, safeCurrentPage === 1 && styles.pageNavBtnDisabled]}
                      onPress={() => {
                        if (safeCurrentPage > 1) {
                          setCurrentPage(safeCurrentPage - 1);
                          scrollViewRef.current?.scrollTo({ y: isDesktopWeb ? 90 : 140, animated: true });
                        }
                      }}
                      disabled={safeCurrentPage === 1}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chevron-back" size={16} color={safeCurrentPage === 1 ? '#94A3B8' : '#0F172A'} />
                      <Text style={[styles.pageNavBtnText, safeCurrentPage === 1 && styles.pageNavBtnTextDisabled]}>
                        Previous
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.pageNumbersWrap}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isActive = pageNum === safeCurrentPage;
                        return (
                          <TouchableOpacity
                            key={`page-${pageNum}`}
                            style={[styles.pageNumberBtn, isActive && styles.pageNumberBtnActive]}
                            onPress={() => {
                              setCurrentPage(pageNum);
                              scrollViewRef.current?.scrollTo({ y: isDesktopWeb ? 90 : 140, animated: true });
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.pageNumberText, isActive && styles.pageNumberTextActive]}>
                              {pageNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[styles.pageNavBtn, safeCurrentPage === totalPages && styles.pageNavBtnDisabled]}
                      onPress={() => {
                        if (safeCurrentPage < totalPages) {
                          setCurrentPage(safeCurrentPage + 1);
                          scrollViewRef.current?.scrollTo({ y: isDesktopWeb ? 90 : 140, animated: true });
                        }
                      }}
                      disabled={safeCurrentPage === totalPages}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pageNavBtnText, safeCurrentPage === totalPages && styles.pageNavBtnTextDisabled]}>
                        Next
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={safeCurrentPage === totalPages ? '#94A3B8' : '#0F172A'} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

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
          <View style={[styles.profileModalCard, isTablet && styles.tabletModalWidth]}>
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
                      <Ionicons name="ribbon" size={12} color="#1E3A8A" />
                      <Text style={styles.modalExpBadgeText}>{profileDoctor.experience}</Text>
                    </View>
                  </View>
                </View>

                {/* STATS */}
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatCol}>
                    <Text style={styles.modalStatVal}>{profileDoctor.rating}/5</Text>
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
                    setSelectedDoctorForBooking(doc);
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
          <View style={[styles.filterSheetCard, isTablet && styles.tabletModalWidth]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Filter Doctors</Text>
                <Text style={styles.modalHeaderSub}>Refine by Specialization, Language & Fee</Text>
              </View>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetTextBtn}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* 1. DOCTOR SPECIALIZATION */}
              <View style={styles.modalSpecHeaderRow}>
                <Text style={styles.filterGroupTitle}>Doctor Specialization ({videoSpecialties.length - 1})</Text>
                {selectedSpecialty !== 'all' && (
                  <TouchableOpacity onPress={() => setSelectedSpecialty('all')}>
                    <Text style={styles.modalClearSpecLink}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Search within specializations in mobile modal */}
              <View style={styles.modalSpecSearchBox}>
                <Ionicons name="search-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.modalSpecSearchInput}
                  placeholder="Search 80+ specializations..."
                  placeholderTextColor="#94A3B8"
                  value={modalSpecSearch}
                  onChangeText={setModalSpecSearch}
                />
                {modalSpecSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setModalSpecSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="close-circle" size={15} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.filterOptionsGrid}>
                {modalSpecSearch.trim() !== '' ? (
                  <>
                    {/* Matching Full Categories */}
                    {SPECIALIZATION_CATEGORIES
                      .filter((c) => c.name.toLowerCase().includes(modalSpecSearch.toLowerCase()))
                      .map((cat) => {
                        const isSelected = selectedSpecialty === cat.id;
                        return (
                          <TouchableOpacity
                            key={`modal-cat-${cat.id}`}
                            style={[
                              styles.filterOptionPill,
                              styles.modalFullCatPill,
                              isSelected && styles.filterOptionPillActive,
                            ]}
                            onPress={() => setSelectedSpecialty(isSelected ? 'all' : cat.id)}
                          >
                            <Ionicons
                              name={cat.icon || 'layers-outline'}
                              size={13}
                              color={isSelected ? colors.primary : '#0D9488'}
                              style={{ marginRight: 5 }}
                            />
                            <Text
                              style={[
                                styles.filterOptionText,
                                { fontWeight: '700' },
                                isSelected && styles.filterOptionTextActive,
                              ]}
                            >
                              All {cat.name} (Full)
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                    {/* Matching Sub-specialties */}
                    {videoSpecialties
                      .filter(
                        (s) =>
                          s.id !== 'all' &&
                          (s.name.toLowerCase().includes(modalSpecSearch.toLowerCase()) ||
                            (s.categoryName && s.categoryName.toLowerCase().includes(modalSpecSearch.toLowerCase())))
                      )
                      .map((spec) => {
                        const isSelected = selectedSpecialty === spec.id || selectedSpecialty === spec.key;
                        return (
                          <TouchableOpacity
                            key={spec.id}
                            style={[
                              styles.filterOptionPill,
                              { flexDirection: 'row', alignItems: 'center' },
                              isSelected && styles.filterOptionPillActive,
                            ]}
                            onPress={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                          >
                            <Ionicons
                              name={spec.icon || 'videocam-outline'}
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
                  </>
                ) : (
                  <>
                    {/* All Option */}
                    <TouchableOpacity
                      style={[
                        styles.filterOptionPill,
                        selectedSpecialty === 'all' && styles.filterOptionPillActive,
                      ]}
                      onPress={() => setSelectedSpecialty('all')}
                    >
                      <Ionicons
                        name="videocam-outline"
                        size={13}
                        color={selectedSpecialty === 'all' ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedSpecialty === 'all' && styles.filterOptionTextActive,
                        ]}
                      >
                        All Specializations
                      </Text>
                    </TouchableOpacity>

                    {/* Top Full Categories */}
                    {SPECIALIZATION_CATEGORIES.slice(0, 6).map((cat) => {
                      const isSelected = selectedSpecialty === cat.id;
                      return (
                        <TouchableOpacity
                          key={`modal-full-${cat.id}`}
                          style={[
                            styles.filterOptionPill,
                            styles.modalFullCatPill,
                            isSelected && styles.filterOptionPillActive,
                          ]}
                          onPress={() => setSelectedSpecialty(isSelected ? 'all' : cat.id)}
                        >
                          <Ionicons
                            name={cat.icon || 'layers-outline'}
                            size={13}
                            color={isSelected ? colors.primary : '#0D9488'}
                            style={{ marginRight: 5 }}
                          />
                          <Text
                            style={[
                              styles.filterOptionText,
                              { fontWeight: '700' },
                              isSelected && styles.filterOptionTextActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Sub-specialties */}
                    {videoSpecialties.slice(1, 15).map((spec) => {
                      const isSelected = selectedSpecialty === spec.id || selectedSpecialty === spec.key;
                      return (
                        <TouchableOpacity
                          key={spec.id}
                          style={[
                            styles.filterOptionPill,
                            { flexDirection: 'row', alignItems: 'center' },
                            isSelected && styles.filterOptionPillActive,
                          ]}
                          onPress={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                        >
                          <Ionicons
                            name={spec.icon || 'videocam-outline'}
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
                  </>
                )}
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

              {/* 5. ONLY AVAILABLE TODAY TOGGLE */}
              <TouchableOpacity
                style={styles.toggleRow}
                activeOpacity={0.8}
                onPress={() => setOnlyAvailableToday(!onlyAvailableToday)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Available Today Only</Text>
                  <Text style={styles.toggleSub}>Instant video consultations today</Text>
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

            {/* Filter Actions: Clear & Apply */}
            <View style={styles.filterModalActionsRow}>
              <TouchableOpacity
                style={styles.filterClearBtn}
                onPress={resetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.filterClearBtnText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterApplyBtn}
                activeOpacity={0.88}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.filterApplyBtnText}>
                  Apply ({filteredDoctors.length} Doctors)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          SORT MODAL / BOTTOM SHEET
      ================================================== */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sortSheetCard, isTablet && styles.tabletModalWidth]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Sort Doctors</Text>
                <Text style={styles.modalHeaderSub}>Choose how you want to order doctors</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSortModalVisible(false)}
                style={styles.modalCloseCircle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptionsList}>
              {[
                { id: 'nearest', label: 'Nearest Doctor', icon: 'location-outline' },
                { id: 'rating', label: 'Top Rated', icon: 'star-outline' },
                { id: 'experience', label: 'Most Experienced', icon: 'ribbon-outline' },
                { id: 'fee', label: 'Fee: Low to High', icon: 'pricetag-outline' },
                { id: 'earliest', label: 'Earliest Slot', icon: 'time-outline' },
              ].map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.sortOptionRow, isSelected && styles.sortOptionRowSelected]}
                    onPress={() => {
                      setSortBy(opt.id);
                      setSortModalVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isSelected ? '#007D69' : '#64748B'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={19}
                      color={isSelected ? '#007D69' : '#CBD5E1'}
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          VIDEO CONSULTATION BOOKING MODAL (MATCHING POPUP DESIGN)
      ================================================== */}
      <DoctorBookingModal
        visible={!!selectedDoctorForBooking}
        onClose={() => setSelectedDoctorForBooking(null)}
        doctor={selectedDoctorForBooking}
        consultationType="Video"
        navigation={navigation}
      />
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
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 95 : 85,
  },
  doctorsCardsList: {
    width: '100%',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 9 : 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  headerCenterIos: {
    justifyContent: 'center',
  },
  headerTitleIos: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: -0.2,
  },
  headerSubtitleIos: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1.5,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
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
  myConsultationsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: Platform.OS === 'ios' ? 10 : 12,
    paddingVertical: Platform.OS === 'ios' ? 6 : 7,
    borderRadius: 16,
  },
  myConsultationsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007D69',
  },

  // CLEAN CONTROL BAR: [ Filter ]   [ Sort ]
  controlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    width: '100%',
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  controlBtnActive: {
    backgroundColor: '#007D69',
    borderColor: '#007D69',
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007D69',
  },
  controlBtnTextActive: {
    color: '#FFFFFF',
  },

  // TABLET WIDTH & MODAL WIDTH
  tabletWidth: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  tabletModalWidth: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  // SORT MODAL SHEET
  sortSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  sortOptionsList: {
    paddingVertical: 10,
    gap: 8,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortOptionRowSelected: {
    backgroundColor: '#E6F4F1',
    borderColor: '#99F6E4',
  },
  sortOptionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  sortOptionLabelSelected: {
    color: '#007D69',
    fontWeight: '800',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // FILTER MODAL ACTIONS
  filterModalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterClearBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterApplyBtn: {
    flex: 2,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#007D69',
    shadowColor: '#007D69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterApplyBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // HERO BANNER
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
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
  searchBarContainerDesktop: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
  },
  searchBoxDesktop: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  desktopSearchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  desktopSearchActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  pageNavBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pageNavBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNumberBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  pageNumberBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  specialtiesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
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
    paddingHorizontal: 0,
    paddingVertical: 4,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  sectionHeadingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sortedByText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  sortPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 2,
  },
  sortPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortPillBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  sortPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  sortPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // MAIN 2-COLUMN LAYOUT
  mainLayoutWrap: {
    width: '100%',
  },
  mainLayoutWrapDesktop: {
    flexDirection: 'row',
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    gap: 24,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  desktopSidebarCol: {
    width: 310,
  },
  doctorsColWrap: {
    width: '100%',
    paddingHorizontal: 16,
  },
  doctorsColWrapDesktop: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
  },

  // DESKTOP SIDEBAR CARD
  desktopSidebarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sidebarBadge: {
    backgroundColor: '#00B894',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sidebarBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sidebarResetLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },
  sidebarSection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sidebarSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sidebarToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  sidebarDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#94A3B8',
  },
  sidebarToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  sidebarToggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  miniSwitch: {
    width: 38,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  miniSwitchActive: {
    backgroundColor: '#00B894',
  },
  miniKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  miniKnobActive: {
    alignSelf: 'flex-end',
  },
  sidebarSpecialtyList: {
    gap: 4,
  },
  sidebarSpecialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sidebarSpecialtyRowActive: {
    backgroundColor: '#F0FDFA',
  },
  sidebarSpecialtyText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginLeft: 4,
  },
  sidebarSpecialtyTextActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  sidebarSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sidebarClearSpecLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  sidebarSpecSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    height: 34,
    marginBottom: 8,
  },
  sidebarSpecSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    paddingVertical: 0,
  },
  sidebarSpecScrollList: {
    maxHeight: 340,
  },
  sidebarSpecCategoryHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  sidebarCategoryGroup: {
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 2,
  },

  sidebarCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  sidebarCategoryHeaderActive: {
    backgroundColor: '#F0FDFA',
  },
  sidebarCategorySelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sidebarCategoryExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sidebarFullActivePill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  sidebarFullActivePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  sidebarFullOptionRow: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 4,
  },
  sidebarFullCatSearchRow: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 4,
  },
  sidebarFullSpecBadgeText: {
    fontSize: 10,
    color: '#0D9488',
    fontWeight: '600',
  },
  sidebarFullSubText: {
    fontSize: 10,
    color: '#0D9488',
    fontWeight: '500',
    marginTop: 1,
  },
  modalFullCatPill: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  sidebarCategoryTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  sidebarCategoryTitleActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  sidebarCategoryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginRight: 4,
  },
  sidebarCategoryBadgeActive: {
    backgroundColor: '#CCFBF1',
  },
  sidebarCategoryCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  sidebarCategoryCountActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  sidebarCategoryChildren: {
    paddingLeft: 12,
    paddingTop: 2,
    paddingBottom: 4,
    gap: 2,
  },
  sidebarChildSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sidebarChildSpecRowActive: {
    backgroundColor: '#CCFBF1',
  },
  sidebarChildSpecText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
    flex: 1,
  },
  sidebarChildSpecTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  modalSpecHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalClearSpecLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  modalSpecSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
  },
  modalSpecSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  activeSpecChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  activeSpecChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeSpecChipLabel: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '500',
    marginRight: 4,
  },
  activeSpecChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF7F50',
  },
  sidebarOptionsCol: {
    gap: 8,
  },
  sidebarRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 3,
  },
  sidebarOptionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  sidebarOptionTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  sidebarLanguageWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sidebarLangPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sidebarLangPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  sidebarLangPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sidebarLangPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // LIST & CARD
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
  },

  // DOCTOR MAIN ROW
  doctorMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    marginRight: 14,
  },
  doctorInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  specialtyText: {
    fontSize: 12.5,
    color: '#007D69',
    fontWeight: '600',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  feeAmount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricsBullet: {
    fontSize: 12,
    color: '#94A3B8',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  slotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007D69',
  },

  // CARD ACTIONS
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  bioButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007D69',
  },
  bookVideoButton: {
    flex: 1.5,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007D69',
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#007D69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookVideoButtonText: {
    fontSize: 13,
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
    alignItems: 'center',
  },

  // PROFILE QUICK MODAL
  profileModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    width: '100%',
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
    backgroundColor: '#EFF6FF',
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
    color: '#1E3A8A',
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
    width: '100%',
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
  webBreadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webBreadcrumbLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  webBreadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  webBreadcrumbQuery: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // Mode Switcher Styles
  modeSelectorWrap: {
    paddingHorizontal: 16,
    marginVertical: 14,
    alignSelf: 'center',
    width: '100%',
  },
  modeSelectorBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modeSelectorTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeSelectorTabActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modeSelectorTabActiveOnline: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modeTextCol: {
    flex: 1,
  },
  modeMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  modeMainTitleActive: {
    color: '#FFFFFF',
  },
  modeSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modeSubTitleActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  quickAltConsultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickAltConsultText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
});

export default VideoConsultationScreen;